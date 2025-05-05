import os
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import List, Dict, Any, Optional
import json
from dotenv import load_dotenv

# Import the settings service
from app.services.settings_service import settings_service

load_dotenv()

class AlertService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        
        # Thresholds from environment variables (can serve as defaults or fallbacks)
        # self.power_spike_threshold = float(os.getenv("POWER_SPIKE_THRESHOLD", "2000")) # Replaced by settings service
        self.voltage_fluctuation_threshold = float(os.getenv("VOLTAGE_FLUCTUATION_THRESHOLD", "10"))
        self.temperature_threshold = float(os.getenv("TEMPERATURE_THRESHOLD", "60"))
    
    def check_power_spike(self, power: float, device_name: str) -> Optional[Dict[str, Any]]:
        """Check if power consumption exceeds the threshold from settings."""
        current_settings = settings_service.get_settings()
        alert_threshold = current_settings.get("alertThreshold")
        
        # If no threshold set, don't trigger alerts
        if alert_threshold is None:
            return None
            
        # Convert to float for safety
        alert_threshold = float(alert_threshold)
        
        if power > alert_threshold:
            # Determine severity based on how much the threshold is exceeded
            severity = "info"
            if power > alert_threshold * 1.5:
                severity = "critical"
            elif power > alert_threshold * 1.2:
                severity = "warning"
                
            return {
                'alert_type': 'power_threshold_exceeded',
                'severity': severity,
                'message': f"Power consumption for device {device_name} exceeded threshold: {power:.2f}W (threshold: {alert_threshold:.2f}W)",
                'power_value': power,
                'threshold_value': alert_threshold
            }
        return None
    
    def check_voltage_fluctuation(self, voltage: float, device_name: str) -> Optional[Dict[str, Any]]:
        """Check if voltage fluctuation exceeds threshold"""
        if abs(voltage - 220) > (220 * self.voltage_fluctuation_threshold / 100):
            return {
                'alert_type': 'voltage_fluctuation',
                'severity': 'warning',
                'message': f"Voltage fluctuation detected for device {device_name}: {voltage}V"
            }
        return None
    
    def check_temperature(self, temperature: float, device_name: str) -> Optional[Dict[str, Any]]:
        """Check if device temperature exceeds threshold"""
        if temperature > self.temperature_threshold:
            return {
                'alert_type': 'high_temperature',
                'severity': 'critical',
                'message': f"High temperature detected for device {device_name}: {temperature}°C (threshold: {self.temperature_threshold}°C)"
            }
        return None
    
    def check_device_health(self, health_metrics: Dict[str, Any], device_name: str) -> Optional[Dict[str, Any]]:
        """Check device health metrics"""
        if health_metrics['health_status'] == 'critical':
            return {
                'alert_type': 'device_health',
                'severity': 'critical',
                'message': f"Critical health status for device {device_name}: {health_metrics['health_status']}"
            }
        return None
    
    def send_email_alert(self, alert: Dict[str, Any], recipient: str) -> bool:
        """Send alert via email"""
        if not all([self.smtp_host, self.smtp_port, self.smtp_user, self.smtp_password]):
            return False
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self.smtp_user
            msg['To'] = recipient
            msg['Subject'] = f"Power Alert: {alert['alert_type']}"
            
            body = f"""
            Alert Type: {alert['alert_type']}
            Severity: {alert['severity']}
            Message: {alert['message']}
            Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            return True
        except Exception as e:
            print(f"Failed to send email alert: {str(e)}")
            return False
    
    def send_slack_alert(self, alert: Dict[str, Any]) -> bool:
        """Send alert via Slack webhook"""
        if not self.slack_webhook_url:
            return False
        
        try:
            payload = {
                "text": f"*{alert['alert_type'].upper()} Alert*\n"
                       f"Severity: {alert['severity']}\n"
                       f"Message: {alert['message']}\n"
                       f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            }
            
            response = requests.post(
                self.slack_webhook_url,
                data=json.dumps(payload),
                headers={'Content-Type': 'application/json'}
            )
            
            return response.status_code == 200
        except Exception as e:
            print(f"Failed to send Slack alert: {str(e)}")
            return False
    
    def process_alert(self, alert: Dict[str, Any], notification_channels: List[str]) -> bool:
        """Process and send alert through specified channels"""
        success = True
        
        if 'email' in notification_channels:
            success &= self.send_email_alert(alert, self.smtp_user)
        
        if 'slack' in notification_channels:
            success &= self.send_slack_alert(alert)
        
        return success
    
    def monitor_device(self, device_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Monitor device metrics and generate alerts
        
        Args:
            device_data: Dictionary containing device metrics
            
        Returns:
            List of generated alerts
        """
        alerts = []
        
        # Check power spike
        if 'power' in device_data:
            power_alert = self.check_power_spike(device_data['power'], device_data['name'])
            if power_alert:
                alerts.append(power_alert)
        
        # Check voltage fluctuation
        if 'voltage' in device_data:
            voltage_alert = self.check_voltage_fluctuation(device_data['voltage'], device_data['name'])
            if voltage_alert:
                alerts.append(voltage_alert)
        
        # Check temperature
        if 'temperature' in device_data:
            temp_alert = self.check_temperature(device_data['temperature'], device_data['name'])
            if temp_alert:
                alerts.append(temp_alert)
        
        # Check device health
        if 'health_metrics' in device_data:
            health_alert = self.check_device_health(device_data['health_metrics'], device_data['name'])
            if health_alert:
                alerts.append(health_alert)
        
        return alerts 