from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from backend.app.database.session import get_db
from backend.app.schemas.schemas import ScenarioRequest, CrisisRequest
from backend.app.services.simulation import simulation_engine
from backend.app.agents.orchestrator import agent_orchestrator
from backend.app.models.models import Event

router = APIRouter()

@router.post("/simulate-scenario")
def simulate_scenario(payload: ScenarioRequest, db: Session = Depends(get_db)):
    """Runs a specific supply shock scenario (e.g. hormuz_blockage, north_sea_storm)."""
    try:
        results = simulation_engine.run_scenario(payload.scenario_key, db)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-news")
def analyze_news(payload: CrisisRequest, db: Session = Depends(get_db)):
    """Parses a news headline, triggers the 15-agent orchestrator, seeds a new Risk Event, and returns workflow results."""
    try:
        # Run agent analysis
        results = agent_orchestrator.process_crisis_event(payload.headline, db)
        
        # Save event to DB
        severity = results.get("severity", "High")
        event = Event(
            title=payload.headline,
            content=results.get("summary", "An intelligence analysis was completed."),
            event_type="Geopolitical Disruption" if "Hormuz" in payload.headline or "Saudi" in payload.headline else "Supply Disruption",
            severity=severity,
            verified=True,
            confidence=results.get("confidence_score", 90.0),
            country="Iran" if "Hormuz" in payload.headline else "Global",
            location="Strait of Hormuz" if "Hormuz" in payload.headline else "Global Bottleneck"
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
