import pytest
from unittest.mock import patch, AsyncMock
from backend.core.sync_database import create_first_superuser, get_password_hash
from backend.models.models import UserCreate
from backend.services.user_service import UserService  # Or direct DB interaction if that's how it works


# This test might be more of an integration test if it hits a real DB,
# or a unit test if UserService is fully mocked.
# The conftest.py already mocks the database, so this will use mongomock.

@pytest.mark.anyio
async def test_get_password_hash():
    password = "testpassword"
    hashed_password = get_password_hash(password)
    assert hashed_password != password
    # You would typically use a verify_password function to check this,
    # but for a simple hash test, just ensuring it's different is a start.
    # A proper test would involve `pwd_context.verify(password, hashed_password)`
    from backend.api.auth.auth import pwd_context  # Assuming pwd_context is accessible
    assert pwd_context.verify(password, hashed_password)


@pytest.mark.anyio
async def test_create_first_superuser(mock_mongo_client):  # Uses the mocked DB from conftest
    db = mock_mongo_client["elektron_test_db"]
    user_collection = db["users"]

    # Ensure no superuser exists initially for this test
    await user_collection.delete_many({"email": "admin@example.com"})

    # Mock environment variables if create_first_superuser reads them
    with patch('backend.core.sync_database.settings') as mock_settings:
        mock_settings.ADMIN_EMAIL = "admin@example.com"
        mock_settings.ADMIN_FULL_NAME = "Admin User"
        mock_settings.ADMIN_PASSWORD = "adminpassword"

        # We need a UserService instance that uses the mocked DB.
        # create_first_superuser internally uses UserService.
        # The dependency override in conftest should ensure UserService gets the mock DB.
        # Alternatively, patch UserService directly if create_first_superuser instantiates it.

        # For this test, let's assume create_first_superuser uses dependency injection
        # or we mock the UserService it might use internally.
        # A simpler approach for this specific function is to check its side effects (DB write).

        await create_first_superuser()

        superuser = await user_collection.find_one({"email": "admin@example.com"})
        assert superuser is not None
        assert superuser["full_name"] == "Admin User"
        assert superuser["is_superuser"] is True

        from backend.api.auth.auth import pwd_context
        assert pwd_context.verify("adminpassword", superuser["hashed_password"])


@pytest.mark.anyio
async def test_create_first_superuser_already_exists(mock_mongo_client):
    db = mock_mongo_client["elektron_test_db"]
    user_collection = db["users"]

    # Ensure a superuser exists
    existing_admin_email = "existingadmin@example.com"
    await user_collection.insert_one({
        "email": existing_admin_email,
        "full_name": "Existing Admin",
        "hashed_password": get_password_hash("oldpassword"),
        "is_superuser": True,
        "is_active": True
    })

    with patch('backend.core.sync_database.settings') as mock_settings, \
            patch('backend.services.user_service.UserService.create_user',
                  new_callable=AsyncMock) as mock_create_user:  # Mock create_user specifically

        mock_settings.ADMIN_EMAIL = existing_admin_email  # Try to create the same admin
        mock_settings.ADMIN_FULL_NAME = "New Admin Attempt"
        mock_settings.ADMIN_PASSWORD = "newadminpassword"

        # We expect that if the user service's get_user_by_email finds the user,
        # create_user won't be called, or if it is, it might raise an error handled internally.
        # The original create_first_superuser logs "Superuser already exists."
        # For this test, we want to ensure it doesn't try to create a duplicate if it exists.

        # If create_first_superuser calls user_service.get_user_by_email:
        mock_user_service_instance = AsyncMock(spec=UserService)
        mock_user_service_instance.get_user_by_email.return_value = await user_collection.find_one(
            {"email": existing_admin_email})  # Simulate user found

        with patch('backend.core.sync_database.UserService', return_value=mock_user_service_instance):
            await create_first_superuser()
            # Assert that the create_user method of the (mocked) user service was not called.
            mock_user_service_instance.create_user.assert_not_called()

        # Verify original admin data is unchanged
        superuser = await user_collection.find_one({"email": existing_admin_email})
        assert superuser["full_name"] == "Existing Admin"