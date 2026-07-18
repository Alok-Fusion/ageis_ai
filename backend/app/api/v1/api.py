from fastapi import APIRouter
from backend.app.api.v1.endpoints import dashboard, simulation, graph, chat, report

api_router = APIRouter()

api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(simulation.router, prefix="/simulation", tags=["simulation"])
api_router.include_router(graph.router, prefix="/graph", tags=["graph"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(report.router, prefix="/report", tags=["report"])
