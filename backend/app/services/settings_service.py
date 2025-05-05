import threading
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple in-memory store for settings (Not persistent across restarts)
# In a real application, use a database or configuration file
_settings = {
    "alertThreshold": 12,  # Set to the same default value as displayed in the UI
    "emailNotifications": True,
    "refreshInterval": 30
}
_lock = threading.Lock()

class SettingsService:
    def get_settings(self) -> dict:
        with _lock:
            logger.info(f"Current settings: {_settings}")
            return _settings.copy()

    def update_settings(self, new_settings: dict) -> dict:
        with _lock:
            logger.info(f"Updating settings: {new_settings}")
            # Only update keys that exist in the new_settings
            for key, value in new_settings.items():
                if key in _settings:
                    # Basic type validation/conversion if necessary
                    if key == "alertThreshold":
                        try:
                            if value is None:
                                _settings[key] = None
                                logger.info(f"Setting alertThreshold to None (disabled)")
                            else:
                                # Ensure the alertThreshold is stored as a float
                                _settings[key] = float(value)
                                logger.info(f"Setting alertThreshold to {_settings[key]}W")
                        except (ValueError, TypeError):
                            # Keep original value if conversion fails
                            logger.error(f"Failed to convert alertThreshold value: {value}")
                            pass
                    elif key == "refreshInterval":
                        try:
                            if value is None:
                                _settings[key] = 30  # Set to default if None
                                logger.info(f"Setting refreshInterval to default (30s)")
                            else:
                                _settings[key] = int(value)
                                logger.info(f"Setting refreshInterval to {_settings[key]}s")
                        except (ValueError, TypeError):
                            # Keep original value if conversion fails
                            logger.error(f"Failed to convert refreshInterval value: {value}")
                            pass
                    elif key == "emailNotifications":
                        _settings[key] = bool(value)
                        logger.info(f"Setting emailNotifications to {_settings[key]}")
                    else:
                        _settings[key] = value # Allow other types if added later
            logger.info(f"Updated settings: {_settings}")
            return _settings.copy()

settings_service = SettingsService() 