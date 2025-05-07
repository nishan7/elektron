import os
from mailjet_rest import Client
from fastapi import HTTPException, BackgroundTasks
from typing import Optional
# Assuming your Pydantic models are in models.models
# You might need to adjust the import path based on your project structure
from models.models import Alert, Device 

# It's good practice to initialize the client once if possible,
# or ensure keys are loaded correctly each time.
# For simplicity here, we'll initialize per call, but in a larger app,
# you might manage this differently (e.g., as part of app state or a dependency).

async def send_alert_email(
    alert: Alert,
    recipient_email: str,
    device_name: Optional[str] = "Unknown Device"
):
    api_key = os.environ.get('MAILJET_API_KEY')
    api_secret = os.environ.get('MAILJET_SECRET_KEY')
    sender_email = os.environ.get('MAILJET_SENDER_EMAIL')

    if not all([api_key, api_secret, sender_email]):
        print("Mailjet API key, secret, or sender email not configured in environment variables.")
        # Depending on policy, you might raise an error or just log and skip sending
        return False # Indicate failure or skip

    mailjet = Client(auth=(api_key, api_secret), version='v3.1')

    subject = f"{alert.type.capitalize() if alert.type else 'Alert'}: {alert.message} for {device_name}"
    
    text_body = f"""
    An alert has been triggered:

    Device: {device_name}
    Message: {alert.message}
    Type: {alert.type.capitalize() if alert.type else 'N/A'}
    Metric: {alert.metric}
    Timestamp: {alert.start_time.strftime('%Y-%m-%d %H:%M:%S %Z') if alert.start_time else 'N/A'}

    Please check the system for more details.
    """
    
    html_body = f"""
    <h3>Alert Notification</h3>
    <p>An alert has been triggered for your energy monitoring system.</p>
    <ul>
        <li><strong>Device:</strong> {device_name}</li>
        <li><strong>Message:</strong> {alert.message}</li>
        <li><strong>Type:</strong> {alert.type.capitalize() if alert.type else 'N/A'}</li>
        <li><strong>Metric:</strong> {alert.metric}</li>
        <li><strong>Timestamp:</strong> {alert.start_time.strftime('%Y-%m-%d %H:%M:%S %Z') if alert.start_time else 'N/A'}</li>
    </ul>
    <p>Please log in to the system to view more details and resolve the alert if necessary.</p>
    """

    data = {
        'Messages': [
            {
                "From": {
                    "Email": sender_email,
                    "Name": "Elektron Monitoring System"
                },
                "To": [
                    {
                        "Email": recipient_email,
                        # "Name": "Recipient Name" # Optional: if you have recipient name
                    }
                ],
                "Subject": subject,
                "TextPart": text_body,
                "HTMLPart": html_body
            }
        ]
    }

    try:
        result = mailjet.send.create(data=data)
        if result.status_code == 200:
            print(f"Alert email sent successfully to {recipient_email}. Message ID: {result.json().get('Messages', [{}])[0].get('To', [{}])[0].get('MessageID')}")
            return True
        else:
            print(f"Failed to send alert email to {recipient_email}. Status: {result.status_code}, Response: {result.json()}")
            return False
    except Exception as e:
        print(f"Exception during Mailjet send: {e}")
        return False

# Example of how to add this to background tasks in FastAPI endpoint
# async def some_api_endpoint(item: Item, background_tasks: BackgroundTasks):
#     # ... save item ...
#     if should_send_email:
#         background_tasks.add_task(send_alert_email, alert_details, recipient_email, device_name)
#     return {"message": "Item processed"} 