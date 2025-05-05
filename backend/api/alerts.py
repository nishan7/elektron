from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Path
from datetime import datetime
from bson import ObjectId

from api.base import BaseCRUDAPI
from models.models import Device, Alert
from constants import ALERT_COLLECTION_NAME, DEVICE_COLLECTION_NAME
from core.sync_database import db


class AlertsAPI(BaseCRUDAPI[Alert]):
    def __init__(self):
        super().__init__(Alert, ALERT_COLLECTION_NAME)
        
        @self.router.get("/", response_model=List[Alert])
        async def get_alerts(
            resolved: bool = False,
            severity: Optional[str] = None,
            device_id: Optional[str] = None,
            limit: int = 100
        ):
            query = {"resolved": resolved}
            
            if severity:
                query["severity"] = severity
                
            if device_id:
                query["device_id"] = ObjectId(device_id)
                
            alerts = []
            cursor = db[ALERT_COLLECTION_NAME].find(query).sort("timestamp", -1).limit(limit)
            
            for doc in cursor:
                alerts.append(Alert.model_validate(doc))
                
            return alerts
        
        @self.router.put("/{alert_id}/resolve/", response_model=Alert)
        async def resolve_alert(alert_id: str = Path(...)):
            alert_obj_id = ObjectId(alert_id)
            alert = db[ALERT_COLLECTION_NAME].find_one({"_id": alert_obj_id})
            
            if not alert:
                raise HTTPException(status_code=404, detail=f"Alert with ID {alert_id} not found")
                
            update_data = {
                "resolved": True,
                "resolved_at": datetime.utcnow()
            }
            
            result = db[ALERT_COLLECTION_NAME].update_one(
                {"_id": alert_obj_id},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                raise HTTPException(status_code=400, detail="Failed to resolve alert")
                
            updated_alert = db[ALERT_COLLECTION_NAME].find_one({"_id": alert_obj_id})
            return Alert.model_validate(updated_alert)

    async def create_power_threshold_alert(self, device_id: str, power_value: float, threshold: float) -> Alert:
        """Create a new power threshold alert"""
        device = db[DEVICE_COLLECTION_NAME].find_one({"_id": ObjectId(device_id)})
        if not device:
            raise HTTPException(status_code=404, detail=f"Device with ID {device_id} not found")
            
        device_name = device.get("name", "Unknown Device")
        severity = "critical" if power_value > threshold * 1.5 else "warning"
        
        alert_data = {
            "device_id": ObjectId(device_id),
            "timestamp": datetime.utcnow(),
            "severity": severity,
            "message": f"Power consumption exceeded threshold: {power_value}W > {threshold}W on device '{device_name}'",
            "metric": "power",
            "value": power_value,
            "threshold": threshold,
            "resolved": False
        }
        
        alert = Alert.model_validate(alert_data)
        result = db[ALERT_COLLECTION_NAME].insert_one(alert.model_dump(by_alias=True))
        
        if not result.inserted_id:
            raise HTTPException(status_code=400, detail="Failed to create alert")
            
        alert.id = result.inserted_id
        return alert

