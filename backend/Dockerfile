FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY .  .
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

# Default command (can be overridden)
CMD ["python", "main.py"]