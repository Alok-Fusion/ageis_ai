from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.database.session import get_db
from backend.app.models.models import Ship, Refinery, Reserve, PowerGrid, PriceHistory, Event
from backend.app.schemas.schemas import ShipSchema, RefinerySchema, ReserveSchema, PowerGridSchema

router = APIRouter()

@router.get("/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Fetch global overview metrics for commodities, risks, and energy supplies."""
    # 1. Fetch current commodity prices
    prices = {}
    commodities = ["Brent Crude", "WTI Crude", "LNG (Asia/Europe)", "Coal (Newcastle)", "Hydrogen (Liquid H2)", "Electricity (EU/US Avg MWh)"]
    for comm in commodities:
        latest = db.query(PriceHistory).filter(PriceHistory.commodity == comm).order_type = PriceHistory.date.desc()
        # In sqlite we can just order by date desc and take the first
        latest_price = db.query(PriceHistory).filter(PriceHistory.commodity == comm).order_by(PriceHistory.date.desc()).first()
        if latest_price:
            # Simple change calculation
            prev = db.query(PriceHistory).filter(PriceHistory.commodity == comm).order_by(PriceHistory.date.desc()).offset(1).first()
            change = 0.0
            if prev:
                change = round(((latest_price.price - prev.price) / prev.price) * 100, 2)
            prices[comm] = {"price": latest_price.price, "change": change}
        else:
            prices[comm] = {"price": 0.0, "change": 0.0}

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
        "energy_risk_index": 52.4, # baseline score
        "confidence_level": 94.0
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
