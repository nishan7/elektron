#   elektron/utils/kafka_producer.py
import datetime
import json
import os
import time
import random

from confluent_kafka import Producer

KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'readings')
KAFKA_BOOTSTRAP_SERVER = os.getenv('KAFKA_BOOTSTRAP_SERVER', 'localhost:9093')

DEVICE_IDS = ["6817d8c04173230e40ca2bb2", "6817d8c84173230e40ca2bb3"]  # Example device IDs
import socket

conf = {'bootstrap.servers': KAFKA_BOOTSTRAP_SERVER,
        'client.id': socket.gethostname()}
producer = Producer(conf)
print(conf)


def run_producer():
    """Runs the Kafka producer loop."""

    try:
        while True:
            for device_id in DEVICE_IDS:
                now = datetime.datetime.now(datetime.timezone.utc).astimezone()  # Local time
                hour = now.hour

                # Adjust weight to simulate more readings during morning (6–10 AM) and evening (6–10 PM)
                if 6 <= hour <= 10 or 18 <= hour <= 22:
                    power = random.uniform(60, 100)
                else:
                    power = random.uniform(0, 60)

                reading = {
                    "device_id": device_id,
                    "timestamp": datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(0, 365),
                                                                                 hours=random.randint(0, 23),
                                                                                 minutes=random.randint(0, 59),
                                                                                 seconds=random.randint(0, 59)),
                    "power": power,
                }

                producer.produce(KAFKA_TOPIC, json.dumps(reading, default=str))  # Send as bytes
                print("Posted data", reading)
            time.sleep(5)  # Produce every 5 seconds

    except KeyboardInterrupt:
        print("Producer stopped.")
    finally:
        producer.flush()


if __name__ == '__main__':
    run_producer()
