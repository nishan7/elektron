import os
import paho.mqtt.client as mqtt
import logging
from services.records import update_record # Assuming update_record saves the record
from app.services.alerts import AlertService # Import AlertService (adjust path if needed)
from models.models import Alert # Fix: Use the correct Alert model
from core.sync_database import db # Fix: Use the synchronous database
from constants import ALERT_COLLECTION_NAME # Import collection name
import json
from pydantic import ValidationError
from datetime import datetime, timezone # Import datetime
from bson import ObjectId # Add ObjectId import

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get MQTT Broker configuration from environment variables, consistent with docker-compose.yml definitions
MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost") # Default value for local testing
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", 1883))
MQTT_KEEPALIVE = 60

# --- Define topics ---
# This is an example topic structure, adjust according to your actual situation
# For example, devices use 'elektron/device/{device_id}/data' to publish data
DEVICE_DATA_TOPIC = "elektron/device/+/data" # '+' is a single-level wildcard

# Instantiate AlertService
alert_service = AlertService()

def on_connect(client, userdata, flags, rc):
    """MQTT connection callback function"""
    if rc == 0:
        logger.info(f"Successfully connected to MQTT Broker at {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}")
        # Subscribe to topics after successful connection
        client.subscribe(DEVICE_DATA_TOPIC)
        logger.info(f"Subscribed to topic: {DEVICE_DATA_TOPIC}")
    else:
        logger.error(f"Failed to connect to MQTT Broker, return code {rc}")

def on_disconnect(client, userdata, rc):
    """MQTT disconnect callback function"""
    logger.warning(f"Disconnected from MQTT Broker with result code {rc}")
    # Reconnection logic can be added here if rc != 0: client.reconnect()

def on_message(client, userdata, msg):
    """MQTT message received callback function"""
    topic = msg.topic
    payload = msg.payload.decode("utf-8")
    logger.info(f"Received message on topic '{topic}': {payload}")

    try:
        # Extract device_id from topic
        topic_parts = topic.split('/')
        if len(topic_parts) < 4 or topic_parts[0] != 'elektron' or topic_parts[1] != 'device' or topic_parts[3] != 'data':
            logger.warning(f"Ignoring message on unexpected topic format: {topic}")
            return
        device_id_str = topic_parts[2] # Assuming topic is 'elektron/device/{device_id}/data'

        data = json.loads(payload)
        logger.info(f"Parsed message data: {data}")

        # --- Data processing logic ---
        # Add device_id from topic if not in payload (adjust based on actual data)
        if "device_id" not in data:
            data["device_id"] = device_id_str

        # Ensure timestamp is present, default to now if missing
        if "timestamp" not in data:
             data["timestamp"] = datetime.now(timezone.utc).isoformat()

        # Check if power data is present for alert checking
        if "power" in data:
            # 1. Update/Save the regular power record
            try:
                update_record(data) # Assuming this function saves the record to the DB
                logger.info(f"Processed and stored record for device {data.get('device_id')}")
            except Exception as e:
                 logger.error(f"Failed to update record for device {data.get('device_id')}: {e}")
                 # Decide if you want to continue to alert check even if record saving failed

            # 2. Check for power threshold alert
            try:
                # Assuming device name might be needed, fetch it or use ID
                # For simplicity, using device_id as 'name' here. Adjust if needed.
                device_name = data.get("name", device_id_str)
                power_value = float(data["power"])
                
                logger.info(f"Checking power threshold for device {device_name}, power value: {power_value}W")
                
                # Retrieve the currently set threshold to determine if an alert should be triggered
                from app.services.settings_service import settings_service
                current_settings = settings_service.get_settings()
                alert_threshold = current_settings.get("alertThreshold")
                logger.info(f"Current alert threshold setting: {alert_threshold}W")

                power_alert_info = alert_service.check_power_spike(power_value, device_name)

                if power_alert_info:
                    logger.warning(f"Power alert triggered for device {device_name}: {power_alert_info['message']}")
                    
                    # 3. Create and save the alert to the database
                    try:
                        # Ensure we have the correct Alert model
                        alert_data = {
                            "device_id": ObjectId(device_id_str),  # Ensure this is an ObjectId
                            "timestamp": datetime.now(timezone.utc),
                            "severity": power_alert_info.get("severity", "warning"),
                            "message": power_alert_info.get("message", "Power threshold exceeded."),
                            "metric": "power",
                            "value": power_value,
                            "threshold": float(alert_threshold) if alert_threshold else 0,
                            "resolved": False
                        }
                        
                        # Create Alert instance
                        alert_doc = Alert(**alert_data)
                        
                        # Convert to dictionary for database insertion
                        alert_dict = alert_doc.model_dump(by_alias=True)
                        logger.info(f"Prepared alert for saving: {alert_dict}")
                        
                        # Insert into the database
                        insert_result = db[ALERT_COLLECTION_NAME].insert_one(alert_dict)
                        logger.info(f"Saved alert to DB with ID: {insert_result.inserted_id}")
                    
                        # Optional: Send notifications (e.g., email/Slack)
                        try:
                            notification_result = alert_service.process_alert(power_alert_info, ["email", "slack"])
                            logger.info(f"Notification result: {notification_result}")
                        except Exception as notify_error:
                            logger.error(f"Failed to send notifications: {notify_error}")
                    except Exception as alert_error:
                        logger.exception(f"Failed to save alert to database: {alert_error}")
                else:
                    logger.info(f"No alert triggered, power value {power_value}W is below threshold")

            except ValueError:
                 logger.error(f"Invalid power value received for alert check: {data['power']}")
            except Exception as e:
                 logger.exception(f"Error during alert check/saving for device {device_id_str}: {e}")

        else:
             logger.warning(f"Received message missing 'power' field, cannot check alerts: {data}")

    except json.JSONDecodeError:
        logger.error(f"Failed to decode JSON payload: {payload}")
    except ValidationError as e:
         logger.error(f"Data validation failed for payload {payload}: {e}")
    except Exception as e:
        logger.exception(f"An unexpected error occurred processing message on topic {topic}: {e}")


def create_mqtt_client():
    """Create and configure the MQTT client"""
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    # Set Last Will and Testament message (optional)
    # client.will_set("elektron/status", payload="backend_offline", qos=1, retain=True)

    # Add authentication (if your Broker requires it)
    # client.username_pw_set(username="your_username", password="your_password")

    try:
        client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, MQTT_KEEPALIVE)
    except Exception as e:
        logger.exception(f"Could not connect to MQTT Broker: {e}")
        # Handle connection failure as needed, e.g., exit the app or retry later

    return client

# A start function can be added here to be called by main.py
def start_mqtt_loop():
    client = create_mqtt_client()
    # client.loop_forever() # Blocking loop, will block the main thread
    client.loop_start() # Non-blocking loop, runs in a background thread
    logger.info("MQTT client loop started in background thread.")
    return client

if __name__ == '__main__':
    # For testing this module independently
    logger.info("Starting MQTT client for testing...")
    client = start_mqtt_loop()
    # Keep the main thread running for testing
    import time
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Stopping MQTT client...")
        client.loop_stop()
        client.disconnect()
        logger.info("MQTT client stopped.") 