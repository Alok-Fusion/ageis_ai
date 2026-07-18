from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import random
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
    """Fetch all active tankers, carriers, and H2 vessels with real-time coordinate drifts."""
    ships = db.query(Ship).all()
    # Apply minor coordinate drift along voyages to simulate real-time maritime transit
    for ship in ships:
        # Speed affects step size. Drift slightly towards destination directions.
        drift_factor = 0.003 if ship.status == "Transit" else 0.0
        # Determine drift direction based on destination name hashes to stay consistent
        dest_hash = sum(ord(c) for c in ship.destination)
        lat_dir = 1 if dest_hash % 2 == 0 else -1
        lng_dir = 1 if (dest_hash // 2) % 2 == 0 else -1
        
        ship.lat += (lat_dir * drift_factor * (ship.speed / 15.0)) + random.uniform(-0.001, 0.001)
        ship.lng += (lng_dir * drift_factor * (ship.speed / 15.0)) + random.uniform(-0.001, 0.001)
        
        # Bounding box constraints
        ship.lat = max(-75.0, min(80.0, ship.lat))
        ship.lng = max(-180.0, min(180.0, ship.lng))
    
    db.commit()
    return ships

@router.get("/refineries", response_model=List[RefinerySchema])
def get_refineries(db: Session = Depends(get_db)):
    """Fetch refineries state with real-time production fluctuations."""
    refineries = db.query(Refinery).all()
    for ref in refineries:
        # Production output fluctuates slightly based on operational margins (±0.4%)
        ref.current_output += random.uniform(-0.004, 0.004) * ref.capacity
        ref.current_output = max(0.9 * ref.capacity, min(ref.capacity, ref.current_output))
    db.commit()
    return refineries

@router.get("/reserves", response_model=List[ReserveSchema])
def get_reserves(db: Session = Depends(get_db)):
    """Fetch strategic petroleum and gas reserve statuses with micro stock changes."""
    reserves = db.query(Reserve).all()
    for res in reserves:
        # Micro consumption/fill increments (±0.05 million barrels/BCF)
        res.current_stock += random.uniform(-0.05, 0.05)
        res.current_stock = max(0.0, min(res.max_capacity, res.current_stock))
    db.commit()
    return reserves

@router.get("/grids", response_model=List[PowerGridSchema])
def get_grids(db: Session = Depends(get_db)):
    """Fetch regional electricity grid outputs with dynamic solar/wind volatility."""
    grids = db.query(PowerGrid).all()
    for grid in grids:
        if grid.grid_type in ["Solar", "Wind"]:
            # Renewables are highly volatile: fluctuate by ±3%
            grid.generation += random.uniform(-0.03, 0.03) * grid.capacity
        else:
            # Baseload grids (Coal, Nuclear) are stable: fluctuate by ±0.2%
            grid.generation += random.uniform(-0.002, 0.002) * grid.capacity
        
        # Generation cap limits
        grid.generation = max(0.1 * grid.capacity, min(grid.capacity, grid.generation))
    db.commit()
    return grids
