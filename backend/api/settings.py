from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Path, Body
from datetime import datetime

from api.base import BaseCRUDAPI
from models.models import Settings
from constants import SETTINGS_COLLECTION_NAME, DEVICE_COLLECTION_NAME
from core.sync_database import db


class SettingsAPI(BaseCRUDAPI[Settings]):
    def __init__(self):
        super().__init__(Settings, SETTINGS_COLLECTION_NAME)
        self.setup_custom_routes()
        
    def setup_custom_routes(self):
        """Setup custom routes for settings API"""
        # Override default routes to ensure custom ones take precedence
        self.router.get("/", response_model=Settings)(self.get_global_settings)
        self.router.post("/", response_model=Settings)(self.update_global_settings)
        
        # Add routes without trailing slash to support both formats
        self.router.get("", response_model=Settings)(self.get_global_settings)
        self.router.post("", response_model=Settings)(self.update_global_settings)
        
    async def get_global_settings(self):
        """Get the global settings"""
        # Get the global settings (always use the first document)
        settings = db[SETTINGS_COLLECTION_NAME].find_one({})
        
        # If settings don't exist, create default settings
        if not settings:
            default_settings = Settings()
            result = db[SETTINGS_COLLECTION_NAME].insert_one(default_settings.model_dump(by_alias=True))
            default_settings.id = result.inserted_id
            return default_settings
            
        return Settings.model_validate(settings)
        
    async def update_global_settings(self, settings_data: Dict[str, Any] = Body(...)):
        """Update the global settings"""
        # Get the current settings
        current_settings = db[SETTINGS_COLLECTION_NAME].find_one({})
        
        # Ensure correct data types
        parsed_data = {}
        if "emailNotifications" in settings_data:
            parsed_data["emailNotifications"] = bool(settings_data["emailNotifications"])
        
        if "alertThreshold" in settings_data:
            threshold = settings_data["alertThreshold"]
            # Ensure threshold is strictly positive or None
            if threshold is not None:
                try:
                    threshold_value = float(threshold)
                    if threshold_value <= 0:
                        # Invalid threshold, set to None
                        parsed_data["alertThreshold"] = None
                    else:
                        parsed_data["alertThreshold"] = threshold_value
                except (ValueError, TypeError):
                    # Invalid threshold value, keep current or set to None
                    if current_settings and "alertThreshold" in current_settings:
                        parsed_data["alertThreshold"] = current_settings["alertThreshold"]
                    else:
                        parsed_data["alertThreshold"] = None
            else:
                # Explicitly set to None
                parsed_data["alertThreshold"] = None
            
        if "refreshInterval" in settings_data:
            interval = settings_data["refreshInterval"]
            parsed_data["refreshInterval"] = int(interval) if interval is not None else None
            
        parsed_data["updated_at"] = datetime.utcnow()
        
        # If settings exist, update them. Otherwise, create new settings.
        if current_settings:
            settings_id = current_settings["_id"]
            
            # If global alertThreshold is set, update all devices without specific thresholds
            if "alertThreshold" in parsed_data and parsed_data["alertThreshold"] is not None:
                # Update all devices without a power_threshold
                db[DEVICE_COLLECTION_NAME].update_many(
                    {"power_threshold": {"$exists": False}},
                    {"$set": {"power_threshold": parsed_data["alertThreshold"]}}
                )
                
                # Also update devices with power_threshold of None
                db[DEVICE_COLLECTION_NAME].update_many(
                    {"power_threshold": None},
                    {"$set": {"power_threshold": parsed_data["alertThreshold"]}}
                )
            
            # Update settings
            db[SETTINGS_COLLECTION_NAME].update_one(
                {"_id": settings_id},
                {"$set": parsed_data}
            )
            
            updated_settings = db[SETTINGS_COLLECTION_NAME].find_one({"_id": settings_id})
            return Settings.model_validate(updated_settings)
        else:
            # Create new settings
            settings_model = Settings(**parsed_data)
            result = db[SETTINGS_COLLECTION_NAME].insert_one(settings_model.model_dump(by_alias=True))
            settings_model.id = result.inserted_id
            
            # Apply alertThreshold to all devices without a power_threshold
            if "alertThreshold" in parsed_data and parsed_data["alertThreshold"] is not None:
                # Update devices with no power_threshold
                db[DEVICE_COLLECTION_NAME].update_many(
                    {"power_threshold": {"$exists": False}},
                    {"$set": {"power_threshold": parsed_data["alertThreshold"]}}
                )
                
                # Also update devices with power_threshold of None
                db[DEVICE_COLLECTION_NAME].update_many(
                    {"power_threshold": None},
                    {"$set": {"power_threshold": parsed_data["alertThreshold"]}}
                )
            
            return settings_model 