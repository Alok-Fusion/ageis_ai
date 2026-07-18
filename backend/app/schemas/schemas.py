from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class CrisisRequest(BaseModel):
    headline: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

class ScenarioRequest(BaseModel):
    scenario_key: str

class ShipSchema(BaseModel):
    id: int
    name: str
    ship_type: str
    lat: float
    lng: float
    status: str
    speed: float
    cargo_type: str
    cargo_volume: float
    destination: str
    route_coordinates: str
    owner: str
    country: str
    updated_at: datetime
    
    class Config:
        from_attributes = True

class RefinerySchema(BaseModel):
    id: int
    name: str
    country: str
    capacity: float
    raw_material: str
    production_output: str
    maintenance: bool
    current_output: float
    storage_capacity: float
    
    class Config:
        from_attributes = True

class ReserveSchema(BaseModel):
    id: int
    name: str
    country: str
    energy_type: str
    current_stock: float
    max_capacity: float
    draw_rate_limit: float
    fill_rate_limit: float
    
    class Config:
        from_attributes = True

class PowerGridSchema(BaseModel):
    id: int
    name: str
    region: str
    country: str
    grid_type: str
    capacity: float
    generation: float
    status: str
    
    class Config:
        from_attributes = True
        
class PriceHistorySchema(BaseModel):
    id: int
    commodity: str
    price: float
    date: datetime
    
    class Config:
        from_attributes = True
