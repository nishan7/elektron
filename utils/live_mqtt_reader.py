import paho.mqtt.client as mqtt
import json
import time
import threading
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MQTT configuration
MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "mqtt")  # Changed from "localhost" to "mqtt"
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", 1883))
MQTT_TOPIC = "elektron/device/+/data"
LIVE_DATA_FILE = "frontend/public/live_data.json"
SHARED_DATA_FILE = "shared_data/live_data.json"

# Data storage
max_data_points = 200  # Keep the most recent 200 data points
live_data = {}  # Device ID -> data list
data_lock = threading.Lock()  # Thread lock for safe data access

def on_connect(client, userdata, flags, rc):
    """MQTT connection callback"""
    if rc == 0:
        logger.info(f"Successfully connected to MQTT broker: {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}")
        client.subscribe(MQTT_TOPIC)
        logger.info(f"Subscribed to topic: {MQTT_TOPIC}")
    else:
        connection_result = {
            0: "Connection successful",
            1: "Protocol version error",
            2: "Invalid client identifier",
            3: "Server unavailable",
            4: "Username or password incorrect",
            5: "Not authorized"
        }
        error_message = connection_result.get(rc, f"Unknown error (code {rc})")
        logger.error(f"Failed to connect to MQTT broker, return code: {rc} - {error_message}")

def on_message(client, userdata, msg):
    """Process received MQTT messages"""
    topic = msg.topic
    payload = msg.payload.decode('utf-8')
    logger.info(f"Received message, topic '{topic}': {payload}")
    
    # Extract device ID from topic
    device_id = topic.split('/')[2]
    
    try:
        # Parse JSON payload
        data = json.loads(payload)
        
        # Ensure data contains necessary fields
        if "power" in data and "timestamp" in data:
            with data_lock:
                if device_id not in live_data:
                    live_data[device_id] = []
                
                # Add data point, including local timestamp
                data_point = {
                    "device_id": device_id,
                    "power": data["power"],
                    "timestamp": data["timestamp"],
                }
                
                live_data[device_id].append(data_point)
                
                # Limit the number of data points per device
                if len(live_data[device_id]) > max_data_points:
                    live_data[device_id] = live_data[device_id][-max_data_points:]
                
                # Write data to file for frontend use
                save_data_to_file()
                
                logger.info(f"Stored power data for device {device_id}: {data['power']}W")
        else:
            logger.warning(f"Message missing required fields (power or timestamp): {data}")
    
    except json.JSONDecodeError:
        logger.error(f"Unable to parse JSON: {payload}")
    except Exception as e:
        logger.exception(f"Error processing message: {e}")

def save_data_to_file():
    """Save live data to JSON file"""
    try:
        # Ensure directories exist
        os.makedirs(os.path.dirname(LIVE_DATA_FILE), exist_ok=True)
        os.makedirs(os.path.dirname(SHARED_DATA_FILE), exist_ok=True)
        
        # Generate JSON data
        json_data = json.dumps(live_data)
        
        # Save to original location
        with open(LIVE_DATA_FILE, 'w') as f:
            f.write(json_data)
            
        # Also save to shared data directory
        with open(SHARED_DATA_FILE, 'w') as f:
            f.write(json_data)
            
        logger.info(f"Live data written to file ({len(json_data)} bytes)")
    except Exception as e:
        logger.error(f"Error saving data to file: {e}")

def connect_with_retry(client, host, port, max_retries=5, delay=5):
    """Attempt to connect to MQTT broker, retrying on failure"""
    retries = 0
    
    # Log current environment
    logger.info(f"MQTT connection environment: Host={host}, Port={port}")
    logger.info(f"Current working directory: {os.getcwd()}")
    
    while retries < max_retries:
        try:
            logger.info(f"Attempting to connect to MQTT broker: {host}:{port} (attempt {retries + 1})")
            client.connect(host, port, 60)
            return True # Connection successful
        except Exception as e:
            retries += 1
            logger.error(f"Failed to connect to MQTT broker: {type(e).__name__}: {e}")
            logger.error(f"Retrying in {delay} seconds... ({retries}/{max_retries})")
            if retries >= max_retries:
                logger.error(f"Maximum retry attempts reached, giving up connection.")
                return False # Connection failed
            time.sleep(delay)

def main():
    """Main function"""
    # Create MQTT client
    client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
    client.on_connect = on_connect
    client.on_message = on_message
    
    # Add startup delay, wait for broker to be ready
    initial_delay = 10  # Increase delay time
    logger.info(f"Waiting {initial_delay} seconds for MQTT broker to start...")
    time.sleep(initial_delay)
    
    # Connect to MQTT broker with retry logic
    if not connect_with_retry(client, MQTT_BROKER_HOST, MQTT_BROKER_PORT, max_retries=10, delay=3):
        logger.error("Unable to connect to MQTT broker, script will continue running in background")
        while True:
            logger.info("Attempting to reconnect to MQTT broker...")
            if connect_with_retry(client, MQTT_BROKER_HOST, MQTT_BROKER_PORT, max_retries=1):
                break
            time.sleep(60)  # Try reconnecting every minute
    
    # Start MQTT client loop
    client.loop_start()
    
    try:
        # Keep program running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Exit signal received, shutting down...")
    finally:
        client.loop_stop()
        client.disconnect()
        logger.info("MQTT client closed")

if __name__ == "__main__":
    main() 