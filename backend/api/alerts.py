from calendar import month_abbr
from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import Query, HTTPException
from pydantic import ValidationError

from api.base import BaseCRUDAPI
from models.models import Device, Alert, AlertResponse, PydanticObjectId

print("TOP OF ALERTS.PY - RESOLVE FEATURE VERSION!", flush=True)

class AlertsAPI(BaseCRUDAPI[Alert]):
    def __init__(self):
        super().__init__(Alert, "alerts")
        print("AlertsAPI initialized (resolve feature)", flush=True)

    def setup_routes(self):
        super().setup_routes()
        self.router.get("/", response_model=List[AlertResponse])(self.get_records_within_timeframe)
        self.router.post("/{alert_id}/resolve", response_model=AlertResponse)(self.resolve_alert)
        print("AlertsAPI routes_setup (resolve feature, added /resolve endpoint)", flush=True)

    async def get_enriched_alerts(self, doc):
        print(f"--- Enriching (post-model-change) doc _id {doc.get('_id')}. Raw doc from DB: {doc}", flush=True)
        
        enriched_data_for_response = {
            "_id": doc.get("_id"),  # Key is "_id" for populating AlertResponse.id (which is aliased to _id)
            "device_id": doc.get("device_id"), # Pass ObjectId (or existing PydanticObjectId) directly
            "start_time": doc.get("start_time"),
            "end_time": doc.get("end_time"),
            "message": doc.get("message"),
            "metric": doc.get("metric"),
            "type": doc.get("type"),
            "resolved": doc.get("resolved"),
            "device_name": doc.get("deviceName"), 
            "location": doc.get("location"),
            "timestamp": doc.get("start_time") 
        }
        print(f"--- Prepared enriched_data_for_response (PydanticObjectId fix, _id key): {enriched_data_for_response}", flush=True)
        return enriched_data_for_response

    async def get_records_within_timeframe(
            self,
            start_time: Optional[str] = Query(None),
            end_time: Optional[str] = Query(None),
            device_id: Optional[str] = Query(None),
    ):
        print(f"--- ENTERING get_records_within_timeframe (post-model-change) ---", flush=True)
        query = {}
        if start_time or end_time:
            query["start_time"] = {}
            if start_time:
                query["start_time"]["$gte"] = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            if end_time:
                query["start_time"]["$lte"] = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
        if device_id: 
            try:
                # If device_id is part of the Alert model, it might be stored as an ObjectId
                # or as a string if we changed how it's stored. Assuming ObjectId for query.
                query["device_id"] = ObjectId(device_id) 
            except Exception:
                print(f"--- Invalid device_id format in query: {device_id} ---", flush=True)
                return [] 
        
        print(f"--- Query for alerts (post-model-change): {query} ---", flush=True)
        cursor = self.db.db[self.collection_name].find(query)
        results = []
        processed_doc_ids = [] 
        async for doc in cursor:
            doc_id_str = str(doc.get('_id'))
            processed_doc_ids.append(doc_id_str)
            try:
                enriched_doc_payload = await self.get_enriched_alerts(doc) # This now just transforms the doc
                alert_response_obj = AlertResponse(**enriched_doc_payload)
                results.append(alert_response_obj)
            except ValidationError as e:
                print(f"--- Pydantic ValidationError for doc _id {doc_id_str} (post-model-change) ---", flush=True)
                print(e.json(indent=2), flush=True)
                print(f"--- Input data that failed validation: {enriched_doc_payload} ---", flush=True)
            except Exception as e:
                print(f"--- Other exception for doc _id {doc_id_str} (post-model-change): {type(e).__name__} - {str(e)} ---", flush=True)
                print(f"--- Input data during other exception: {enriched_doc_payload if 'enriched_doc_payload' in locals() else 'payload creation failed'} ---", flush=True)
        
        print(f"--- Attempting to return {len(results)} AlertResponse objects. Processed doc IDs: {processed_doc_ids} (post-model-change) ---", flush=True)
        for i, item in enumerate(results):
            if not isinstance(item, AlertResponse):
                print(f"--- Item at index {i} in results is NOT an AlertResponse instance! Type: {type(item)} (post-model-change) ---", flush=True)
            else:
                print(f"--- Item at index {i} is an AlertResponse. deviceName: {item.device_name}, location: {item.location} (post-model-change) ---", flush=True)

        return results

    async def resolve_alert(self, alert_id: str):
        print(f"--- Attempting to resolve alert_id: {alert_id} ---", flush=True)
        try:
            object_id = ObjectId(alert_id)
        except Exception:
            print(f"--- Invalid ObjectId format for alert_id: {alert_id} ---", flush=True)
            raise HTTPException(status_code=400, detail=f"Invalid alert ID format: {alert_id}")

        alert_doc = await self.db.db[self.collection_name].find_one({"_id": object_id})
        if not alert_doc:
            print(f"--- Alert not found for resolving: {alert_id} ---", flush=True)
            raise HTTPException(status_code=404, detail=f"Alert with id {alert_id} not found")

        if alert_doc.get("resolved"):
            print(f"--- Alert {alert_id} is already resolved. Raw doc: {alert_doc}", flush=True)
            # Optionally, could raise an error or just return the already resolved alert
            # For now, let's return it as if it was just resolved to simplify frontend
            # Or, more strictly, raise HTTPException(status_code=400, detail=f"Alert {alert_id} is already resolved")
            # Returning it might be fine, client can check resolved status.

        update_data = {
            "$set": {
                "resolved": True,
                "end_time": datetime.utcnow() # Set end_time to now
            }
        }
        
        result = await self.db.db[self.collection_name].update_one(
            {"_id": object_id},
            update_data
        )

        if result.matched_count == 0: # Should not happen if find_one succeeded, but good check
            print(f"--- Alert {alert_id} found but failed to update for resolving (matched_count is 0). This is unexpected. ---", flush=True)
            raise HTTPException(status_code=500, detail=f"Failed to update alert {alert_id} during resolve, though it was found.")

        # Fetch the updated document to return it with all fields for AlertResponse
        updated_alert_doc = await self.db.db[self.collection_name].find_one({"_id": object_id})
        if not updated_alert_doc:
             print(f"--- Alert {alert_id} was updated but could not be re-fetched. This is highly unexpected. ---", flush=True)
             # This case is problematic; the update happened but we can't return the object.
             raise HTTPException(status_code=500, detail=f"Alert {alert_id} resolved but could not be re-fetched.")

        # Use the existing enrichment logic to prepare for AlertResponse model
        # This ensures deviceName, location are populated if they are part of the doc
        # and timestamp is set from start_time for the response model.
        enriched_response_payload = await self.get_enriched_alerts(updated_alert_doc)
        
        print(f"--- Alert {alert_id} resolved successfully. Enriched payload: {enriched_response_payload}", flush=True)
        return AlertResponse(**enriched_response_payload)


