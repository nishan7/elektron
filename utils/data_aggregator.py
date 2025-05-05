import json
from datetime import datetime, timedelta
from kafka import KafkaConsumer
from pymongo import MongoClient
import logging
import asyncio

KAFKA_BOOTSTRAP_SERVER = 'kafka:9092'
KAFKA_TOPIC = 'power-readings'
MONGO_URI = "mongodb://mongodb:27017/"  #   MongoDB connection string
MONGO_DB = "electricity_monitor"
MONGO_COLLECTION = "aggregated_power_data"

class DataAggregator:
    def __init__(self):
        self.consumer = KafkaConsumer(
            KAFKA_TOPIC,
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVER,
            auto_offset_reset='earliest',  #   Start from the beginning if no offset
            consumer_timeout_ms=10000,  #   10 seconds timeout
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        self.mongo_client = MongoClient(MONGO_URI)
        self.mongo_db = self.mongo_client[MONGO_DB]
        self.mongo_collection = self.mongo_db[MONGO_COLLECTION]
        self.buffer = {}  #   Buffer to store readings for aggregation
        self.aggregation_interval = 300  #   5 minutes in seconds
        self.last_aggregation_time = datetime.utcnow()
        logging.basicConfig(level=logging.INFO)

    def aggregate_and_store(self):
        """Aggregates data and stores it in MongoDB."""
        if not self.buffer:
            logging.info("No data to aggregate.")
            return

        aggregated_data = {}
        for device_id, readings in self.buffer.items():
            if readings:
                #   Calculate averages (you can add more sophisticated aggregations)
                avg_voltage = sum(r['voltage'] for r in readings) / len(readings)
                avg_current = sum(r['current'] for r in readings) / len(readings)
                avg_power = sum(r['power'] for r in readings) / len(readings)
                avg_energy = sum(r['energy'] for r in readings) / len(readings)
                avg_power_factor = sum(r['power_factor'] for r in readings) / len(readings)

                #   Use the timestamp of the first reading as the aggregation time
                aggregation_time = readings[0]['timestamp']
                aggregated_data = {
                    "device_id": device_id,
                    "aggregation_time": aggregation_time,
                    "avg_voltage": avg_voltage,
                    "avg_current": avg_current,
                    "avg_power": avg_power,
                    "avg_energy": avg_energy,
                    "avg_power_factor": avg_power_factor
                }
                self.mongo_collection.insert_one(aggregated_data)
                logging.info(f"Aggregated data for {device_id} at {aggregation_time} stored in MongoDB.")
            else:
                logging.info(f"No readings for {device_id} to aggregate.")
        self.buffer.clear()

    async def consume_and_aggregate(self):
        """Consumes messages from Kafka, aggregates them, and stores them."""

        try:
            for message in self.consumer:
                reading = message.value
                device_id = reading['device_id']
                timestamp = datetime.fromisoformat(reading['timestamp'].replace('Z', '+00:00'))

                if device_id not in self.buffer:
                    self.buffer[device_id] = []
                self.buffer[device_id].append(reading)
                logging.info(f"Received reading: {reading}")

                current_time = datetime.utcnow()
                if current_time - self.last_aggregation_time >= timedelta(seconds=self.aggregation_interval):
                    self.aggregate_and_store()
                    self.last_aggregation_time = current_time
        except Exception as e:
            logging.error(f"Error during consumption or aggregation: {e}", exc_info=True)
        finally:
            self.consumer.close()
            self.mongo_client.close()

if __name__ == '__main__':
    aggregator = DataAggregator()
    asyncio.run(aggregator.consume_and_aggregate())
