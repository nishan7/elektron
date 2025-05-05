# utils/plug_power.py
import requests
import time
import random
import json
import paho.mqtt.client as mqtt
import threading
import logging
from datetime import datetime, timezone

# --- Configuration ---
BACKEND_API_URL = "http://backend:8000" # Use Docker service name
DEVICE_API_ENDPOINT = "/api/device"
MQTT_BROKER_HOST = "mqtt" # Use Docker service name
MQTT_BROKER_PORT = 1883 # Confirm MQTT Broker port
TARGET_DEVICE_TYPE = "Smart Plug" # Device type to monitor (from device pairing guide)
API_POLL_INTERVAL_SECONDS = 15 # Time interval to check for new devices (seconds)
DATA_INTERVAL_SECONDS = 15 # Time interval to send power data (seconds)
POWER_MIN_W = 1.41
POWER_MAX_W = 20.78

# --- Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Status ---
simulated_devices = set() # Store device_ids being simulated
stop_event = threading.Event() # For gracefully stopping threads

def get_devices_from_api():
    """Get device list from backend API"""
    try:
        url = f"{BACKEND_API_URL}{DEVICE_API_ENDPOINT}"
        # Add a small delay before the first API call after startup
        # time.sleep(5) 
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        # Try different possible response structures
        data = response.json()
        if isinstance(data, list):
            return data # Directly return list
        elif isinstance(data, dict) and "devices" in data and isinstance(data["devices"], list):
             return data["devices"] # Return list under 'devices' key
        else:
            logger.warning(f"Unexpected API response structure: {data}")
            return []
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching devices from API ({url}): {e}")
        return []
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding API response from {url}: {e}")
        return []

def simulate_device_power(device_id):
    """Simulate sending power data for a single device"""
    client_id = f"simulator-{device_id}-{random.randint(1000, 9999)}"
    mqtt_client = mqtt.Client(client_id=client_id)

    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            logger.info(f"MQTT client for {device_id} connected.")
        else:
            logger.error(f"MQTT connection failed for {device_id}, code: {rc}")

    def on_disconnect(client, userdata, rc):
        logger.warning(f"MQTT client for {device_id} disconnected, code: {rc}")

    mqtt_client.on_connect = on_connect
    mqtt_client.on_disconnect = on_disconnect

    try:
        mqtt_client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, 60)
        mqtt_client.loop_start() # Start network loop in background thread
    except Exception as e:
        logger.error(f"Could not connect MQTT for {device_id}: {e}")
        return # Stop simulation for this device if connection fails

    topic = f"elektron/device/{device_id}/data"
    logger.info(f"Starting power simulation for {device_id} on topic {topic}")

    while not stop_event.is_set():
        if not mqtt_client.is_connected():
             logger.warning(f"MQTT client for {device_id} is not connected. Attempting to reconnect...")
             try:
                 mqtt_client.reconnect()
             except Exception as e:
                 logger.error(f"Reconnect failed for {device_id}: {e}")
                 time.sleep(DATA_INTERVAL_SECONDS) # Wait before retrying
                 continue

        power = round(random.uniform(POWER_MIN_W, POWER_MAX_W), 2)
        timestamp = datetime.now(timezone.utc).isoformat() # ISO 8601 format

        payload = {
            "device_id": device_id, # Include device_id in payload as seen in mqtt_client.py
            "power": power,
            "timestamp": timestamp
            # Add other fields if required by backend's update_record
        }
        payload_str = json.dumps(payload)

        try:
            result = mqtt_client.publish(topic, payload=payload_str, qos=1) # Use QoS 1
            result.wait_for_publish(timeout=5) # Wait for publish confirmation
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                 logger.info(f"Sent power data for {device_id}: {power:.2f}W")
            else:
                 logger.warning(f"Failed to publish for {device_id}: {mqtt.error_string(result.rc)}")
        except ValueError as e: # Handles timeout in wait_for_publish
            logger.warning(f"Publish timeout for {device_id}: {e}")
        except Exception as e:
            logger.error(f"Error publishing for {device_id}: {e}")
            # Consider stopping loop or attempting reconnect if publish fails repeatedly

        time.sleep(DATA_INTERVAL_SECONDS)

    # Cleanup when stop_event is set
    logger.info(f"Stopping simulation for {device_id}")
    mqtt_client.loop_stop()
    mqtt_client.disconnect()


def monitor_devices():
    """Main loop: monitor devices and start simulation threads"""
    threads = {} # device_id -> thread

    # Add a delay before the first API poll to allow backend to start
    initial_delay = 10
    logger.info(f"Waiting {initial_delay} seconds before first API poll...")
    time.sleep(initial_delay)

    while not stop_event.is_set():
        logger.info("Polling API for devices...")
        current_devices = get_devices_from_api()
        
        if current_devices:
            logger.info(f"Found {len(current_devices)} devices")
            for device in current_devices:
                logger.info(f"Device: {device}")
        else:
            logger.warning("No devices found from API")
            
        found_target_device_ids = set()

        for device in current_devices:
            # Adjust key names based on actual API response ('_id' vs 'id', 'device_type' vs 'type')
            device_id = None
            
            # MongoDB ObjectId handling
            if "_id" in device:
                if isinstance(device["_id"], dict) and "$oid" in device["_id"]:
                    device_id = device["_id"]["$oid"]
                else:
                    device_id = str(device["_id"])  # Convert to string to ensure consistency
            elif "id" in device:
                device_id = str(device["id"])
                
            device_type = device.get("device_type") or device.get("type")
            
            logger.info(f"Processing device ID: {device_id}, Type: {device_type}")

            if not device_id:
                 logger.debug(f"Skipping device with invalid/missing ID: {device}")
                 continue

            # Check if this is a Smart Plug device
            if device_type and device_type.lower() == TARGET_DEVICE_TYPE.lower():
                 found_target_device_ids.add(device_id)
                 if device_id not in simulated_devices:
                     logger.info(f"Detected new target device: {device_id} (Type: {device_type})")
                     simulated_devices.add(device_id)
                     thread = threading.Thread(target=simulate_device_power, args=(device_id,))
                     thread.daemon = True # Allow program to exit even if threads are running
                     threads[device_id] = thread
                     thread.start()

        time.sleep(API_POLL_INTERVAL_SECONDS)

    # Cleanup all threads on exit
    logger.info("Stopping all simulation threads...")
    for thread in threads.values():
        if thread.is_alive():
             thread.join() # Wait for threads to finish (respecting stop_event)

if __name__ == "__main__":
    logger.info(f"Starting device monitor and power simulator.")
    logger.info(f"Target Device Type: {TARGET_DEVICE_TYPE}")
    logger.info(f"Backend API: {BACKEND_API_URL}{DEVICE_API_ENDPOINT}")
    logger.info(f"MQTT Broker: {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}")

    monitor_thread = threading.Thread(target=monitor_devices)
    monitor_thread.start()

    try:
        # Keep the main thread alive until Ctrl+C
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Ctrl+C received, shutting down simulator...")
        stop_event.set() # Signal all threads to stop
        monitor_thread.join() # Wait for monitor thread to finish cleanup
        logger.info("Simulator shut down gracefully.") 