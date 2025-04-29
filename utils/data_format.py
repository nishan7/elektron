#   elektron/utils/data_format.py (New file - you might need to create this)
import json
from datetime import datetime
from typing import Dict, Any

def create_power_reading(
    device_id: str,
    voltage: float,
    current: float,
    power: float,
    energy: float,
    power_factor: float,
    timestamp: datetime = None
) -> Dict[str, Any]:
    """
    Creates a dictionary representing a power reading.

    Args:
        device_id: Unique identifier for the device.
        voltage: Voltage in volts.
        current: Current in amperes.
        power: Power in watts.
        energy: Energy consumption in kWh.
        power_factor: Power factor.
        timestamp: Timestamp of the reading. If None, the current UTC time is used.

    Returns:
        A dictionary containing the power reading data.
    """

    if not timestamp:
        timestamp = datetime.utcnow()
    timestamp_str = timestamp.isoformat() + "Z"  #   Ensure UTC with ISO 8601 and 'Z'

    return {
        "device_id": device_id,
        "timestamp": timestamp_str,
        "voltage": voltage,
        "current": current,
        "power": power,
        "energy": energy,
        "power_factor": power_factor,
    }

def reading_to_json(reading: Dict[str, Any]) -> str:
    """
    Serializes a power reading dictionary to a JSON string.

    Args:
        reading: The power reading dictionary.

    Returns:
        A JSON string representing the reading.
    """
    return json.dumps(reading)

def json_to_reading(json_str: str) -> Dict[str, Any]:
    """
    Deserializes a JSON string to a power reading dictionary.

    Args:
        json_str: The JSON string to deserialize.

    Returns:
        A dictionary containing the power reading data.
    """
    return json.loads(json_str)

#   Example Usage
if __name__ == '__main__':
    sample_reading = create_power_reading(
        device_id="smart-plug-001",
        voltage=120.1,
        current=5.5,
        power=660.55,
        energy=2.3,
        power_factor=0.92
    )
    print("Sample Reading:", sample_reading)

    json_reading = reading_to_json(sample_reading)
    print("JSON Reading:", json_reading)

    deserialized_reading = json_to_reading(json_reading)
    print("Deserialized Reading:", deserialized_reading)