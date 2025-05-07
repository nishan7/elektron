import pytest
from fastapi.testclient import TestClient
from backend.models.models import RecordCreate  # Pydantic models
from datetime import datetime, timezone


@pytest.mark.anyio
async def test_create_record(client: TestClient, auth_token_headers: dict):
    if not hasattr(pytest, 'device_id_api'):
        # Create a dummy device if not created by device tests
        # This makes tests more independent but can be slower.
        # Consider a fixture for a pre-existing device_id.
        device_res = client.post("/api/device/", json={"name": "Record Test Device", "type": "Meter", "model": "M-REC",
                                                       "location": "Lab Rec", "serial_number": "SN-REC-001",
                                                       "status": "active"}, headers=auth_token_headers)
        if device_res.status_code != 200:  # or 201
            pytest.fail("Failed to create a prerequisite device for record test.")
        pytest.record_test_device_id = device_res.json()["id"]
    else:
        pytest.record_test_device_id = pytest.device_id_api

    record_data = RecordCreate(
        device_id=pytest.record_test_device_id,
        timestamp=datetime.now(timezone.utc).isoformat(),  # Ensure ISO format
        power_consumption=10.5,
        voltage=220.5,
        current=0.047,  # Calculated from P=VI approx for testing
        status="normal"
    ).model_dump()

    response = client.post("/api/record/", json=record_data, headers=auth_token_headers)
    assert response.status_code == 200  # Or 201
    created_record = response.json()
    assert created_record["device_id"] == record_data["device_id"]
    assert "id" in created_record
    pytest.record_id_api = created_record["id"]


@pytest.mark.anyio
async def test_get_records_for_device(client: TestClient, auth_token_headers: dict):
    if not hasattr(pytest, 'record_test_device_id'):
        pytest.fail("Device ID for record testing not available.")

    device_id = pytest.record_test_device_id
    response = client.get(f"/api/record/device/{device_id}", headers=auth_token_headers)
    assert response.status_code == 200
    records = response.json()
    assert isinstance(records, list)
    # If test_create_record ran, there should be at least one record
    assert len(records) > 0
    assert records[0]["device_id"] == device_id


@pytest.mark.anyio
async def test_get_record_by_id(client: TestClient, auth_token_headers: dict):
    if not hasattr(pytest, 'record_id_api'):
        pytest.fail("Record ID not available. Run test_create_record first.")

    record_id = pytest.record_id_api
    response = client.get(f"/api/record/{record_id}", headers=auth_token_headers)
    assert response.status_code == 200
    record = response.json()
    assert record["id"] == record_id

# Add tests for other record endpoints, e.g., filtering by date range if implemented.