from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.services.graph_service import graph_service

router = APIRouter()

@router.get("/knowledge-graph")
def get_knowledge_graph(db: Session = Depends(get_db)):
    """Fetch structured nodes and edges representation of the global supply chain."""
    graph_service.build_graph_from_db(db)
    return graph_service.get_vis_data()
