from unittest.mock import patch, MagicMock
from datetime import datetime
from scheduler.sch import run_consumer_job

def test_run_consumer_job_with_mocked_kafka():
    with patch("scheduler.sch.consume_messages") as mock_consume_messages:
        run_consumer_job()
        mock_consume_messages.assert_called_once()