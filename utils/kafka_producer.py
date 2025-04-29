#   elektron/utils/kafka_producer.py
import time
import random
from kafka import KafkaProducer
from data_format import create_power_reading, reading_to_json  #   Import data format functions

KAFKA_BOOTSTRAP_SERVER = 'kafka:9092'
KAFKA_TOPIC = 'power-readings'
DEVICE_IDS = ["smart-meter-001", "smart-plug-002", "smart-meter-003"]  #   Example device IDs

def run_producer():
    """Runs the Kafka producer loop."""

    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVER,
        value_serializer=lambda v: v.encode('utf-8')  #   Serialize to bytes
    )

    try:
        while True:
            for device_id in DEVICE_IDS:
                voltage = round(random.uniform(110, 125), 2)
                current = round(random.uniform(1, 15), 2)
                power = round(voltage * current, 2)
                energy = round(random.uniform(0.1, 5.0), 2)
                power_factor = round(random.uniform(0.85, 1.0), 2)

                reading = {}
                reading = create_power_reading(
                    device_id=device_id,
                    voltage=voltage,
                    current=current,
                    power=power,
                    energy=energy,
                    power_factor=power_factor
                )
                json_reading = reading_to_json(reading)
                producer.send(KAFKA_TOPIC, value=json_reading)  #   Send as bytes
                print(f"Produced: {json_reading}")
            time.sleep(5)  #   Produce every 5 seconds

    except KeyboardInterrupt:
        print("Producer stopped.")
    finally:
        producer.close()

if __name__ == '__main__':
    run_producer()
