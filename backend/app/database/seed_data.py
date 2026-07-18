from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
from backend.app.database.session import Base, engine, SessionLocal
from backend.app.models.models import Ship, Refinery, Reserve, PowerGrid, Supplier, Pipeline, PriceHistory, Event

def seed_db():
    # Recreate tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Seed Price History
        commodities = ["Brent Crude", "WTI Crude", "LNG (Asia/Europe)", "Coal (Newcastle)", "Hydrogen (Liquid H2)", "Electricity (EU/US Avg MWh)"]
        base_prices = {
            "Brent Crude": 78.50,
            "WTI Crude": 73.80,
            "LNG (Asia/Europe)": 12.40,
            "Coal (Newcastle)": 112.00,
            "Hydrogen (Liquid H2)": 3.40,
            "Electricity (EU/US Avg MWh)": 84.00
        }
        
        for name, price in base_prices.items():
            for i in range(10):
                date = datetime.utcnow() - timedelta(days=i)
                # Add some small variation
                var = (i * 0.15) if i % 2 == 0 else (-i * 0.12)
                db.add(PriceHistory(commodity=name, price=price + var, date=date))

        # 2. Seed Suppliers
        suppliers = [
            Supplier(name="Aramco Oil Sourcing", resource_type="Crude Oil", reliability_score=98.5, volume=15.0, cost_per_unit=77.0, delivery_days=20, country="Saudi Arabia"),
            Supplier(name="Qatargas LNG Co", resource_type="Gas", reliability_score=99.0, volume=8.0, cost_per_unit=11.5, delivery_days=15, country="Qatar"),
            Supplier(name="BHP Coal Mining", resource_type="Coal", reliability_score=94.0, volume=12.0, cost_per_unit=105.0, delivery_days=25, country="Australia"),
            Supplier(name="Equinor NorthSea Gas", resource_type="Gas", reliability_score=99.5, volume=18.0, cost_per_unit=12.1, delivery_days=4, country="Norway"),
            Supplier(name="Shell H2 Ventures", resource_type="Hydrogen", reliability_score=90.0, volume=2.5, cost_per_unit=3.20, delivery_days=2, country="Netherlands"),
            Supplier(name="Petrobras Offshore", resource_type="Crude Oil", reliability_score=93.0, volume=6.5, cost_per_unit=75.5, delivery_days=18, country="Brazil"),
            Supplier(name="US Permian Sourcing", resource_type="Crude Oil", reliability_score=96.0, volume=20.0, cost_per_unit=72.0, delivery_days=12, country="United States"),
        ]
        for sup in suppliers:
            db.add(sup)

        # 3. Seed Refineries
        refineries = [
            Refinery(name="Rotterdam Pernis Refinery", country="Netherlands", capacity=400000.0, raw_material="Crude Oil", production_output="Diesel, Gasoline, Jet Fuel", current_output=395000.0, storage_capacity=15.0),
            Refinery(name="Jamnagar Complex", country="India", capacity=1240000.0, raw_material="Crude Oil", production_output="Diesel, Gasoline, Petrochemicals", current_output=1220000.0, storage_capacity=45.0),
            Refinery(name="Chiba Refinery", country="Japan", capacity=220000.0, raw_material="Crude Oil", production_output="Gasoline, Kerosene, Heavy Fuel", current_output=215000.0, storage_capacity=8.5),
            Refinery(name="Port Arthur Refinery", country="United States", capacity=630000.0, raw_material="Crude Oil", production_output="Gasoline, Ultra-low-sulfur Diesel", current_output=620000.0, storage_capacity=22.0),
            Refinery(name="Ras Tanura Facility", country="Saudi Arabia", capacity=550000.0, raw_material="Crude Oil", production_output="LPG, Naphtha, Fuel Oil", current_output=548000.0, storage_capacity=30.0),
        ]
        for ref in refineries:
            db.add(ref)

        # 4. Seed Strategic Reserves
        reserves = [
            Reserve(name="US Strategic Petroleum Reserve", country="US", energy_type="Oil", current_stock=365.4, max_capacity=714.0, draw_rate_limit=4.4, fill_rate_limit=0.5),
            Reserve(name="Indian Strategic Storage (Padur)", country="India", energy_type="Oil", current_stock=39.5, max_capacity=39.5, draw_rate_limit=0.8, fill_rate_limit=0.1),
            Reserve(name="Japan National SPR (Shibushi)", country="Japan", energy_type="Oil", current_stock=94.2, max_capacity=110.0, draw_rate_limit=1.2, fill_rate_limit=0.2),
            Reserve(name="German Strategic Gas Storage", country="Germany", energy_type="Gas", current_stock=245.0, max_capacity=260.0, draw_rate_limit=3.5, fill_rate_limit=0.6),
        ]
        for res in reserves:
            db.add(res)

        # 5. Seed Power Grids
        grids = [
            PowerGrid(name="UK National Grid Wind-Farm East", region="North Sea", country="UK", grid_type="Wind", capacity=11000.0, generation=8400.0, status="Operational"),
            PowerGrid(name="Texas ERCOT Power Network", region="Texas", country="United States", grid_type="Solar", capacity=25000.0, generation=19200.0, status="Operational"),
            PowerGrid(name="Germany Energiewende Grid", region="Bavaria/North", country="Germany", grid_type="Solar", capacity=45000.0, generation=12500.0, status="Operational"),
            PowerGrid(name="India Western Grid Network", region="Gujarat/Maharashtra", country="India", grid_type="Coal", capacity=95000.0, generation=82000.0, status="Operational"),
            PowerGrid(name="French Nuclear Grid (EDF)", region="Loire Valley", country="France", grid_type="Nuclear", capacity=61300.0, generation=58500.0, status="Operational"),
        ]
        for grid in grids:
            db.add(grid)

        # 6. Seed Pipelines
        pipelines = [
            Pipeline(name="Nord Stream 1 (Gas)", pipeline_type="Gas", lat_start=59.8, lng_start=28.2, lat_end=54.1, lng_end=13.7, capacity=160.0, flow_rate=0.0, status="Shutdown", country="Germany"),
            Pipeline(name="East-West Pipeline (Saudi)", pipeline_type="Oil", lat_start=25.9, lng_start=49.6, lat_end=22.3, lng_end=39.1, capacity=5.0, flow_rate=3.8, status="Operational", country="Saudi Arabia"),
            Pipeline(name="Keystone Pipeline XL", pipeline_type="Oil", lat_start=52.8, lng_start=-111.4, lat_end=38.7, lng_end=-90.1, capacity=0.83, flow_rate=0.75, status="Operational", country="United States"),
        ]
        for pipe in pipelines:
            db.add(pipe)

        # 7. Seed Ships (Tankers, Carriers, H2 Vessels)
        # We need realistic coordinate placements on a Leaflet map
        # Persian Gulf / Strait of Hormuz coordinates are around Lat 25.5, Lng 55.5
        # Red Sea / Bab-el-Mandeb coordinates are around Lat 13.0, Lng 43.0
        # Indian Ocean is Lat 5.0, Lng 75.0
        # Atlantic is Lat 35.0, Lng -35.0
        # North Sea is Lat 56.0, Lng 3.0
        # Malacca Strait is Lat 1.5, Lng 103.0
        ships_list = [
            # Oil Tankers
            Ship(name="Neptune Glory", ship_type="Oil Tanker", lat=25.1, lng=54.8, status="Transit", speed=14.2, cargo_type="Brent Crude", cargo_volume=2000000.0, destination="Rotterdam (via Suez)", owner="Rotterdam Shipping Ltd", country="Netherlands"),
            Ship(name="Atlantic Venture", ship_type="Oil Tanker", lat=12.5, lng=43.5, status="Transit", speed=15.0, cargo_type="Saudi Arab Light", cargo_volume=1800000.0, destination="Rotterdam (via Suez)", owner="Atlantic Energy Corp", country="United States"),
            Ship(name="Pacific Titan", ship_type="Oil Tanker", lat=26.3, lng=52.5, status="Transit", speed=13.8, cargo_type="Basrah Medium", cargo_volume=2200000.0, destination="Jamnagar Port", owner="Reliance Sourcing Co", country="India"),
            Ship(name="Siri Explorer", ship_type="Oil Tanker", lat=-34.2, lng=18.4, status="Transit", speed=14.5, cargo_type="Angola Sweet", cargo_volume=1500000.0, destination="Chiba Refinery", owner="Siri Shipping Group", country="Japan"),
            Ship(name="Titan Explorer", ship_type="Oil Tanker", lat=34.8, lng=-72.4, status="Transit", speed=16.0, cargo_type="WTI Crude", cargo_volume=1000000.0, destination="Rotterdam Pernis", owner="ExxonMobil Transport", country="United States"),
            
            # LNG Carriers
            Ship(name="Qatargas Al Mayeda", ship_type="LNG Carrier", lat=25.8, lng=55.2, status="Transit", speed=18.5, cargo_type="LNG", cargo_volume=266000.0, destination="Tokyo Bay Gas Terminal", owner="Tokyo Gas Carrier Corp", country="Japan"),
            Ship(name="Mozah LNG", ship_type="LNG Carrier", lat=24.5, lng=57.3, status="Transit", speed=19.0, cargo_type="LNG", cargo_volume=262000.0, destination="Rotterdam Gate Terminal", owner="Qatargas Operating Co", country="Qatar"),
            Ship(name="Arctic Aurora", ship_type="LNG Carrier", lat=71.2, lng=24.5, status="Transit", speed=17.2, cargo_type="LNG", cargo_volume=155000.0, destination="Zeebrugge Terminal", owner="Dynagas Ltd", country="Norway"),
            Ship(name="Energy Horizon", ship_type="LNG Carrier", lat=1.2, lng=102.8, status="Transit", speed=18.0, cargo_type="LNG", cargo_volume=177000.0, destination="Sodegaura Terminal", owner="NYK Line", country="Japan"),

            # Coal Carriers
            Ship(name="Newcastle Max Bulk", ship_type="Coal Carrier", lat=-28.4, lng=153.2, status="Transit", speed=12.5, cargo_type="Thermal Coal", cargo_volume=180000.0, destination="Kwangyang Port", owner="K-Line Bulk", country="Australia"),
            Ship(name="Global Bulk Carrier", ship_type="Coal Carrier", lat=-15.4, lng=115.2, status="Transit", speed=13.0, cargo_type="Coking Coal", cargo_volume=160000.0, destination="Visakhapatnam Port", owner="Tata Steel Logistics", country="India"),
            Ship(name="Pacific Mariner", ship_type="Coal Carrier", lat=31.2, lng=128.5, status="Transit", speed=12.2, cargo_type="Thermal Coal", cargo_volume=120000.0, destination="Chiba Port", owner="Mitsui OSK", country="Japan"),

            # Hydrogen Carriers
            Ship(name="Suiso Frontier", ship_type="Hydrogen Vessel", lat=-3.4, lng=120.2, status="Transit", speed=13.5, cargo_type="Liquid Hydrogen", cargo_volume=1250.0, destination="Kobe H2 Terminal", owner="Kawasaki Heavy Ind", country="Japan"),
            Ship(name="H2 Vanguard", ship_type="Hydrogen Vessel", lat=54.2, lng=4.5, status="Transit", speed=14.0, cargo_type="Liquid Hydrogen", cargo_volume=2500.0, destination="Rotterdam Port", owner="Shell Shipping H2", country="Netherlands")
        ]
        
        # Route points (simple coordinates lists JSON strings)
        for s in ships_list:
            # Let's seed route coordinates that represent drawing path on map
            # E.g. simple start coordinates, midpoint, and destination
            pts = [
                {"lat": s.lat, "lng": s.lng},
                {"lat": s.lat + (10 if s.lat < 40 else -10), "lng": s.lng + (10 if s.lng < 100 else -10)}
            ]
            s.route_coordinates = json.dumps(pts)
            db.add(s)

        db.commit()
        print("AEGIS AI Database seeded successfully with multi-energy resources.")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
