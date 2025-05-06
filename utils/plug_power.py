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
API_POLL_INTERVAL_SECONDS = 30 # Time interval to check for new devices (seconds)
DATA_INTERVAL_SECONDS = 30 # Time interval to send power data (seconds)
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

def simulate_device_power(device_id, device_stop_event):
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

    while not device_stop_event.is_set():
        if not mqtt_client.is_connected():
             logger.warning(f"MQTT client for {device_id} is not connected. Attempting to reconnect...")
             try:
                 mqtt_client.reconnect()
             except Exception as e:
                 logger.error(f"Reconnect failed for {device_id}: {e}")
                 # Wait before retrying, but also check stop event
                 if device_stop_event.wait(DATA_INTERVAL_SECONDS):
                     break # Exit if stop event is set during wait
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

        # Wait for the next interval or until stop_event is set
        if device_stop_event.wait(DATA_INTERVAL_SECONDS):
            break # Exit loop if stop event is set

    # Cleanup when stop_event is set
    logger.info(f"Stopping simulation for {device_id}")
    mqtt_client.loop_stop()
    mqtt_client.disconnect()


def monitor_devices():
    """Main loop: monitor devices and start simulation threads"""
    threads = {} # device_id -> {"thread": thread_object, "stop_event": device_specific_stop_event}

    # Add a delay before the first API poll to allow backend to start
    initial_delay = 10
    logger.info(f"Waiting {initial_delay} seconds before first API poll...")
    time.sleep(initial_delay)

    while not stop_event.is_set():
        logger.info("Polling API for devices...")
        current_devices_from_api = get_devices_from_api()
        
        if current_devices_from_api:
            logger.info(f"Found {len(current_devices_from_api)} devices from API")
            # for device in current_devices_from_api: # Logging individual devices can be verbose
            #     logger.info(f"Device details from API: {device}")
        else:
            logger.warning("No devices found from API this poll.")
            
        current_smart_plug_ids = set()

        for device_api_data in current_devices_from_api:
            device_id = None
            if "_id" in device_api_data:
                if isinstance(device_api_data["_id"], dict) and "$oid" in device_api_data["_id"]:
                    device_id = device_api_data["_id"]["$oid"]
                else:
                    device_id = str(device_api_data["_id"])
            elif "id" in device_api_data:
                device_id = str(device_api_data["id"])
                
            device_type = device_api_data.get("device_type") or device_api_data.get("type")
            
            # logger.info(f"Processing device ID from API: {device_id}, Type: {device_type}") # Can be verbose

            if not device_id:
                 logger.debug(f"Skipping device with invalid/missing ID: {device_api_data}")
                 continue

            if device_type and device_type.lower() == TARGET_DEVICE_TYPE.lower():
                 current_smart_plug_ids.add(device_id)

        # Stop threads for devices that are no longer present or no longer smart plugs
        active_thread_device_ids = list(threads.keys()) # Iterate over a copy
        for device_id in active_thread_device_ids:
            if device_id not in current_smart_plug_ids:
                logger.info(f"Smart Plug {device_id} no longer detected or changed type. Stopping simulation.")
                if device_id in threads:
                    threads[device_id]["stop_event"].set()
                    threads[device_id]["thread"].join(timeout=DATA_INTERVAL_SECONDS + 5) # Wait for thread to finish
                    if threads[device_id]["thread"].is_alive():
                        logger.warning(f"Thread for {device_id} did not stop in time.")
                    del threads[device_id]
                    # simulated_devices.discard(device_id) # No longer using global simulated_devices

        # Start threads for new Smart Plug devices
        for device_id in current_smart_plug_ids:
            if device_id not in threads:
                logger.info(f"Detected new target Smart Plug: {device_id}. Starting simulation.")
                device_specific_stop_event = threading.Event()
                thread = threading.Thread(target=simulate_device_power, args=(device_id, device_specific_stop_event))
                thread.daemon = True 
                threads[device_id] = {"thread": thread, "stop_event": device_specific_stop_event}
                thread.start()
                # simulated_devices.add(device_id) # No longer using global simulated_devices
            elif not threads[device_id]["thread"].is_alive():
                logger.info(f"Thread for Smart Plug {device_id} was not alive. Restarting simulation.")
                # Ensure old event is cleared if reusing, or create new
                threads[device_id]["stop_event"].clear() # Clear old event if reusing
                # Alternatively, re-initialize like a new device to be safer:
                # device_specific_stop_event = threading.Event()
                # thread = threading.Thread(target=simulate_device_power, args=(device_id, device_specific_stop_event))
                # thread.daemon = True
                # threads[device_id] = {"thread": thread, "stop_event": device_specific_stop_event}
                # thread.start()
                # For now, just restart the existing one after clearing its event
                new_thread = threading.Thread(target=simulate_device_power, args=(device_id, threads[device_id]["stop_event"]))
                new_thread.daemon = True
                threads[device_id]["thread"] = new_thread
                new_thread.start()


        if stop_event.wait(API_POLL_INTERVAL_SECONDS): # Use wait on global stop_event
            break # Exit monitor loop if global stop_event is set

    # Cleanup all threads on exit of monitor_devices
    logger.info("Stopping all simulation threads as monitor_devices is exiting...")
    for device_id in list(threads.keys()): # Iterate over a copy
        logger.info(f"Signalling stop for {device_id}...")
        if threads[device_id]["stop_event"]:
            threads[device_id]["stop_event"].set()
        if threads[device_id]["thread"].is_alive():
            logger.info(f"Waiting for thread {device_id} to join...")
            threads[device_id]["thread"].join(timeout=DATA_INTERVAL_SECONDS + 10) # Increased timeout slightly
            if threads[device_id]["thread"].is_alive():
                 logger.warning(f"Thread {device_id} did not shut down cleanly after stop signal.")
        del threads[device_id]
    logger.info("All simulation threads signaled to stop.")

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