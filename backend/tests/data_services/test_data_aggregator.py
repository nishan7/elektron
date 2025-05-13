from datetime import datetime

import pytest
from unittest.mock import patch, MagicMock
from confluent_kafka import KafkaError
from data_services.data_aggregator import consume_messages


def processes_valid_messages_successfully():
    mock_consumer = MagicMock()
    mock_consumer.consume.return_value = [
        MagicMock(value=lambda: b'{"timestamp": "2023-01-01T12:00:00", "data": "value"}', error=lambda: None)
    ]
    with patch("data_services.data_aggregator.Consumer", return_value=mock_consumer):
        with patch("services.records.update_record") as mock_update_record:
            consume_messages()
            mock_update_record.assert_called_once_with({
                "timestamp": datetime.fromisoformat("2023-01-01T12:00:00"),
                "data": "value"
            })


def test_skips_messages_with_decoding_errors():
    mock_consumer = MagicMock()
    mock_consumer.consume.return_value = [
        MagicMock(value=lambda: b'invalid_json', error=lambda: None)
    ]
    with patch("data_services.data_aggregator.Consumer", return_value=mock_consumer):
        with patch("services.records.update_record") as mock_update_record:
            consume_messages()
            mock_update_record.assert_not_called()


def test_handles_kafka_errors_gracefully():
    mock_consumer = MagicMock()
    mock_consumer.consume.return_value = [
        MagicMock(value=lambda: None, error=lambda: MagicMock(code=lambda: KafkaError._PARTITION_EOF))
    ]
    with patch("data_services.data_aggregator.Consumer", return_value=mock_consumer):
        consume_messages()  # Should not raise any exceptions
