from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database.session import Base

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    event_type = Column(String)  # Geopolitical, Weather, Strike, Cyber, Market, Supply
    severity = Column(String)    # Low, Medium, High, Critical
    verified = Column(Boolean, default=False)
    confidence = Column(Float, default=0.0)
    country = Column(String)
    location = Column(String)    # Chokepoint name, city, port, etc.
    created_at = Column(DateTime, default=datetime.utcnow)

class Ship(Base):
    __tablename__ = "ships"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    ship_type = Column(String)    # Oil Tanker, LNG Carrier, Coal Carrier, Hydrogen Vessel
    lat = Column(Float)
    lng = Column(Float)
    status = Column(String)       # Transit, Blocked, Anchored, Rerouting
    speed = Column(Float)         # knots
    cargo_type = Column(String)   # Brent Crude, Saudi Arab Light, LNG, Coal, Liquid H2
    cargo_volume = Column(Float)  # Barrels, cubic meters, tons
    destination = Column(String)
    route_coordinates = Column(Text)  # JSON string of coordinates list
    owner = Column(String)
    country = Column(String)      # Flag country
    updated_at = Column(DateTime, default=datetime.utcnow)

class Refinery(Base):
    __tablename__ = "refineries"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    country = Column(String)
    capacity = Column(Float)        # Barrels per day (bpd) or equivalent
    raw_material = Column(String)   # Crude Oil, Gas
    production_output = Column(String)  # Diesel, Gasoline, Jet Fuel
    maintenance = Column(Boolean, default=False)
    current_output = Column(Float)
    storage_capacity = Column(Float)
    updated_at = Column(DateTime, default=datetime.utcnow)

class Reserve(Base):
    __tablename__ = "reserves"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    country = Column(String)
    energy_type = Column(String)    # Oil, Gas, Coal, Hydrogen
    current_stock = Column(Float)   # Million barrels, BCF (billion cubic feet), etc.
    max_capacity = Column(Float)
    draw_rate_limit = Column(Float) # daily draw capacity
    fill_rate_limit = Column(Float)
    updated_at = Column(DateTime, default=datetime.utcnow)

class PowerGrid(Base):
    __tablename__ = "power_grids"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    region = Column(String)
    country = Column(String)
    grid_type = Column(String)     # Solar, Wind, Coal, Gas, Nuclear, Hydro
    capacity = Column(Float)       # MW
    generation = Column(Float)     # MW
    status = Column(String)        # Operational, Disrupted, Outage
    updated_at = Column(DateTime, default=datetime.utcnow)

class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    resource_type = Column(String)  # Crude Oil, Gas, Coal, Hydrogen
    reliability_score = Column(Float)  # 0.0 to 100.0
    volume = Column(Float)          # Contract volume (monthly)
    cost_per_unit = Column(Float)   # USD per barrel/MMBtu/ton
    delivery_days = Column(Integer)
    country = Column(String)

class Pipeline(Base):
    __tablename__ = "pipelines"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    pipeline_type = Column(String)  # Oil, Gas, Hydrogen
    lat_start = Column(Float)
    lng_start = Column(Float)
    lat_end = Column(Float)
    lng_end = Column(Float)
    capacity = Column(Float)        # Daily flow capacity
    flow_rate = Column(Float)       # Current flow rate
    status = Column(String)         # Operational, Damaged, Shutdown
    country = Column(String)

class PriceHistory(Base):
    __tablename__ = "price_history"
    
    id = Column(Integer, primary_key=True, index=True)
    commodity = Column(String)      # Brent, WTI, LNG, Coal, Hydrogen, Electricity
    price = Column(Float)
    date = Column(DateTime, default=datetime.utcnow)
