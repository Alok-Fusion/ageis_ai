import uvicorn
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.v1.api import api_router
from backend.app.database.session import Base, engine, SessionLocal
from backend.app.database.seed_data import seed_db
from backend.app.models.models import Ship
from backend.app.services.scheduler import run_periodic_feed_ingestion

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_event():
    """Verify database existence, create tables, seed assets, and start periodic news scheduler."""
    Base.metadata.create_all(bind=engine)
    
    # Check if we need to seed the database
    db = SessionLocal()
    try:
        ships_count = db.query(Ship).count()
        if ships_count == 0:
            print("No existing ships detected. Running initial data seed...")
            seed_db()
        else:
            print("Database already contains active data. Startup complete.")
    except Exception as e:
        print(f"Error checking database state: {e}")
        seed_db()
    finally:
        db.close()
        
    # Start background loop task for periodic RSS feed updates
    asyncio.create_task(run_periodic_feed_ingestion())

@app.get("/")
def read_root():
    return {"message": "AEGIS AI Operating System Core is running."}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
