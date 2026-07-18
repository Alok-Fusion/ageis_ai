# AEGIS AI
> **Autonomous Energy Geopolitical Intelligence & Supply-chain Platform**
> *"An AI Operating System for National Energy Security"*

AEGIS AI is a premium intelligence dashboard designed for energy ministries and national security cabinets. It models the cascading effects of global geopolitical events (such as the blockade of the Strait of Hormuz, offshore storms, and refinery drone strikes) across multiple energy supply chains in under 30 seconds.

---

## 🚀 Key Modules
1. **Global Event Intelligence:** Ingests wire reports and detects supply chain threat incidents.
2. **News Verification Agent:** Cross-references wire reports with radar telemetry to check veracity.
3. **Geopolitical Risk Engine:** Calculates unified vulnerability indexes for energy corridors.
4. **Supply Chain Digital Twin:** Models dependencies across **all energy types**:
   * *Crude & Gas:* Active tankers, pipeline flow rates, refinery configurations, and strategic reserves (SPR).
   * *Coal:* Newcastle max dry-bulk cargo vessels, mining production rates, and port arrivals.
   * *Hydrogen:* Liquid H2 carriers, storage tanks, and liquefaction networks.
   * *Power Grids:* Multi-source grids (solar, wind, nuclear buffers) showing dynamic load stresses.
5. **Knowledge Graph Service:** Models relationships between countries, pipelines, tankers, and chokepoints.
6. **Multi-Agent Simulation Pipeline:** An orchestrator mimicking 15 specialized agents.
7. **Explainable AI Recommendations:** Directives suggesting reserve drawdowns, detour routings, and supplier diversions.

---

## 🛠️ Technology Stack
* **Backend:** FastAPI, SQLAlchemy (SQLite/Graph-relational), NetworkX (Knowledge Graph), Uvicorn.
* **Frontend:** React, Material UI (MUI Dark), Leaflet (Maps), Plotly.js (Charts), React Flow (Agent graph).
* **Testing:** Pytest.

---

## ⚡ Setup & Run Instructions

### 1. Run the Backend FastAPI Server
First, activate the Python virtual environment and run the FastAPI server:

```bash
# Activate Virtual Env (Windows Powershell)
.\venv\Scripts\activate

# Configure PYTHONPATH and run FastAPI startup
$env:PYTHONPATH="."
python backend/main.py
```
The backend server will automatically check database tables, seed multi-energy assets (tankers, power plants, refineries, reserves) on first load, and start listening on `http://localhost:8000`.

### 2. Run the Frontend React Server
In a new terminal window:

```bash
# Navigate to frontend folder
cd frontend

# Install Node modules (if not already installed)
npm install --legacy-peer-deps

# Start Vite React server
npm run dev
```
The client app will open at `http://localhost:5173`.

### 3. Run Automated Tests
To verify the math models and Knowledge Graph traversal:
```bash
$env:PYTHONPATH="."
.\venv\Scripts\pytest backend/tests/
```

---

## 🛡️ API Documentation
* `GET /api/v1/dashboard/metrics`: Summary stats, Brent crude prices, and active alerts.
* `GET /api/v1/dashboard/ships`: Active GPS coordinates for tankers and carriers.
* `GET /api/v1/graph/knowledge-graph`: Relational map node coordinates.
* `POST /api/v1/simulation/analyze-news`: Triggers the 15-agent simulation sequence.
* `POST /api/v1/chat/chat`: Contextual Energy Minister Co-pilot assistant.
* `GET /api/v1/report/download-report`: Exports a print-ready briefing document.
