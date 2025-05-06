import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from datetime import datetime, timedelta
import os
from typing import List, Tuple, Dict, Any

class PowerAnalytics:
    def __init__(self, sensitivity: float = 0.95):
        self.sensitivity = sensitivity
        self.anomaly_detector = IsolationForest(
            contamination=1 - sensitivity,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.forecast_model = None
    
    def detect_anomalies(self, power_readings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detect anomalies in power consumption data using Isolation Forest
        
        Args:
            power_readings: List of power reading dictionaries with 'power' and 'timestamp' keys
            
        Returns:
            List of dictionaries with anomaly scores and labels
        """
        if not power_readings:
            return []
        
        # Convert to DataFrame
        df = pd.DataFrame(power_readings)
        
        # Prepare features
        features = df[['power']].values
        features_scaled = self.scaler.fit_transform(features)
        
        # Fit and predict
        self.anomaly_detector.fit(features_scaled)
        scores = self.anomaly_detector.score_samples(features_scaled)
        predictions = self.anomaly_detector.predict(features_scaled)
        
        # Convert to anomaly labels (1 for normal, -1 for anomaly)
        anomaly_labels = predictions == -1
        
        # Create results
        results = []
        for i, reading in enumerate(power_readings):
            results.append({
                'timestamp': reading['timestamp'],
                'power': reading['power'],
                'anomaly_score': float(scores[i]),
                'is_anomaly': bool(anomaly_labels[i])
            })
        
        return results
    
    def train_forecast_model(self, power_readings: List[Dict[str, Any]], 
                           sequence_length: int = 24) -> None:
        """
        Train LSTM model for power consumption forecasting
        
        Args:
            power_readings: List of power reading dictionaries
            sequence_length: Number of time steps to use for prediction
        """
        if not power_readings:
            return
        
        # Convert to DataFrame
        df = pd.DataFrame(power_readings)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Prepare sequences
        data = df['power'].values.reshape(-1, 1)
        data_scaled = self.scaler.fit_transform(data)
        
        X, y = [], []
        for i in range(len(data_scaled) - sequence_length):
            X.append(data_scaled[i:(i + sequence_length)])
            y.append(data_scaled[i + sequence_length])
        
        X = np.array(X)
        y = np.array(y)
        
        # Create and train model
        self.forecast_model = Sequential([
            LSTM(50, activation='relu', input_shape=(sequence_length, 1), return_sequences=True),
            Dropout(0.2),
            LSTM(50, activation='relu'),
            Dropout(0.2),
            Dense(1)
        ])
        
        self.forecast_model.compile(optimizer='adam', loss='mse')
        self.forecast_model.fit(X, y, epochs=50, batch_size=32, verbose=0)
    
    def forecast_power_consumption(self, power_readings: List[Dict[str, Any]], 
                                 horizon_days: int = 7) -> List[Dict[str, Any]]:
        """
        Forecast power consumption for the next n days
        
        Args:
            power_readings: List of power reading dictionaries
            horizon_days: Number of days to forecast
            
        Returns:
            List of dictionaries with forecasted power consumption
        """
        if not power_readings or not self.forecast_model:
            return []
        
        # Convert to DataFrame
        df = pd.DataFrame(power_readings)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Prepare last sequence
        data = df['power'].values.reshape(-1, 1)
        data_scaled = self.scaler.transform(data)
        last_sequence = data_scaled[-24:].reshape(1, 24, 1)
        
        # Generate forecasts
        forecasts = []
        current_sequence = last_sequence
        
        for i in range(horizon_days * 24):  # 24 readings per day
            # Predict next value
            next_pred = self.forecast_model.predict(current_sequence, verbose=0)
            
            # Inverse transform
            next_value = self.scaler.inverse_transform(next_pred)[0][0]
            
            # Update sequence
            current_sequence = np.roll(current_sequence, -1, axis=1)
            current_sequence[0, -1, 0] = next_pred[0][0]
            
            # Add to forecasts
            forecast_time = df['timestamp'].iloc[-1] + timedelta(hours=i+1)
            forecasts.append({
                'timestamp': forecast_time,
                'power': float(next_value)
            })
        
        return forecasts
    
    def analyze_power_trends(self, power_readings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze power consumption trends
        
        Args:
            power_readings: List of power reading dictionaries
            
        Returns:
            Dictionary with trend analysis results
        """
        if not power_readings:
            return {}
        
        # Convert to DataFrame
        df = pd.DataFrame(power_readings)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Calculate statistics
        daily_stats = df.groupby(df['timestamp'].dt.date).agg({
            'power': ['mean', 'min', 'max', 'std']
        }).reset_index()
        
        # Calculate peak hours
        hourly_stats = df.groupby(df['timestamp'].dt.hour)['power'].mean()
        peak_hours = hourly_stats.nlargest(3).index.tolist()
        
        # Calculate trend
        df['day'] = (df['timestamp'] - df['timestamp'].min()).dt.days
        trend = np.polyfit(df['day'], df['power'], 1)
        
        return {
            'daily_stats': daily_stats.to_dict('records'),
            'peak_hours': peak_hours,
            'trend_slope': float(trend[0]),
            'trend_intercept': float(trend[1])
        }
    
    def generate_recommendations(self, power_readings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate power-saving recommendations based on consumption patterns
        
        Args:
            power_readings: List of power reading dictionaries
            
        Returns:
            List of recommendation dictionaries
        """
        if not power_readings:
            return []
        
        # Convert to DataFrame
        df = pd.DataFrame(power_readings)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        recommendations = []
        
        # Analyze peak usage
        hourly_stats = df.groupby(df['timestamp'].dt.hour)['power'].mean()
        peak_hours = hourly_stats.nlargest(3).index.tolist()
        
        if peak_hours:
            recommendations.append({
                'type': 'peak_usage',
                'message': f"Highest power consumption occurs during hours {peak_hours}. Consider shifting non-essential usage to off-peak hours.",
                'potential_savings': "10-15%"
            })
        
        # Check for high variance
        daily_variance = df.groupby(df['timestamp'].dt.date)['power'].std()
        if daily_variance.mean() > daily_variance.median() * 1.5:
            recommendations.append({
                'type': 'usage_variance',
                'message': "High variance in daily power consumption detected. Consider implementing a more consistent usage pattern.",
                'potential_savings': "5-10%"
            })
        
        # Check for continuous high usage
        high_usage_threshold = df['power'].quantile(0.9)
        high_usage_periods = df[df['power'] > high_usage_threshold]
        if len(high_usage_periods) > len(df) * 0.2:  # More than 20% of time
            recommendations.append({
                'type': 'continuous_high_usage',
                'message': "Significant periods of high power consumption detected. Review device efficiency and usage patterns.",
                'potential_savings': "15-20%"
            })
        
        return recommendations 