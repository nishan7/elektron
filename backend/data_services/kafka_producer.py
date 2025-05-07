#   elektron/utils/kafka_producer.py
import datetime
import json
import os
import time
import random
import socket

from confluent_kafka import Producer

KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'readings')
KAFKA_BOOTSTRAP_SERVER = os.getenv('KAFKA_BOOTSTRAP_SERVER', 'localhost:9093')

DEVICE_IDS = ["681b26078d3cbf172cde9d64", "681b88df891e8bddeb948477", "681b8755128c377665dd5d31"]

conf = {'bootstrap.servers': KAFKA_BOOTSTRAP_SERVER,
        'client.id': socket.gethostname()}
producer = Producer(conf)
print("Kafka Producer Config:", conf)

def run_producer():
    """Runs the Kafka producer loop."""
    print("Starting Kafka producer...")
    try:
        while True:
            for device_id in DEVICE_IDS:
                # Simulate current time readings
                now_utc = datetime.datetime.utcnow() 
                local_time = now_utc.replace(tzinfo=datetime.timezone.utc).astimezone()
                hour = local_time.hour

                # Adjust weight based on local hour
                if 6 <= hour <= 10 or 18 <= hour <= 22:
                    power = round(random.uniform(60, 100), 2)
                else:
                    power = round(random.uniform(0, 60), 2)

                reading = {
                    "device_id": device_id,
                    # Use current UTC timestamp for storage
                    "timestamp": now_utc,
                    "power": power,
                }

                try:
                    # Produce message
                    producer.produce(KAFKA_TOPIC, json.dumps(reading, default=str), callback=delivery_report)
                except BufferError:
                     print(f'Local producer queue is full ({len(producer)} messages awaiting delivery): try again')
                     time.sleep(1) # Wait if queue is full
                except Exception as e:
                     print(f"Error producing message: {e}")
                     time.sleep(5) # Wait before retrying on other errors

            producer.poll(0) # Serve delivery reports (non-blocking)
            time.sleep(5)  # Produce for each device every 5 seconds

    except KeyboardInterrupt:
        print("Producer stopped by user.")
    finally:
        print("Flushing final messages...")
        producer.flush() # Ensure all messages are sent before exiting
        print("Producer flushed and closed.")

# Optional: Callback function to check message delivery status
def delivery_report(err, msg):
    """ Called once for each message produced to indicate delivery result. Triggered by poll() or flush(). """
    if err is not None:
        print(f'Message delivery failed for {msg.key()}: {err}')
    else:
        # Uncomment below for verbose success logging
        # print(f'Message delivered to {msg.topic()} [{msg.partition()}] @ offset {msg.offset()}')
        pass 

if __name__ == '__main__':
    run_producer()
