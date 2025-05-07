import pytest
from unittest.mock import AsyncMock, MagicMock
from bson import ObjectId
from datetime import datetime
from fastapi import HTTPException

from api.alerts import AlertsAPI


@pytest.mark.asyncio
async def retrieves_alerts_within_timeframe():
    mock_db = AsyncMock()
    mock_db.db["alerts"].find.return_value.__aiter__.return_value = [
        {"_id": ObjectId(), "start_time": datetime(2023, 1, 1), "device_id": ObjectId()},
        {"_id": ObjectId(), "start_time": datetime(2023, 1, 2), "device_id": ObjectId()},
    ]
    api = AlertsAPI()
    api.db = mock_db
    api.get_enriched_alerts = AsyncMock(side_effect=lambda doc: {**doc, "device_name": "Device A"})

    result = await api.get_records_within_timeframe(
        start_time="2023-01-01T00:00:00Z", end_time="2023-01-02T23:59:59Z"
    )
    assert len(result) == 2
    assert result[0]["device_name"] == "Device A"

@pytest.mark.asyncio
async def retrieves_alerts_with_no_timeframe():
    mock_db = AsyncMock()
    mock_db.db["alerts"].find.return_value.__aiter__.return_value = [
        {"_id": ObjectId(), "start_time": datetime(2023, 1, 1), "device_id": ObjectId()},
    ]
    api = AlertsAPI()
    api.db = mock_db
    api.get_enriched_alerts = AsyncMock(side_effect=lambda doc: {**doc, "device_name": "Device B"})

    result = await api.get_records_within_timeframe()
    assert len(result) == 1
    assert result[0]["device_name"] == "Device B"

@pytest.mark.asyncio
async def retrieves_alerts_with_invalid_device_id():
    mock_db = AsyncMock()
    api = AlertsAPI()
    api.db = mock_db

    with pytest.raises(HTTPException):
        await api.get_records_within_timeframe(device_id="invalid_id")

@pytest.mark.asyncio
async def retrieves_alerts_with_no_results():
    mock_db = AsyncMock()
    mock_db.db["alerts"].find.return_value.__aiter__.return_value = []
    api = AlertsAPI()
    api.db = mock_db

    result = await api.get_records_within_timeframe(
        start_time="2023-01-01T00:00:00Z", end_time="2023-01-02T23:59:59Z"
    )
    assert len(result) == 0


import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone


@pytest.mark.anyio
async def create_alert(client: TestClient, auth_token_headers: dict):
    if not hasattr(pytest, 'device_id_api'):  # Reuse device from device tests or create one
        device_res = client.post("/api/device/", json={"name": "Alert Test Device", "type": "Sensor", "model": "M-ALR",
                                                       "location": "Lab Alert", "serial_number": "SN-ALR-001",
                                                       "status": "active"}, headers=auth_token_headers)
        if device_res.status_code != 200:  # or 201
            pytest.fail("Failed to create a prerequisite device for alert test.")
        pytest.alert_test_device_id = device_res.json()["id"]
    else:
        pytest.alert_test_device_id = pytest.device_id_api

    alert_data = AlertCreate(
        device_id=pytest.alert_test_device_id,
        message="Test alert: High temperature detected via API",
        severity="warning",
        timestamp=datetime.now(timezone.utc).isoformat(),
        resolved=False
    ).model_dump()

    response = client.post("/api/alert/", json=alert_data, headers=auth_token_headers)
    assert response.status_code == 200  # or 201
    created_alert = response.json()
    assert created_alert["message"] == alert_data["message"]
    assert "id" in created_alert
    pytest.alert_id_api = created_alert["id"]


@pytest.mark.anyio
async def get_alerts_for_device(client: TestClient, auth_token_headers: dict):
    if not hasattr(pytest, 'alert_test_device_id'):
        pytest.fail("Device ID for alert testing not available.")

    device_id = pytest.alert_test_device_id
    response = client.get(f"/api/alert/device/{device_id}", headers=auth_token_headers)
    assert response.status_code == 200
    alerts = response.json()
    assert isinstance(alerts, list)
    assert len(alerts) > 0
    assert alerts[0]["device_id"] == device_id


@pytest.mark.anyio
async def get_unresolved_alerts(client: TestClient, auth_token_headers: dict):
    # Ensure an unresolved alert exists (created by test_create_alert)
    if not hasattr(pytest, 'alert_id_api'):
        pytest.fail("Alert ID not available for testing unresolved alerts.")

    response = client.get("/api/alert/unresolved", headers=auth_token_headers)
    assert response.status_code == 200
    alerts = response.json()
    assert isinstance(alerts, list)
    assert len(alerts) > 0  # Assuming the previously created alert is still unresolved
    for alert in alerts:
        assert alert["resolved"] is False


@pytest.mark.anyio
async def resolve_alert(client: TestClient, auth_token_headers: dict):
    if not hasattr(pytest, 'alert_id_api'):
        pytest.fail("Alert ID not available for resolving.")

    alert_id = pytest.alert_id_api
    response = client.put(f"/api/alert/{alert_id}/resolve", headers=auth_token_headers)
    assert response.status_code == 200
    resolved_alert = response.json()
    assert resolved_alert["resolved"] is True
    assert resolved_alert["id"] == alert_id