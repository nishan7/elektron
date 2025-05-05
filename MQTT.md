# Integrating Shelly Plus Plug US Device Guide

This document guides you on how to integrate the [Shelly Plus Plug US](https://shelly-api-docs.shelly.cloud/gen2/Devices/Gen2/ShellyPlugUS/) smart plug device into the current Elektron project. Integration is primarily done via the MQTT protocol, utilizing the device's built-in power metering function to log data to the project backend.

## Prerequisites

1.  **Elektron Project Running**: Ensure the project's frontend and backend services have been successfully started according to `docker-compose.yml` or other methods.
2.  **MQTT Broker**: The project relies on an MQTT Broker (like Mosquitto) for device communication. Ensure the Broker is running and accessible by the backend service (`backend/mqtt_client.py`). According to `docker-compose.yml` and `backend/mqtt_client.py`, the Broker's address should be configured via environment variables `MQTT_BROKER_HOST` and `MQTT_BROKER_PORT` (defaults to `localhost:1883`).
3.  **Shelly Plus Plug US**: The device is connected to your Wi-Fi network.

## Integration Steps

### Step 1: Add Device Record in Elektron Project

First, we need to create a record for your Shelly device within the Elektron system. This allows the backend to associate incoming MQTT messages with the correct device.

1.  Open the Elektron project's frontend page, usually `http://<your-host>:3000/devices`.
2.  Click the "Add Device" button.
3.  Fill in the device information in the pop-up dialog. It's recommended to fill in the following fields:
    *   **Device Name**: Give the device a meaningful name, e.g., "Living Room Shelly Plug".
    *   **Device Type**: "Smart Plug" or "Shelly Plug".
    *   **Model**: "Shelly Plus Plug US".
    *   **Manufacturer**: "Shelly" or "Allterco Robotics".
    *   **Location**: The physical location of the device, e.g., "Living Room".
    *   *(Other fields are optional)*
4.  Click "Add Device" to save.

**Note down the ID of this newly added device** (can be found on the device detail page or by inspecting the database/API response). Although the current MQTT message handling logic (`on_message`) seems to attempt extracting `device_id` from the message *payload*, a more robust approach is usually to extract the Shelly device's unique ID from the MQTT *topic*. We will discuss how to adjust this in Step 4.

### Step 2: Configure Shelly Plus Plug US MQTT Settings

Next, you need to configure the Shelly device to connect to your MQTT Broker and publish data.

1.  Access the Shelly device's web management interface via a browser (usually via the device's IP address).
2.  Navigate to "Settings" -> "Networks" -> "MQTT".
3.  Enable MQTT.
4.  Configure the following settings:
    *   **Server**: Enter your MQTT Broker's address and port (e.g., `192.168.1.100:1883`). This must be an address reachable by the Shelly device and point to the same Broker configured for the backend (`MQTT_BROKER_HOST:MQTT_BROKER_PORT`).
    *   **Client ID**: Can be kept as default (usually `shellyplusplugus-<deviceid>`) or customized. **Note down this Client ID or the device ID part (`<deviceid>`)**, as it's useful for matching the device in the backend.
    *   **Username/Password**: Fill these in if your MQTT Broker requires authentication.
    *   **RPC status notifications over MQTT (enable RPC)**: Enable this option. This will make the device send JSON RPC messages containing status and measurement data via MQTT.
    *   **Generic status update over MQTT (enable generic status)**: *(Optional, but recommended)* This publishes status information via simpler topics, e.g., `shellies/<client_id>/status/switch:0`.
    *   *(Adjust other settings like QoS, Retain, SSL/TLS according to your Broker configuration)*
5.  Save the settings. The device should now attempt to connect to your MQTT Broker.

### Step 3: Verify Backend MQTT Client Connection

Ensure the `mqtt_client.py` in the `backend` service can successfully connect to the MQTT Broker.

1.  Check the logs of the `backend` service. You should see log messages similar to "Successfully connected to MQTT Broker..." and "Subscribed to topic: elektron/device/+/data".
2.  If the connection fails, check:
    *   Are the environment variables `MQTT_BROKER_HOST` and `MQTT_BROKER_PORT` correctly passed to the `backend` container?
    *   Is the network connection between the `backend` container and the MQTT Broker container functional?
    *   Does the MQTT Broker require authentication, and are the correct username/password configured in `mqtt_client.py` (currently commented out; uncomment and configure if needed)?

### Step 4: Adjust Backend MQTT Message Handling Logic

The current `on_message` function in `backend/mqtt_client.py` subscribes to `elektron/device/+/data` and expects the message payload to contain `device_id`. The MQTT topic and message format published by Shelly devices might differ. We need to adjust `on_message` to correctly handle Shelly's messages.

Shelly Gen2 devices, with RPC notifications enabled, typically publish JSON RPC messages on a topic like `shellies/<client_id>/events/rpc`. We need to:

1.  **Adjust Subscription Topic**: Modify the `on_connect` function in `mqtt_client.py`, or directly modify the subscription logic in `create_mqtt_client`, to subscribe to the topic where the Shelly device actually publishes data. A more general subscription might be `shellies/+/events/rpc` (where `+` matches the Shelly device's Client ID/device ID). Alternatively, if you only care about specific devices, subscribe to `shellies/<your-shelly-client-id>/events/rpc`.
2.  **Modify Message Parsing Logic (`on_message`)**:
    *   **Extract Device ID**: Extract the Shelly's device ID/Client ID from the message topic `msg.topic` (e.g., extract `shellyplusplugus-aabbccddeeff` from `shellies/shellyplusplugus-aabbccddeeff/events/rpc`).
    *   **Find Internal Device ID**: Use the extracted Shelly ID to find the corresponding record in the `devices` collection in the database (this might require adding a `shelly_id` or `mqtt_client_id` field to the `Device` model and populating it when adding the device in Step 1, or matching based on fields like `name`, `model`, etc.). Find the corresponding internal `_id` (i.e., `device_id`).
    *   **Parse Payload**: Shelly's RPC message is a JSON object. We need to parse it (`json.loads(payload)`).
    *   **Extract Power Data**: Find the power reading within the parsed JSON data. According to Shelly RPC documentation, power data is usually found under `params` for a specific component (like `switch:0`) in its status, with the key potentially being `apower` (instantaneous active power). E.g., `data['params']['switch:0']['apower']`.
    *   **Prepare and Store Record**: Use the found internal `device_id`, the extracted `power` value, and the current timestamp to call `services.records.update_record` or directly create a `Record` object and save it to the database.

**Example (Conceptual Modification of `on_message`)**:

```python
# backend/mqtt_client.py

from models.models import Record # Ensure Record model is imported
from models.base import PyObjectId # For type hinting
from core.database import db # Import database instance for direct operations
from datetime import datetime
from typing import Optional # Added for Optional type hint
import json # Added for JSON parsing
import logging # Added for logging

logger = logging.getLogger(__name__) # Define logger for this module

# ... (other imports and functions)

async def find_device_id_by_shelly_id(shelly_id: str) -> Optional[PyObjectId]:
    """Find the corresponding internal device _id in the database based on Shelly Client ID"""
    # Assumes the Device model has an 'mqtt_client_id' field storing the Shelly ID
    # Alternatively, find by other fields like name/model, but this is less precise
    device_doc = await db.db["devices"].find_one({"mqtt_client_id": shelly_id})
    if device_doc:
        return device_doc["_id"]
    logger.warning(f"Could not find internal device for Shelly ID: {shelly_id}")
    return None

async def save_power_record(device_id: PyObjectId, power: float):
    """Create and save a power record"""
    record = Record(
        device_id=device_id,
        power=power,
        timestamp=datetime.utcnow()
    )
    # Use model_dump(by_alias=True, exclude_none=True) for Pydantic v2+ compatibility
    insert_result = await db.db["records"].insert_one(record.model_dump(by_alias=True, exclude_none=True))
    if insert_result.inserted_id:
        logger.info(f"Saved power record for device {device_id}: {power}W")
    else:
        logger.error(f"Failed to save power record for device {device_id}")


async def on_message(client, userdata, msg):
    """MQTT message receive callback function (adjusted)"""
    topic = msg.topic
    try:
        payload = msg.payload.decode("utf-8")
    except UnicodeDecodeError:
        logger.error(f"Could not decode payload from topic '{topic}' as UTF-8.")
        return # Cannot process non-UTF8 payload

    logger.info(f"Received message on topic '{topic}': {payload}")

    # Check if it's a Shelly RPC event topic
    if topic.startswith("shellies/") and topic.endswith("/events/rpc"):
        try:
            # Extract Shelly Client ID from topic
            parts = topic.split('/')
            if len(parts) >= 3:
                shelly_id = parts[1]
            else:
                logger.warning(f"Could not extract Shelly ID from topic: {topic}")
                return

            # Find corresponding internal device ID
            internal_device_id = await find_device_id_by_shelly_id(shelly_id)
            if not internal_device_id:
                # Log warning moved inside find_device_id_by_shelly_id
                return # No matching device found, ignore message

            # Parse JSON Payload
            data = json.loads(payload)

            # Extract power data (adjust based on actual RPC structure)
            power = None
            # Safer access to nested dictionary keys
            if isinstance(data.get("params"), dict) and \
               isinstance(data["params"].get("switch:0"), dict) and \
               "apower" in data["params"]["switch:0"]:
                 try:
                     power = float(data["params"]["switch:0"]["apower"])
                 except (ValueError, TypeError):
                     logger.warning(f"Could not convert apower value to float for {shelly_id}. Value: {data['params']['switch:0']['apower']}")

            # If power data was successfully extracted, save the record
            if power is not None:
                 await save_power_record(internal_device_id, power)
            else:
                 logger.debug(f"Power data ('apower') not found or invalid in RPC message for {shelly_id}: {data}")

        except json.JSONDecodeError:
            logger.error(f"Failed to decode JSON payload from {topic}: {payload}")
        except Exception as e:
            # Log the full exception traceback for unexpected errors
            logger.exception(f"An unexpected error occurred processing message from {topic}: {e}")
    else:
        # Handle or ignore other topics if necessary
        logger.debug(f"Ignoring message on unhandled topic: {topic}")


# --- Ensure subscription to the correct topic in on_connect ---
def on_connect(client, userdata, flags, rc, properties=None): # Added properties for MQTTv5 compatibility
    """Callback for when the client connects to the MQTT Broker."""
    connack_string = mqtt.connack_string(rc) # Use paho-mqtt helper for readable connack string
    if rc == 0:
        logger.info(f"Successfully connected to MQTT Broker at {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT} ({connack_string})")
        # Subscribe to Shelly RPC topic
        shelly_topic = "shellies/+/events/rpc" # '+' wildcard matches all Shelly devices
        client.subscribe(shelly_topic, qos=1) # Example: setting QoS to 1
        logger.info(f"Subscribed to Shelly topic: {shelly_topic}")
        # Optionally subscribe to the old topic as well
        # old_topic = "elektron/device/+/data"
        # client.subscribe(old_topic, qos=1)
        # logger.info(f"Subscribed to topic: {old_topic}")
    else:
        logger.error(f"Failed to connect to MQTT Broker, return code {rc} ({connack_string})")

# ... (other code, like create_mqtt_client, start_mqtt_loop, ensure MQTT_BROKER_HOST/PORT are defined)
# Ensure paho.mqtt.client is imported as mqtt
import paho.mqtt.client as mqtt

# Ensure necessary variables like MQTT_BROKER_HOST, MQTT_BROKER_PORT are defined
# Example placeholders:
MQTT_BROKER_HOST = "localhost"
MQTT_BROKER_PORT = 1883
```

**Notes**:
*   The Python code above is illustrative. You'll need to adapt the power data extraction path (`data['params']['switch:0']['apower']`) based on the exact RPC message structure of the Shelly Plus Plug US.
*   The `find_device_id_by_shelly_id` function requires you to decide how to link the Shelly Client ID to device records in your database (adding a dedicated field in the `Device` model is recommended).
*   Error handling and logging can be further enhanced as needed.
*   Ensure asynchronous functions (`async def`) are handled correctly within `paho-mqtt` callbacks. If `on_message` is not inherently async-aware in your setup, you might need to use `asyncio.run()` or similar methods to invoke async database operations, or switch database operations to synchronous methods (not recommended). Given the project uses FastAPI, an async environment is likely already set up. The provided example includes necessary imports and logger setup, assuming standard Python async practices.

### Step 5: Verify Integration

1.  Restart the `backend` service to apply changes to `mqtt_client.py`.
2.  Monitor the `backend` service logs to check if messages from the Shelly device are received and processed, and if power records are saved successfully.
3.  Inspect the `records` collection in your database to confirm new power data associated with your Shelly device is being stored.
4.  (Optional) If the frontend is designed to display real-time or historical power data, verify that the data is displayed correctly.

## Conclusion

Following these steps, you can integrate the Shelly Plus Plug US device into your Elektron project. The key is correctly configuring the Shelly device's MQTT settings and adjusting the backend MQTT client to subscribe to the appropriate topics, parse the Shelly-specific message format, and associate the extracted data (like power readings) with the corresponding device record in your system for storage.
