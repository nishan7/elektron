import os
import paho.mqtt.client as mqtt
import logging
from services.records import update_record # Assuming update_record saves the record
from app.services.alerts import AlertService # Import AlertService (adjust path if needed)
from models.models import Alert # 修正：使用正确的Alert模型
from core.sync_database import db # 修正：使用同步数据库
from constants import ALERT_COLLECTION_NAME # Import collection name
import json
from pydantic import ValidationError
from datetime import datetime, timezone # Import datetime
from bson import ObjectId # 添加 ObjectId 导入

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 从环境变量获取 MQTT Broker 配置，与 docker-compose.yml 中定义的一致
MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost") # 默认值用于本地测试
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", 1883))
MQTT_KEEPALIVE = 60

# --- 定义主题 ---
# 这是一个示例主题结构，您需要根据实际情况调整
# 例如，设备使用 'elektron/device/{device_id}/data' 来发布数据
DEVICE_DATA_TOPIC = "elektron/device/+/data" # '+' 是单层通配符

# Instantiate AlertService
alert_service = AlertService()

def on_connect(client, userdata, flags, rc):
    """MQTT 连接回调函数"""
    if rc == 0:
        logger.info(f"Successfully connected to MQTT Broker at {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}")
        # 连接成功后订阅主题
        client.subscribe(DEVICE_DATA_TOPIC)
        logger.info(f"Subscribed to topic: {DEVICE_DATA_TOPIC}")
    else:
        logger.error(f"Failed to connect to MQTT Broker, return code {rc}")

def on_disconnect(client, userdata, rc):
    """MQTT 断开连接回调函数"""
    logger.warning(f"Disconnected from MQTT Broker with result code {rc}")
    # 可以在这里添加重连逻辑 if rc != 0: client.reconnect()

def on_message(client, userdata, msg):
    """MQTT 消息接收回调函数"""
    topic = msg.topic
    payload = msg.payload.decode("utf-8")
    logger.info(f"Received message on topic '{topic}': {payload}")

    try:
        # Extract device_id from topic
        topic_parts = topic.split('/')
        if len(topic_parts) < 4 or topic_parts[0] != 'elektron' or topic_parts[1] != 'device' or topic_parts[3] != 'data':
            logger.warning(f"Ignoring message on unexpected topic format: {topic}")
            return
        device_id_str = topic_parts[2] # Assuming topic is 'elektron/device/{device_id}/data'

        data = json.loads(payload)
        logger.info(f"Parsed message data: {data}")

        # --- 数据处理逻辑 ---
        # Add device_id from topic if not in payload (adjust based on actual data)
        if "device_id" not in data:
            data["device_id"] = device_id_str

        # Ensure timestamp is present, default to now if missing
        if "timestamp" not in data:
             data["timestamp"] = datetime.now(timezone.utc).isoformat()

        # Check if power data is present for alert checking
        if "power" in data:
            # 1. Update/Save the regular power record
            try:
                update_record(data) # Assuming this function saves the record to the DB
                logger.info(f"Processed and stored record for device {data.get('device_id')}")
            except Exception as e:
                 logger.error(f"Failed to update record for device {data.get('device_id')}: {e}")
                 # Decide if you want to continue to alert check even if record saving failed

            # 2. Check for power threshold alert
            try:
                # Assuming device name might be needed, fetch it or use ID
                # For simplicity, using device_id as 'name' here. Adjust if needed.
                device_name = data.get("name", device_id_str)
                power_value = float(data["power"])
                
                logger.info(f"Checking power threshold for device {device_name}, power value: {power_value}W")
                
                # 检索当前设置的阈值，确认是否应该触发警报
                from app.services.settings_service import settings_service
                current_settings = settings_service.get_settings()
                alert_threshold = current_settings.get("alertThreshold")
                logger.info(f"Current alert threshold setting: {alert_threshold}W")

                power_alert_info = alert_service.check_power_spike(power_value, device_name)

                if power_alert_info:
                    logger.warning(f"Power alert triggered for device {device_name}: {power_alert_info['message']}")
                    
                    # 3. Create and save the alert to the database
                    try:
                        # 确保我们有正确的Alert模型
                        alert_data = {
                            "device_id": ObjectId(device_id_str),  # 确保这是一个ObjectId
                            "timestamp": datetime.now(timezone.utc),
                            "severity": power_alert_info.get("severity", "warning"),
                            "message": power_alert_info.get("message", "Power threshold exceeded."),
                            "metric": "power",
                            "value": power_value,
                            "threshold": float(alert_threshold) if alert_threshold else 0,
                            "resolved": False
                        }
                        
                        # 创建Alert实例
                        alert_doc = Alert(**alert_data)
                        
                        # 转换为字典用于数据库插入
                        alert_dict = alert_doc.model_dump(by_alias=True)
                        logger.info(f"Prepared alert for saving: {alert_dict}")
                        
                        # 插入到数据库
                        insert_result = db[ALERT_COLLECTION_NAME].insert_one(alert_dict)
                        logger.info(f"Saved alert to DB with ID: {insert_result.inserted_id}")
                    
                        # 可选：发送通知（例如，电子邮件/Slack）
                        try:
                            notification_result = alert_service.process_alert(power_alert_info, ["email", "slack"])
                            logger.info(f"Notification result: {notification_result}")
                        except Exception as notify_error:
                            logger.error(f"Failed to send notifications: {notify_error}")
                    except Exception as alert_error:
                        logger.exception(f"Failed to save alert to database: {alert_error}")
                else:
                    logger.info(f"No alert triggered, power value {power_value}W is below threshold")

            except ValueError:
                 logger.error(f"Invalid power value received for alert check: {data['power']}")
            except Exception as e:
                 logger.exception(f"Error during alert check/saving for device {device_id_str}: {e}")

        else:
             logger.warning(f"Received message missing 'power' field, cannot check alerts: {data}")

    except json.JSONDecodeError:
        logger.error(f"Failed to decode JSON payload: {payload}")
    except ValidationError as e:
         logger.error(f"Data validation failed for payload {payload}: {e}")
    except Exception as e:
        logger.exception(f"An unexpected error occurred processing message on topic {topic}: {e}")


def create_mqtt_client():
    """创建并配置 MQTT 客户端"""
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    # 设置遗嘱消息 (可选)
    # client.will_set("elektron/status", payload="backend_offline", qos=1, retain=True)

    # 添加认证 (如果您的 Broker 需要)
    # client.username_pw_set(username="your_username", password="your_password")

    try:
        client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, MQTT_KEEPALIVE)
    except Exception as e:
        logger.exception(f"Could not connect to MQTT Broker: {e}")
        # 根据需要处理连接失败的情况，例如退出应用或稍后重试

    return client

# 可以在这里添加一个启动函数，供 main.py 调用
def start_mqtt_loop():
    client = create_mqtt_client()
    # client.loop_forever() # 阻塞式循环，会阻塞主线程
    client.loop_start() # 非阻塞式循环，在后台线程中运行
    logger.info("MQTT client loop started in background thread.")
    return client

if __name__ == '__main__':
    # 用于单独测试此模块
    logger.info("Starting MQTT client for testing...")
    client = start_mqtt_loop()
    # 让主线程保持运行以进行测试
    import time
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Stopping MQTT client...")
        client.loop_stop()
        client.disconnect()
        logger.info("MQTT client stopped.") 