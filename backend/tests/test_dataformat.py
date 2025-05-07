import pytest
from datetime import datetime, timezone, timedelta

# Assuming your data_format.py is in elektron-working/utils/data_format.py
# Adjust import path if necessary.
# If 'utils' is not in PYTHONPATH when running pytest from root, this might fail.
# Consider adding `elektron-working` to PYTHONPATH or using relative imports if tests are run as a module.
# For now, let's try a direct import assuming pytest handles paths or is run from a location where `utils` is accessible.

try:
    from utils.data_format import format_timestamp, calculate_duration, format_bytes
except ImportError:
    # Fallback if the above doesn't work due to PYTHONPATH issues during testing
    import sys
    from pathlib import Path

    # Assumes this test file is in elektron-working/utils/tests/
    # and data_format.py is in elektron-working/utils/
    utils_dir = Path(__file__).resolve().parent.parent
    sys.path.insert(0, str(utils_dir.parent))  # Add 'elektron-working' to sys.path
    from utils.data_format import format_timestamp, calculate_duration, format_bytes


class TestDataFormat:
    def test_format_timestamp(self):
        # Test with a datetime object
        dt_obj = datetime(2023, 10, 26, 14, 30, 15, tzinfo=timezone.utc)
        assert format_timestamp(dt_obj) == "2023-10-26 14:30:15 UTC"

        # Test with an ISO string timestamp
        iso_str = "2023-10-26T10:00:00-04:00"  # UTC-4
        # Expected output should be in UTC after parsing
        assert format_timestamp(iso_str) == "2023-10-26 14:00:00 UTC"

        # Test with a Unix timestamp (integer)
        unix_ts = 1698328215  # Corresponds to 2023-10-26 14:30:15 UTC
        assert format_timestamp(unix_ts) == "2023-10-26 14:30:15 UTC"

        # Test with invalid input
        assert format_timestamp(None) == "Invalid date"
        assert format_timestamp("not a date") == "Invalid date"

    def test_calculate_duration(self):
        start_time = datetime.now(timezone.utc) - timedelta(hours=2, minutes=30)
        end_time = datetime.now(timezone.utc)

        # Test with datetime objects
        duration_str_dt = calculate_duration(start_time, end_time)
        assert "2 hours" in duration_str_dt
        assert "30 minutes" in duration_str_dt  # approx, depending on seconds

        # Test with ISO strings
        start_iso = (datetime.now(timezone.utc) - timedelta(days=1, hours=5)).isoformat()
        end_iso = datetime.now(timezone.utc).isoformat()
        duration_str_iso = calculate_duration(start_iso, end_iso)
        assert "1 day" in duration_str_iso
        assert "5 hours" in duration_str_iso

        # Test with end time before start time
        assert calculate_duration(end_time, start_time) == "End time is before start time"

        # Test with invalid inputs
        assert calculate_duration(None, end_time) == "Invalid start or end time"
        assert calculate_duration(start_time, "not a date") == "Invalid start or end time"

    def test_format_bytes(self):
        assert format_bytes(1024) == "1.0 KB"
        assert format_bytes(1500) == "1.5 KB"  # Example, actual might be 1.46 KB depending on precision
        assert format_bytes(1024 * 1024 * 2.5) == "2.5 MB"
        assert format_bytes(1024 * 1024 * 1024 * 3) == "3.0 GB"
        assert format_bytes(0) == "0 Bytes"
        assert format_bytes(500) == "500.0 Bytes"

        # Test precision
        assert format_bytes(1234567, precision=2) == "1.18 MB"  # 1234567 / (1024*1024) = 1.177...
        assert format_bytes(1234567, precision=1) == "1.2 MB"