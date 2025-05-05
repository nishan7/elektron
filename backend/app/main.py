from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.endpoints import devices, alerts, records, settings
from app.core.init_db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    init_db()
    yield
    print("Shutting down...")

app = FastAPI(
    title="Elektron API",
    description="API for Electricity Monitor",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(devices.router, prefix="/api/devices", tags=["devices"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])
app.include_router(records.router, prefix="/api/records", tags=["records"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Elektron API"}

# Optional: Add main execution block if needed for direct running
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 