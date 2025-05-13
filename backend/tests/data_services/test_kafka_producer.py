# import pytest
# from unittest.mock import patch, MagicMock
# from datetime import datetime, timedelta, timezone
# import random
# import json
# from backend.data_services.kafka_producer import run_producer, producer, KAFKA_TOPIC
#
# def test_produces_valid_readings_to_kafka():
#     with patch("data_services.kafka_producer.run_producer") as mock_producer:
#         with patch("data_services.kafka_producer.time.sleep", return_value=None):
#             run_producer()
#             assert mock_producer.return_value.produce.call_count > 0
#             for call in mock_producer.return_value.produce.call_args_list:
#                 topic, message = call[0]
#                 assert topic == KAFKA_TOPIC
#                 data = json.loads(message)
#                 assert "device_id" in data
#                 assert "timestamp" in data
#                 assert "power" in data
#                 assert 0 <= data["power"] <= 100
#
# def test_handles_keyboard_interrupt_gracefully():
#     with patch("backend.data_services.kafka_producer.producer") as mock_producer:
#         with patch("backend.data_services.kafka_producer.time.sleep", side_effect=KeyboardInterrupt):
#             run_producer()
#             mock_producer.flush.assert_called_once()
#
# def test_produces_readings_with_correct_time_range():
#     with patch("backend.data_services.kafka_producer.producer") as mock_producer:
#         with patch("backend.data_services.kafka_producer.time.sleep", return_value=None):
#             now = datetime.now(timezone.utc).astimezone()
#             with patch("backend.data_services.kafka_producer.datetime") as mock_datetime:
#                 mock_datetime.datetime.now.return_value = now
#                 run_producer()
#                 for call in mock_producer.produce.call_args_list:
#                     message = json.loads(call[0][1])
#                     hour = now.hour
#                     if 6 <= hour <= 10 or 18 <= hour <= 22:
#                         assert 60 <= message["power"] <= 100
#                     else:
#                         assert 0 <= message["power"] <= 60
#
# def test_produces_readings_with_correct_time_range():
#     with patch("backend.data_services.kafka_producer.producer") as mock_producer:
#         with patch("backend.data_services.kafka_producer.time.sleep", return_value=None):
#             now = datetime.now(timezone.utc).astimezone()
#             with patch("backend.data_services.kafka_producer.datetime") as mock_datetime:
#                 mock_datetime.now.return_value = now
#                 run_producer()
#                 for call in mock_producer.produce.call_args_list:
#                     message = json.loads(call[0][1])
#                     hour = now.hour
#                     if 6 <= hour <= 10 or 18 <= hour <= 22:
#                         assert 60 <= message["power"] <= 100
#                     else:
#                         assert 0 <= message["power"] <= 60