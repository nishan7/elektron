from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from mqtt_client import start_mqtt_loop, logger as mqtt_logger

from api.device import DeviceAPI
from api.records import RecordsAPI
from core.database import db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await db.connect_to_database()
    print("Starting up...")
    mqtt_logger.info("Application starting up...")
    # Start MQTT client loop
    mqtt_client = start_mqtt_loop()
    yield
    # Shutdown logic
    await db.close_database_connection()
    print("Shutting down...")
    mqtt_logger.info("Application shutting down...")
    # Stop MQTT client loop
    if mqtt_client:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        mqtt_logger.info("MQTT client disconnected on shutdown.")


app = FastAPI(
    title="Bridge Works API",
    description="API documentation for managing jobs, gigs, and volunteers.",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI endpoint
    redoc_url="/redoc",  # ReDoc endpoint
    openapi_url="/openapi.json",  # OpenAPI schema endpoint
    lifespan=lifespan,  # Use async context manager for startup/shutdown
)

# Middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# from api.auth.oauth import router as oauth_router

# Include routers
device_api = DeviceAPI()
record_api = RecordsAPI()
# gig_api = GigJobAPI()
# volunteer_api = VolunteerJobAPI()
# application_api = ApplicationAPI()
# user_api = UserAPI()

# app.include_router(oauth_router)
app.include_router(device_api.router, prefix="/api/device", tags=["Device"])
app.include_router(record_api.router, prefix="/api/record", tags=["Record"])
# app.include_router(gig_api.router, prefix="/api/gig", tags=["Gigs"])
# app.include_router(volunteer_api.router, prefix="/api/volunteer", tags=["Volunteers"])
# app.include_router(application_api.router, prefix="/api/application", tags=["Application"])
# app.include_router(user_api.router, prefix="/api/user", tags=["User"])

@app.on_event("startup")
def startup_event():
    global mqtt_client
    # Start MQTT client loop
    mqtt_client = start_mqtt_loop()

@app.on_event("shutdown")
def shutdown_event():
    if mqtt_client:
        # Stop MQTT client loop
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        mqtt_logger.info("MQTT client disconnected on shutdown.")

if __name__ == "__main__":
    # Note: In production environments, Gunicorn + Uvicorn workers are typically used
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) # Add reload=True for automatic reloading during development
