from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any

from app.services.settings_service import settings_service

router = APIRouter()

@router.get("", response_model=Dict[str, Any])
async def get_settings():
    """Retrieve current application settings."""
    try:
        current_settings = settings_service.get_settings()
        return current_settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=Dict[str, Any])
async def update_settings(settings_update: Dict[str, Any] = Body(...)):
    """Update application settings."""
    try:
        # Ensure we only pass valid keys if needed, or let the service handle it
        updated_settings = settings_service.update_settings(settings_update)
        return updated_settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 