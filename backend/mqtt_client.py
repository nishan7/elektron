import os
import paho.mqtt.client as mqtt
import logging
from services.records import update_record # Assuming update_record is the function to process data
import json
from pydantic import ValidationError
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get MQTT Broker configuration from environment variables, consistent with docker-compose.yml
MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost") # Default value for local testing
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", 1883))
MQTT_KEEPALIVE = 60

# --- Define topics ---
# This is an example topic structure, adjust according to your needs
# For example, devices use 'elektron/device/{device_id}/data' to publish data
DEVICE_DATA_TOPIC = "elektron/device/+/data" # '+' is a single-level wildcard

def on_connect(client, userdata, flags, rc):
    """MQTT connection callback function"""
    if rc == 0:
        logger.info(f"Connected to MQTT Broker: {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}")
        # Subscribe to topics upon successful connection
        client.subscribe(DEVICE_DATA_TOPIC)
        logger.info(f"Subscribed to topic: {DEVICE_DATA_TOPIC}")
    else:
        logger.error(f"Failed to connect to MQTT Broker, return code {rc}")

def on_disconnect(client, userdata, rc):
    """MQTT disconnection callback function"""
    logger.warning(f"Disconnected from MQTT Broker with result code {rc}")
    # You can add reconnection logic here if rc != 0: client.reconnect()

def on_message(client, userdata, msg):
    """MQTT message handling callback function"""
    topic = msg.topic
    payload = msg.payload.decode('utf-8')
    logger.info(f"Received message from topic '{topic}': {payload}")
    
    try:
        # Example: Process data from devices
        if topic.startswith("elektron/device/") and topic.endswith("/data"):
            device_id = topic.split('/')[2]
            data = json.loads(payload)
            # Here you would typically store the data, process it, etc.
            logger.info(f"Processing data for device {device_id}: Power={data.get('power')}W")
        else:
            logger.warning(f"Received message on unhandled topic: {topic}")
    except json.JSONDecodeError:
        logger.error(f"Failed to decode JSON payload from topic '{topic}': {payload}")
    except Exception as e:
        logger.exception(f"Error processing message from topic '{topic}': {e}")

def create_mqtt_client():
    """Function to initialize and run the MQTT client"""
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    # Set last will message (optional)
    # client.will_set("elektron/status", payload="backend_offline", qos=1, retain=True)

    # Add authentication (if your Broker requires it)
    # client.username_pw_set(username="your_username", password="your_password")

    try:
        logger.info(f"Attempting to connect to MQTT broker at {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}...")
        client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, MQTT_KEEPALIVE)
    except Exception as e:
        logger.error(f"Could not connect to MQTT Broker: {e}")
        # Decide if you want to retry or exit
        # For simplicity, we exit here. In a real application, implement retry logic.
        return

    # Start the network loop in a non-blocking way
    client.loop_start()
    logger.info("MQTT client loop started.")

    # Keep the script running (e.g., in a background thread or using client.loop_forever())
    try:
        while True:
            # Keep the main thread running for testing
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down MQTT client...")
        client.loop_stop()
        client.disconnect()
        logger.info("MQTT client disconnected.")

    return client

# A startup function can be added here to be called by main.py
def start_mqtt_loop():
    client = create_mqtt_client()
    # client.loop_forever() # Blocking loop, will block the main thread
    client.loop_start() # Non-blocking loop, runs in a separate thread
    logger.info("MQTT client loop started in background thread.")
    return client

# Used for testing this module independently
if __name__ == "__main__":
    client = start_mqtt_loop()
    # Keep the main thread running for testing
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Stopping MQTT client...")
        client.loop_stop()
        client.disconnect()
        logger.info("MQTT client stopped.") 