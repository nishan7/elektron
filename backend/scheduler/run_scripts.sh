#!/bin/bash

# Run the first script in the background
python -m scheduler.sch &
# Run the second script in the foreground
python data_services/kafka_producer.py