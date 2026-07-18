import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database.session import Base
from backend.app.services.simulation import simulation_engine
from backend.app.database.seed_data import seed_db

# Use in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(name="db_session")
def fixture_db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    
    # Seed data
    from backend.app.models.models import Ship, Refinery, Reserve, PowerGrid, Supplier, Pipeline
    
    # Replicate simple mock objects for fast testing
    db.add(Supplier(name="Aramco Test", resource_type="Crude Oil", reliability_score=99.0, volume=10.0, cost_per_unit=75.0, delivery_days=10, country="Saudi Arabia"))
    db.add(Refinery(name="Test Refinery", country="India", capacity=500000.0, raw_material="Crude Oil", production_output="Diesel", current_output=480000.0, storage_capacity=10.0))
    db.add(Reserve(name="Test SPR", country="India", energy_type="Oil", current_stock=30.0, max_capacity=40.0, draw_rate_limit=0.5, fill_rate_limit=0.1))
    db.add(PowerGrid(name="Test Grid", region="West", country="India", grid_type="Coal", capacity=10000.0, generation=9000.0, status="Operational"))
    db.add(Ship(name="Neptune Glory", ship_type="Oil Tanker", lat=25.1, lng=54.8, status="Transit", speed=14.0, cargo_type="Brent Crude", cargo_volume=2000000.0, destination="Rotterdam (via Suez)", owner="Rotterdam Shipping Ltd", country="Netherlands"))
    
    db.commit()
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_hormuz_blockage_simulation(db_session):
    """Test that the Strait of Hormuz blockage simulation runs successfully and yields correct structure."""
    results = simulation_engine.run_scenario("hormuz_blockage", db_session)
    
    assert results is not None
    assert results["scenario"] == "Strait of Hormuz Blockage"
    assert results["severity"] == "Critical"
    
    # Assert price spikes occurred
    prices = results["market_prices"]
    assert "Brent Crude" in prices
    assert prices["Brent Crude"]["after"] > prices["Brent Crude"]["before"]
    assert prices["Brent Crude"]["after"] == 118.20
    
    # Assert detoured ships are tracked
    assert len(results["rerouted_ships"]) > 0
    assert results["rerouted_ships"][0]["name"] == "Neptune Glory"
    assert "Cape of Good Hope" in results["rerouted_ships"][0]["current_status"]
    
    # Assert recommendations exist
    assert len(results["recommendations"]) > 0
    assert any("Strategic Petroleum Reserves" in rec["action"] for rec in results["recommendations"])
