from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.database.session import get_db
from backend.app.models.models import Ship, Refinery, Reserve, PowerGrid, PriceHistory, Event
from backend.app.schemas.schemas import ShipSchema, RefinerySchema, ReserveSchema, PowerGridSchema

from backend.app.services.live_data import live_data_service

router = APIRouter()

@router.get("/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Fetch global overview metrics for commodities, risks, and energy supplies."""
    # Check if there is an active crisis simulation
    # We query the DB for the latest active critical events
    active_crisis = db.query(Event).filter(
        Event.severity == "Critical",
        Event.verified == True
    ).order_by(Event.created_at.desc()).first()
    
    is_crisis_active = active_crisis is not None and "Hormuz" in active_crisis.title
    
    # 1. Fetch current commodity prices (Live Yahoo Finance if no crisis, else shock values)
    prices = {}
    if is_crisis_active:
        prices = {
            "Brent Crude": {"price": 118.20, "change": 50.6},
            "WTI Crude": {"price": 105.50, "change": 42.9},
            "LNG (Asia/Europe)": {"price": 21.80, "change": 75.8},
            "Coal (Newcastle)": {"price": 138.00, "change": 23.2},
            "Hydrogen (Liquid H2)": {"price": 4.60, "change": 35.3},
            "Electricity (EU/US Avg MWh)": {"price": 122.00, "change": 45.2}
        }
    else:
        # Fetch real Yahoo Finance prices dynamically!
        prices = live_data_service.fetch_live_prices()

    # 2. Counts of assets
    total_ships = db.query(Ship).count()
    total_refineries = db.query(Refinery).count()
    total_reserves = db.query(Reserve).count()
    total_grids = db.query(PowerGrid).count()
    
    # 3. Active alerts
    alerts = db.query(Event).order_by(Event.created_at.desc()).limit(5).all()
    alerts_data = []
    for alert in alerts:
        alerts_data.append({
            "id": alert.id,
            "title": alert.title,
            "content": alert.content,
            "severity": alert.severity,
            "created_at": alert.created_at.isoformat()
        })
        
    return {
        "prices": prices,
        "assets_counts": {
            "ships": total_ships,
            "refineries": total_refineries,
            "reserves": total_reserves,
            "grids": total_grids
        },
        "recent_alerts": alerts_data,
        "energy_risk_index": 93.5 if is_crisis_active else 52.4,
        "confidence_level": 96.5 if is_crisis_active else 94.0
    }

@router.get("/ships", response_model=List[ShipSchema])
def get_ships(db: Session = Depends(get_db)):
    """Fetch all active tankers, carriers, and H2 vessels."""
    return db.query(Ship).all()

@router.get("/refineries", response_model=List[RefinerySchema])
def get_refineries(db: Session = Depends(get_db)):
    """Fetch refineries state."""
    return db.query(Refinery).all()

@router.get("/reserves", response_model=List[ReserveSchema])
def get_reserves(db: Session = Depends(get_db)):
    """Fetch strategic petroleum and gas reserve statuses."""
    return db.query(Reserve).all()

@router.get("/grids", response_model=List[PowerGridSchema])
def get_grids(db: Session = Depends(get_db)):
    """Fetch regional electricity grid outputs and health."""
    return db.query(PowerGrid).all()
