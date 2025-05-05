#!/usr/bin/env python3
"""
Fix MQTT error - Create corresponding device record for device ID found in logs
Usage: python fix_device_error.py [Device ID] 
"""

import requests
import sys
import json
import re
import time

def extract_device_ids_from_log(log_text):
    """Extract device ID from MQTT error logs"""
    pattern = r"Device with id ([0-9a-f]+) does not exist"
    device_ids = set(re.findall(pattern, log_text))
    return list(device_ids)

def create_device(device_id, device_name=None):
    """Create device in the system"""
    if not device_name:
        device_name = f"Smart Plug {device_id[-6:]}"
    
    device_data = {
        "name": device_name,
        "device_type": "Smart Plug",
        "location": "Living Room",
        "model": "Smart Plug US",
        "manufacturer": "Elektron",
        "firmware_version": "1.0.0",
        "is_active": True,
        "_id": device_id
    }
    
    # API endpoint
    api_url = "http://localhost:8000/api/device"
    
    try:
        # Send POST request to create the device
        response = requests.post(api_url, json=device_data)
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        print(f"Successfully created device {device_id}: {device_name}")
        return True
    except requests.exceptions.HTTPError as e:
        print(f"Failed to create device: HTTP {response.status_code}")
        print(f"Response: {response.text}")
        return False
    except requests.exceptions.RequestException as e:
        print(f"Failed to create device: {e}")
        return False

def main():
    # If command-line arguments are provided, use them as device ID
    if len(sys.argv) > 1:
        device_id = sys.argv[1]
        device_name = sys.argv[2] if len(sys.argv) > 2 else None
        create_device(device_id, device_name)
        return
    
    # Otherwise, prompt the user to paste the log
    print("Please paste the log text containing the MQTT error, then press Ctrl+D (Unix) or Ctrl+Z then Enter (Windows):")
    
    log_text = ""
    try:
        while True:
            line = input()
            log_text += line + "\n"
    except (EOFError, KeyboardInterrupt):
        pass
    
    # Extract device IDs from the log
    device_ids = extract_device_ids_from_log(log_text)
    
    if not device_ids:
        print("No device IDs found in the log. Please ensure the log contains 'Device with id X does not exist' type errors.")
        return
    
    print(f"Found {len(device_ids)} missing device IDs:")
    for idx, device_id in enumerate(device_ids):
        print(f"{idx + 1}. {device_id}")
    
    # Ask the user if they want to create these devices
    choice = input("Do you want to create device records for all these device IDs? (y/n): ")
    
    if choice.lower() == 'y':
        for device_id in device_ids:
            success = create_device(device_id)
            if success:
                print(f"Device record created for device ID {device_id}")
            else:
                print(f"Failed to create device record for device ID {device_id}")
            time.sleep(0.5)  # Prevent request spam
        
        print("Completed! All device records have been created.")
    else:
        print("Operation cancelled.")

if __name__ == "__main__":
    main() 