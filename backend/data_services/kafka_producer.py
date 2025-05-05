#   elektron/utils/kafka_producer.py
import datetime
import json
import os
import time
import random

from confluent_kafka import Producer

KAFKA_BOOTSTRAP_SERVER = os.getenv('KAFKA_BOOTSTRAP_SERVER', 'localhost:9092')
KAFKA_TOPIC = 'readings'
DEVICE_IDS = ["smart-meter-001", "smart-plug-002", "smart-meter-003"]  # Example device IDs
import socket

conf = {'bootstrap.servers': KAFKA_BOOTSTRAP_SERVER,
        'client.id': socket.gethostname()}
producer = Producer(conf)


def run_producer():
    """Runs the Kafka producer loop."""

    try:
        while True:
            for device_id in DEVICE_IDS:
                reading = {"device_id": "681012976bb14e7b76a00631",
                           "timestamp": datetime.datetime.utcnow(),
                           "power": random.uniform(0, 100), }

                producer.produce(KAFKA_TOPIC, json.dumps(reading, default=str))  # Send as bytes
                print("Posted data", reading)
            time.sleep(5)  # Produce every 5 seconds

    except KeyboardInterrupt:
        print("Producer stopped.")
    finally:
        producer.flush()


if __name__ == '__main__':
    run_producer()
