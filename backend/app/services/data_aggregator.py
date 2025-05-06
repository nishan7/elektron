#   elektron/backend/app/services/data_aggregator.py
import json
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

from kafka import KafkaConsumer
from pymongo import MongoClient, errors
import time

KAFKA_BOOTSTRAP_SERVER = '172.19.0.7:9092'  #   Replace with the actual IP address
KAFKA_TOPIC = "power-readings"
MONGO_URI = "mongodb://mongodb:27017/"
MONGO_DB = "electricity_monitor"
MONGO_COLLECTION = "aggregated_power_data"
AGGREGATION_INTERVAL = 300  #   5 minutes in seconds
KAFKA_RETRY_ATTEMPTS = 5  #   Number of times to retry Kafka connection
KAFKA_RETRY_DELAY = 5  #   Seconds to wait between retries
CONSUMER_STARTUP_DELAY = 20  #   Seconds to wait before consumer starts

class DataAggregator:
    def __init__(self):
        self.consumer: Optional[KafkaConsumer] = None
        self.mongo_client: Optional[MongoClient] = None
        self.buffer: Dict[str, List[Dict[str, Any]]] = {}
        self.last_aggregation_time: Optional[datetime] = None
        self.setup_logging()

    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    def start_consumer(self):
        """Initializes the Kafka consumer with retry logic."""
        for attempt in range(KAFKA_RETRY_ATTEMPTS):
            try:
                self.consumer = KafkaConsumer(
                    KAFKA_TOPIC,
                    bootstrap_servers=KAFKA_BOOTSTRAP_SERVER,
                    auto_offset_reset="earliest",
                    enable_auto_commit=True,
                    value_deserializer=lambda x: json.loads(x.decode("utf-8")),
                )
                self.mongo_client = MongoClient(MONGO_URI)
                self.last_aggregation_time = datetime.utcnow()
                logging.info("Kafka consumer and MongoDB client initialized.")
                return  #   Success, exit the retry loop
            except Exception as e:
                logging.error(
                    f"Failed to initialize consumer (attempt {attempt + 1}): {e}",
                    exc_info=True,
                )
                if attempt < KAFKA_RETRY_ATTEMPTS - 1:
                    logging.info(f"Retrying Kafka connection in {KAFKA_RETRY_DELAY} seconds...")
                    time.sleep(KAFKA_RETRY_DELAY)
                else:
                    logging.error("Max Kafka connection retries exceeded. Exiting.")
                    self.cleanup()
                    raise  #   Re-raise the exception after retries fail

    def cleanup(self):
        """Closes Kafka consumer and MongoDB client."""
        if self.consumer:
            try:
                self.consumer.close()
                logging.info("Kafka consumer closed.")
            except Exception as e:
                logging.error(f"Error closing Kafka consumer: {e}", exc_info=True)
        if self.mongo_client:
            try:
                self.mongo_client.close()
                logging.info("MongoDB client closed.")
            except errors.PyMongoError as e:
                logging.error(f"Error closing MongoDB client: {e}", exc_info=True)

    def aggregate_data(self, device_readings: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Aggregates power readings for a device."""
        if not device_readings:
            return None

        try:
            total_voltage = sum(reading["voltage"] for reading in device_readings)
            total_current = sum(reading["current"] for reading in device_readings)
            total_power = sum(reading["power"] for reading in device_readings)
            total_energy = sum(reading["energy"] for reading in device_readings)
            total_power_factor = sum(reading["power_factor"] for reading in device_readings)

            num_readings = len(device_readings)
            avg_voltage = total_voltage / num_readings if num_readings > 0 else 0
            avg_current = total_current / num_readings if num_readings > 0 else 0
            avg_power = total_power / num_readings if num_readings > 0 else 0
            avg_energy = total_energy / num_readings if num_readings > 0 else 0
            avg_power_factor = total_power_factor / num_readings if num_readings > 0 else 0

            #   Use the timestamp of the first reading for aggregation time
            aggregation_time_str = device_readings[0]["timestamp"]
            aggregation_time = datetime.fromisoformat(
                aggregation_time_str.replace("Z", "+00:00")
            )

            return {
                "device_id": device_readings[0]["device_id"],
                "aggregation_time": aggregation_time,
                "avg_voltage": avg_voltage,
                "avg_current": avg_current,
                "avg_power": avg_power,
                "avg_energy": avg_energy,
                "avg_power_factor": avg_power_factor,
            }
        except KeyError as e:
            logging.error(f"Missing key in reading: {e}", exc_info=True)
            return None
        except Exception as e:
            logging.error(f"Error aggregating data: {e}", exc_info=True)
            return None

    def store_aggregated_data(self, aggregated_data: Dict[str, Any]):
        """Stores aggregated data in MongoDB."""
        if not aggregated_data:
            return

        try:
            collection = self.mongo_client[MONGO_DB][MONGO_COLLECTION]
            collection.insert_one(aggregated_data)
            logging.info(
                f"Stored aggregated data for {aggregated_data['device_id']} at {aggregated_data['aggregation_time']}."
            )
        except errors.PyMongoError as e:
            logging.error(f"MongoDB storage error: {e}", exc_info=True)

    async def consume_and_aggregate(self):
        """Consumes messages from Kafka, aggregates them, and stores them."""

        self.start_consumer()  #   Initialize consumer with retry logic

        if not self.consumer:
            logging.error("Consumer not initialized. Exiting.")
            return

        try:
            for message in self.consumer:
                reading = message.value
                logging.info(f"Received: {reading}")
                device_id = reading["device_id"]
                self.buffer.setdefault(device_id, []).append(reading)

                current_time = datetime.utcnow()
                if (
                    self.last_aggregation_time
                    and current_time - self.last_aggregation_time
                    >= timedelta(seconds=AGGREGATION_INTERVAL)
                ):
                    for device_id, device_readings in self.buffer.items():
                        aggregated = self.aggregate_data(device_readings)
                        if aggregated:
                            self.store_aggregated_data(aggregated)
                    self.buffer.clear()
                    self.last_aggregation_time = current_time

        except Exception as e:
            logging.error(f"Error during consumption: {e}", exc_info=True)
        finally:
            self.cleanup()

if __name__ == "__main__":
    aggregator = DataAggregator()
    asyncio.run(aggregator.consume_and_aggregate())