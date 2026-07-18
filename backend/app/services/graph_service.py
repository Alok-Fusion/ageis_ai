import networkx as nx
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from backend.app.models.models import Ship, Refinery, Reserve, PowerGrid, Supplier, Pipeline

class KnowledgeGraphService:
    def __init__(self):
        self.graph = nx.DiGraph()
        
    def build_graph_from_db(self, db: Session):
        """Builds/Rebuilds the networkx graph representing the energy supply chain."""
        self.graph.clear()
        
        # 1. Add Chokepoints (critical bottlenecks)
        chokepoints = [
            {"id": "c_hormuz", "name": "Strait of Hormuz", "type": "Chokepoint", "energy_types": ["Oil", "LNG"]},
            {"id": "c_suez", "name": "Suez Canal", "type": "Chokepoint", "energy_types": ["Oil", "LNG", "Coal"]},
            {"id": "c_malacca", "name": "Strait of Malacca", "type": "Chokepoint", "energy_types": ["Oil", "LNG", "Coal"]},
            {"id": "c_bab", "name": "Bab-el-Mandeb", "type": "Chokepoint", "energy_types": ["Oil", "LNG"]},
        ]
        for cp in chokepoints:
            self.graph.add_node(
                cp["id"], 
                label=cp["name"], 
                node_type="Chokepoint", 
                energy_types=cp["energy_types"]
            )
            
        # 2. Add Supplier nodes
        suppliers = db.query(Supplier).all()
        for sup in suppliers:
            node_id = f"sup_{sup.id}"
            self.graph.add_node(
                node_id, 
                label=sup.name, 
                node_type="Supplier", 
                resource_type=sup.resource_type,
                country=sup.country
            )
            
        # 3. Add Ship nodes
        ships = db.query(Ship).all()
        for ship in ships:
            node_id = f"ship_{ship.id}"
            self.graph.add_node(
                node_id,
                label=ship.name,
                node_type="Ship",
                ship_type=ship.ship_type,
                cargo_type=ship.cargo_type,
                cargo_volume=ship.cargo_volume,
                status=ship.status
            )
            
            # Connect ship to its flag/country
            country_id = f"country_{ship.country.lower().replace(' ', '_')}"
            self.graph.add_node(country_id, label=ship.country, node_type="Country")
            self.graph.add_edge(node_id, country_id, relation="OWNED_BY")
            
            # Connect ships that go through chokepoints
            if "Hormuz" in ship.destination or (ship.lat > 20 and ship.lat < 30 and ship.lng > 50 and ship.lng < 60):
                self.graph.add_edge(node_id, "c_hormuz", relation="SHIPS_THROUGH")
            elif "Suez" in ship.destination:
                self.graph.add_edge(node_id, "c_suez", relation="SHIPS_THROUGH")

        # 4. Add Refinery nodes
        refineries = db.query(Refinery).all()
        for ref in refineries:
            node_id = f"ref_{ref.id}"
            self.graph.add_node(
                node_id,
                label=ref.name,
                node_type="Refinery",
                country=ref.country,
                capacity=ref.capacity,
                current_output=ref.current_output
            )
            # Connect refinery to its country
            country_id = f"country_{ref.country.lower().replace(' ', '_')}"
            self.graph.add_node(country_id, label=ref.country, node_type="Country")
            self.graph.add_edge(node_id, country_id, relation="LOCATED_AT")
            
            # Refineries consume crude oil from suppliers
            for sup in suppliers:
                if sup.resource_type == "Crude Oil" and sup.country == ref.country:
                    self.graph.add_edge(f"sup_{sup.id}", node_id, relation="SUPPLIES")

        # 5. Add Strategic Reserves
        reserves = db.query(Reserve).all()
        for res in reserves:
            node_id = f"res_{res.id}"
            self.graph.add_node(
                node_id,
                label=res.name,
                node_type="Reserve",
                energy_type=res.energy_type,
                country=res.country,
                stock=res.current_stock
            )
            # Connect reserve to country
            country_id = f"country_{res.country.lower().replace(' ', '_')}"
            self.graph.add_node(country_id, label=res.country, node_type="Country")
            self.graph.add_edge(node_id, country_id, relation="RESERVE_OF")

        # 6. Add Power Grids
        grids = db.query(PowerGrid).all()
        for grid in grids:
            node_id = f"grid_{grid.id}"
            self.graph.add_node(
                node_id,
                label=grid.name,
                node_type="PowerGrid",
                grid_type=grid.grid_type,
                country=grid.country,
                capacity=grid.capacity
            )
            # Connect to country
            country_id = f"country_{grid.country.lower().replace(' ', '_')}"
            self.graph.add_node(country_id, label=grid.country, node_type="Country")
            self.graph.add_edge(node_id, country_id, relation="POWERS")

        # 7. Add Pipelines
        pipelines = db.query(Pipeline).all()
        for pipe in pipelines:
            node_id = f"pipe_{pipe.id}"
            self.graph.add_node(
                node_id,
                label=pipe.name,
                node_type="Pipeline",
                pipeline_type=pipe.pipeline_type,
                flow_rate=pipe.flow_rate,
                status=pipe.status
            )
            # Pipelines connect suppliers/production sites to refineries/countries
            country_id = f"country_{pipe.country.lower().replace(' ', '_')}"
            self.graph.add_node(country_id, label=pipe.country, node_type="Country")
            self.graph.add_edge(node_id, country_id, relation="LOCATED_AT")

    def get_vis_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """Formats the graph for frontend visualization libraries."""
        nodes = []
        for node_id, data in self.graph.nodes(data=True):
            node_data = {"id": node_id}
            node_data.update(data)
            nodes.append(node_data)
            
        edges = []
        for u, v, data in self.graph.edges(data=True):
            edges.append({
                "source": u,
                "target": v,
                "relation": data.get("relation", "CONNECTED_TO")
            })
            
        return {"nodes": nodes, "edges": edges}

    def trace_chokepoint_blockage(self, chokepoint_id: str) -> Dict[str, Any]:
        """Traces the cascading impact of a chokepoint blockage across the supply chain."""
        affected_ships = []
        affected_refineries = []
        affected_countries = []
        affected_suppliers = []
        
        if chokepoint_id not in self.graph:
            return {"error": "Chokepoint not found"}
            
        # Find all nodes connected to this chokepoint via "SHIPS_THROUGH"
        # We look for incoming edges of relation SHIPS_THROUGH
        for u, v, data in self.graph.in_edges(chokepoint_id, data=True):
            if data.get("relation") == "SHIPS_THROUGH":
                node_type = self.graph.nodes[u].get("node_type")
                if node_type == "Ship":
                    affected_ships.append({
                        "id": u,
                        "name": self.graph.nodes[u].get("label"),
                        "ship_type": self.graph.nodes[u].get("ship_type"),
                        "cargo_type": self.graph.nodes[u].get("cargo_type"),
                        "cargo_volume": self.graph.nodes[u].get("cargo_volume")
                    })
                    
                    # Trace where this ship's cargo supplies (e.g. destination countries)
                    # Let's find related countries or refineries
                    # Simple heuristic: look at ship owners or country nodes connected
                    for ship_node, target_node, r_data in self.graph.out_edges(u, data=True):
                        if r_data.get("relation") == "OWNED_BY":
                            country_name = self.graph.nodes[target_node].get("label")
                            if country_name not in affected_countries:
                                affected_countries.append(country_name)
                                
        # Refineries in importing countries that depend on these imports
        for ref_id, ref_data in self.graph.nodes(data=True):
            if ref_data.get("node_type") == "Refinery":
                if ref_data.get("country") in affected_countries:
                    affected_refineries.append({
                        "id": ref_id,
                        "name": ref_data.get("label"),
                        "country": ref_data.get("country"),
                        "capacity": ref_data.get("capacity")
                    })
                    
        return {
            "chokepoint": self.graph.nodes[chokepoint_id].get("label"),
            "affected_ships": affected_ships,
            "affected_refineries": affected_refineries,
            "affected_countries": affected_countries
        }

graph_service = KnowledgeGraphService()
