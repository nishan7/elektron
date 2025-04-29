import schedule
import time
from datetime import datetime

from data_services.data_aggregator import consume_messages


def run_consumer_job():
    print(f"[{datetime.utcnow().isoformat()}] Running consumer job...")
    consume_messages()

schedule.every(5).minutes.do(run_consumer_job)

print(f"[{datetime.utcnow().isoformat()}] Scheduler started. Running consumer job every 5 minutes.")

while True:
    schedule.run_pending()
    time.sleep(60)
    print(f"[{datetime.utcnow().isoformat()}] Waiting for next scheduled job...")