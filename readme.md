# Elektron: An Electricity Monitor Application

Elektron is a full-stack application designed to monitor electricity consumption and device health, complete with alerts and AI-generated insights. This system addresses the growing need for efficient energy management and proactive maintenance in various settings. Elektron provides users with valuable insights into their energy usage, helps identify device errors, and delivers real-time alerts to optimize energy consumption and prevent equipment failures.

## Features

* **Real-Time Data Monitoring**: Track electricity consumption and device parameters as they happen.
* **Device Health Assessment**: Monitor the health status of connected electrical devices.
* **Alerting System**: Receive real-time notifications for abnormal energy consumption patterns or potential device malfunctions.
* **AI-Generated Insights**: Obtain advice and insights through artificial intelligence to optimize consumption and manage devices proactively.
* **Data Visualization**: A user-friendly interface to visualize energy consumption data and device health.

## System Architecture

Elektron utilizes a modern, distributed architecture:

* **Data Acquisition**: Electrical devices (like smart plugs) send data via MQTT.
* **Data Processing**: Apache Kafka serves as the central message broker, receiving data from MQTT and making it available to consumers.
* **Data Aggregation**: A consumer application processes raw data from Kafka, aggregating it into meaningful metrics (e.g., average power consumption over five-minute intervals).
* **Data Storage**: MongoDB (a NoSQL database) stores aggregated energy consumption data, device health metrics, and alert history.
* **Backend API**: A Python-based API using the FastAPI framework acts as an intermediary between the database and the frontend.
* **Frontend UI**: A React-based web interface for users to interact with the system.

## Technologies Used

* **Backend**: Python, FastAPI
* **Frontend**: React, JavaScript
* **Database**: MongoDB
* **Messaging**: MQTT, Apache Kafka
* **Containerization**: Docker, Docker Compose
* **Email Notifications**: Mailjet

## Prerequisites

* Docker and Docker Compose installed on your system.
* Git (for cloning the repository).

## Quick Start / How to Run

1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/nishan7/elektron.git](https://github.com/nishan7/elektron.git)
    cd elektron
    ```
    *(Note: The original README mentioned `yourusername`. This has been updated to reflect the actual repository information where possible.)*

2.  **Create a `.env` file** in the root directory with the following content (adjust values as necessary):
    ```env
    # Database (MongoDB - as per docker-compose and project report)
    MONGO_URI=mongodb://root:example@mongo:27017/elektron?authSource=admin

    # Backend
    BACKEND_PORT=8000
    KAFKA_BOOTSTRAP_SERVER=kafka:9092 # For communication within Docker network
    MAILJET_API_KEY=your_mailjet_api_key
    MAILJET_SECRET_KEY=your_mailjet_secret_key
    MAILJET_SENDER_EMAIL=your_sender_email@example.com

    # Frontend
    FRONTEND_PORT=3000
    REACT_APP_API_URL=http://localhost:8000
    REACT_APP_GEMINI_API_KEY=your_gemini_api_key # For AI Insights feature
    ```
    *Note: The original `.env` example in the README listed `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`. However, the project report and `docker-compose.yml` files indicate the use of MongoDB. The `.env` example has been updated accordingly. Redis was mentioned but not found in the primary docker-compose files, so it's omitted here but can be added if used.*

3.  **Start the application**:
    ```bash
    docker-compose up -d
    ```
    (If using the production setup: `docker-compose -f docker-compose.prod.yml up -d`)

4.  **Access the application**:
    * Frontend: `http://localhost:3000`
    * Backend API: `http://localhost:8000`
    * Grafana (if used): `http://localhost:3001`
    * Prometheus (if used): `http://localhost:9090`

5.  **Login credentials**
    * Username: `admin`
    * Password: `admin123`
