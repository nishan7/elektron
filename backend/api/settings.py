from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from models.models import Settings, NotificationSettings, ThresholdSettings
from core.database import db

# Default settings if none found in DB - MATCHES NEW STRUCTURE
DEFAULT_SETTINGS = Settings( # Instantiate the model with defaults
    notifications=NotificationSettings(email=True, sms=False, criticalAlerts=True),
    thresholds=ThresholdSettings(
        powerAlert=3500.0, 
        costAlert=1.00, 
        criticalThreshold=5000.0, # Added a default for criticalThreshold
        dataRefreshInterval=30, 
        timeZone="UTC"
    )
)

class SettingsAPI:
    def __init__(self):
        self.router = APIRouter()
        self.collection_name = "settings" # Define collection name
        self.model = Settings
        self.db = db
        self.setup_routes()

    def setup_routes(self):
        # Endpoint to get the current settings
        self.router.get("/", response_model=self.model)(self.get_settings)
        # Endpoint to create/update the settings (using PUT for idempotency)
        self.router.put("/", response_model=self.model)(self.update_settings)

    async def get_settings(self) -> Settings:
        print("--- GET /api/settings called ---", flush=True)
        settings_doc = await self.db.db[self.collection_name].find_one({}) # Find first/only doc
        
        if settings_doc:
            print(f"--- Found settings in DB: {settings_doc} ---", flush=True)
            try:
                # Validate using the main Settings model, which includes nested models
                return self.model(**settings_doc)
            except Exception as e:
                print(f"--- Error validating DB settings data: {e}. Returning defaults. ---", flush=True)
                return DEFAULT_SETTINGS # Return the default model instance
        else:
            print("--- No settings found in DB, returning defaults ---", flush=True)
            return DEFAULT_SETTINGS # Return the default model instance

    async def update_settings(self, settings_update: Settings) -> Settings:
        print(f"--- PUT /api/settings called with data: {settings_update} ---", flush=True)
        # Model dump will handle nested models correctly. Assuming camelCase storage.
        update_payload = settings_update.model_dump(exclude_unset=True, by_alias=True)
        
        # Remove _id/id if present, assuming we update the single settings doc
        if "_id" in update_payload:
            del update_payload["_id"]
        if "id" in update_payload:
             del update_payload["id"]

        # Using empty filter {} assumes only one settings document exists or should exist
        result = await self.db.db[self.collection_name].update_one(
            {}, 
            { "$set": update_payload },
            upsert=True 
        )

        updated_doc = await self.db.db[self.collection_name].find_one({}) 
        if updated_doc:
             print(f"--- Settings updated/created: {updated_doc} ---", flush=True)
             return self.model(**updated_doc)
        else:
             print("--- ERROR: Settings document not found after upsert! ---", flush=True)
             raise HTTPException(status_code=500, detail="Failed to retrieve settings after update.")

# Instantiate once for registration
# settings_api_instance = SettingsAPI() # No, registration happens in main.py 