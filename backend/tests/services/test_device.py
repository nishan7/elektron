import pytest
from unittest.mock import AsyncMock, MagicMock
from backend.services.device import DeviceService
from backend.models.models import Device, DeviceCreate, DeviceUpdate
from backend.models.repository import MongoRepository  # Assuming this is what DeviceService uses
from pydantic_mongo.fields import ObjectIdField  # For mocking return IDs


# If DeviceService takes db directly, or a repository instance
# For this example, let's assume it takes a repository instance

@pytest.fixture
def mock_device_repo():
    repo = AsyncMock(spec=MongoRepository)  # Mock the repository
    repo.collection_name = "devices"  # pydantic-mongo needs this
    return repo


@pytest.fixture
def device_service(mock_device_repo):
    # If DeviceService expects a Motor database client/collection, adjust mocking.
    # This example assumes it uses an instance of MongoRepository.
    # If DeviceService uses `get_database` then this might not be needed if conftest handles it.
    # For more isolated unit tests of services, direct mock injection is good.
    return DeviceService(repository=mock_device_repo)


@pytest.mark.anyio
async def test_create_device_service(device_service: DeviceService, mock_device_repo: AsyncMock):
    device_create_data = DeviceCreate(
        name="Service Test Device", type="Sensor", model="SVC-T1", location="Lab Svc",
        serial_number="SN-SVC-001", status="pending", max_kw=2.0
    )

    # Mock the repository's create method
    # pydantic-mongo create returns the created object, ensure id is set
    mocked_created_device_dict = device_create_data.model_dump()
    mocked_created_device_dict["id"] = ObjectIdField()  # Simulate ObjectId assigned by DB

    mock_device_repo.create.return_value = Device(**mocked_created_device_dict)

    created_device = await device_service.create_device(device_create_data)

    mock_device_repo.create.assert_called_once()
    # assert mock_device_repo.create.call_args[0][0].name == device_create_data.name # More detailed check

    assert created_device is not None
    assert created_device.name == device_create_data.name
    assert created_device.id is not None


@pytest.mark.anyio
async def test_get_device_by_id_service(device_service: DeviceService, mock_device_repo: AsyncMock):
    test_id = ObjectIdField()  # "some_object_id_string"
    mock_device_data = {"id": test_id, "name": "Found Device", "serial_number": "SN-FOUND-001"}

    # pydantic-mongo find_one_by_id returns the model instance or None
    mock_device_repo.find_one_by_id.return_value = Device(**mock_device_data)

    found_device = await device_service.get_device_by_id(str(test_id))

    mock_device_repo.find_one_by_id.assert_called_once_with(str(test_id))
    assert found_device is not None
    assert found_device.name == "Found Device"


@pytest.mark.anyio
async def test_get_device_by_id_service_not_found(device_service: DeviceService, mock_device_repo: AsyncMock):
    test_id = "non_existent_id"
    mock_device_repo.find_one_by_id.return_value = None

    found_device = await device_service.get_device_by_id(test_id)

    mock_device_repo.find_one_by_id.assert_called_once_with(test_id)
    assert found_device is None


@pytest.mark.anyio
async def test_update_device_service(device_service: DeviceService, mock_device_repo: AsyncMock):
    test_id = ObjectIdField()
    device_update_data = DeviceUpdate(location="New Service Location")

    # Mock the find_one_by_id and update methods
    # update method of pydantic-mongo typically returns the updated document
    original_device_dict = {"id": test_id, "name": "Device to Update", "location": "Old Location",
                            "serial_number": "SN-UPD-001"}
    updated_device_dict = {**original_device_dict, "location": "New Service Location"}

    mock_device_repo.find_one_by_id.return_value = Device(**original_device_dict)
    mock_device_repo.update.return_value = Device(**updated_device_dict)  # What update is expected to return

    updated_device = await device_service.update_device(str(test_id), device_update_data)

    mock_device_repo.find_one_by_id.assert_called_once_with(str(test_id))
    # The update call in pydantic-mongo is typically: repo.update(db_obj, update_data_dict)
    # We need to ensure that the db_obj passed to update is the one returned by find_one_by_id
    # For simplicity, we'll just check it was called.
    mock_device_repo.update.assert_called_once()

    assert updated_device is not None
    assert updated_device.location == "New Service Location"

# Add tests for delete_device, get_all_devices, get_active_devices etc.