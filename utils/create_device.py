import requests
import sys
import json

# Device information to add
def create_smart_plug(device_id=None, name="Smart Plug"):
    device_data = {
        "name": name,
        "device_type": "Smart Plug",
        "location": "Living Room",
        "model": "Smart Plug US",
        "manufacturer": "Elektron",
        "firmware_version": "1.0.0",
        "is_active": True
    }
    
    # If device ID is provided, try using it
    if device_id:
        device_data["_id"] = device_id
    
    # API endpoint
    api_url = "http://localhost:8000/api/device"
    
    try:
        # Send POST request to create device
        response = requests.post(api_url, json=device_data)
        response.raise_for_status()
        print(f"Successfully created device: {response.json()}")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Failed to create device: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Error response: {e.response.text}")
        return None

if __name__ == "__main__":
    # If device ID is provided in the command line, use it
    device_id = sys.argv[1] if len(sys.argv) > 1 else None
    device_name = sys.argv[2] if len(sys.argv) > 2 else "Smart Plug"
    create_smart_plug(device_id, device_name) 