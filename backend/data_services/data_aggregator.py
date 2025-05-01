import json
import os
from datetime import datetime

from confluent_kafka import Consumer, KafkaError

from services.records import update_record

KAFKA_TOPIC = 'readings'
KAFKA_BOOTSTRAP_SERVER = os.getenv('KAFKA_BOOTSTRAP_SERVER', 'localhost:9092')
# Kafka configuration
conf = {
    'bootstrap.servers': KAFKA_BOOTSTRAP_SERVER,
    'group.id': 'mygroup',
    'auto.offset.reset': 'earliest'
}

consumer = Consumer(conf)
consumer.subscribe(['readings'])
user_action_counts = {}

def consume_messages():
    try:
        messages = consumer.consume(num_messages=10000, timeout=5)

        for msg in messages:
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    print(msg.error())
                    break

            # Decode the message value
            try:
                data = json.loads(msg.value().decode('utf-8'))
                if "timestamp" in data:
                    data["timestamp"] = datetime.fromisoformat(data["timestamp"])
                update_record(data)
            except Exception:
                continue
            print(data)
    except KeyboardInterrupt:
        pass
    except RuntimeError as e:
            pass
    finally:
        # Close the consumer
        consumer.close()

# Print final user action counts
