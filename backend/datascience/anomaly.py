import pandas as pd
from sklearn.ensemble import IsolationForest
import json

# Load the JSON data
df = pd.read_json('/mnt/data/scratch_4.json')
df['timestamp'] = pd.to_datetime(df['timestamp'])

# Step 1: Isolation Forest
iso_forest = IsolationForest(contamination=0.02, random_state=42)
iso_forest.fit(df[['power']])
df['anomaly'] = iso_forest.predict(df[['power']])
df['is_abnormal'] = df['anomaly'] == -1

# Step 2: Extract anomalies
anomalies = df[df['is_abnormal']].copy()
anomalies = anomalies.sort_values('timestamp')

# Step 3: Find anomaly windows
anomalies['time_diff'] = anomalies['timestamp'].diff().dt.total_seconds()
threshold_seconds = 120  # 2 minutes threshold
anomalies['new_window'] = (anomalies['time_diff'] > threshold_seconds).fillna(True)
anomalies['window_id'] = anomalies['new_window'].cumsum()

# Step 4: Summarize the anomaly windows
anomaly_windows = anomalies.groupby('window_id').agg(
    start_time=('timestamp', 'min'),
    end_time=('timestamp', 'max'),
    num_anomalies=('timestamp', 'count'),
    min_power=('power', 'min'),
    max_power=('power', 'max'),
    avg_power=('power', 'mean')
).reset_index()

# Step 5: Convert to JSON-ready format
anomaly_windows_json = anomaly_windows.to_dict(orient='records')

# Optional: Pretty JSON string (for printing)
json_response = json.dumps(anomaly_windows_json, indent=2, default=str)

# Print or Return
print(json_response)

# If you want just Python list of dicts:
# return anomaly_windows_json
