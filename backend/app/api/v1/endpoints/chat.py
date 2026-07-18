from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from backend.app.database.session import get_db
from backend.app.schemas.schemas import ChatRequest

router = APIRouter()

@router.post("/chat")
def chat_assistant(payload: ChatRequest, db: Session = Depends(get_db)):
    """The interactive chat assistant acting like the Energy Minister AI."""
    msg = payload.message.lower()
    
    # Context-aware responses based on keyword parsing
    if "hormuz" in msg or "iran" in msg:
        response_text = (
            "### Strait of Hormuz Blockage Intelligence Assessment\n\n"
            "**Primary Assessment:** The closure of the Strait of Hormuz represents a critical supply shock. "
            "It blocks approximately 18.5 million barrels/day of oil (20% of global consumption) and 3.2 Bcf/day of LNG.\n\n"
            "**Key Impacts:**\n"
            "1. **Market Prices:** Brent crude spot prices have jumped from $78.50 to $118.20 (+50.6%). LNG Asian spot prices surged to $21.80/MMBtu (+75.8%).\n"
            "2. **Logistics:** Active tankers (e.g., *Neptune Glory*, *Mozah LNG*) are being rerouted around South Africa (Cape of Good Hope), adding **14.5 days** of delay and **$420,000** in additional fuel costs per transit.\n"
            "3. **Refineries:** Input volumes for Rotterdam and Indian Jamnagar refineries will drop by **25%** within 14 days as current stock depletes.\n\n"
            "**Strategic Recommendations:**\n"
            "* **SPR Drawdown:** Draw **2.0M bpd** from the US and IEA reserves. This will stabilize Brent crude to ~$105/bbl and cover the refinery input deficit.\n"
            "* **Sourcing Diversification:** Shift supply contracts away from Middle Eastern ports to Brazilian offshore (Petrobras) and US Permian Basin crude."
        )
        confidence = 96.5
        sources = ["Reuters", "AIS Shipping Radar", "IEA Oil Reserves Database"]
    elif "reserve" in msg or "spr" in msg:
        response_text = (
            "### Strategic Petroleum Reserve (SPR) Policy Brief\n\n"
            "**Current Reserves Status:**\n"
            "* **US SPR:** 365.4M bbls (Draw capacity: 4.4M bpd)\n"
            "* **Indian SPR (Padur):** 39.5M bbls (Draw capacity: 0.8M bpd)\n"
            "* **Japan SPR (Shibushi):** 94.2M bbls (Draw capacity: 1.2M bpd)\n\n"
            "**Decision Model:** In the event of a Hormuz closure, we recommend a coordinated draw of **2.0M bpd** globally. "
            "This will offset the refinery import deficits for 90+ days. However, this will decrease national reserve cover duration from 90 days to 72 days. "
            "Refill actions should only be scheduled once Brent crude falls back below $80/bbl."
        )
        confidence = 94.0
        sources = ["US Department of Energy", "Ministry of Petroleum (India)", "IEA Stat Sheet"]
    elif "grid" in msg or "electricity" in msg or "wind" in msg or "solar" in msg:
        response_text = (
            "### Global Grid Stability & Diversification Report\n\n"
            "**Analysis:** Incorporating renewable and nuclear buffer grids provides vital protection against fuel supply shocks.\n"
            "1. **Gas & Coal Grids:** Severely impacted by fuel commodity prices. Production costs for fossil-fuel networks are projected to rise by **45%** under the Hormuz blockage scenario.\n"
            "2. **Renewables (UK/Germany Wind & Solar):** Highly stable against geopolitical blockades, but vulnerable to local weather. A Category 4 North Sea storm can knock off **15,400 MW** of offshore wind generation, forcing backup gas turbines to activate.\n"
            "3. **Nuclear Grid (French EDF):** Currently running at 95% capacity, providing a highly reliable baseload buffer requiring zero fuel transit lanes through volatile marine canals."
        )
        confidence = 92.0
        sources = ["National Grid ESO", "EDF Operations", "European Power Exchange"]
    elif "coal" in msg or "australia" in msg:
        response_text = (
            "### Coal Market Disruption Assessment\n\n"
            "**Current Situation:** Coal prices (Newcastle spot) have spiked to $138/ton (+23.2%) in response to transport disruptions. "
            "In case of Australia coal port strikes, Newcastle coal prices are modeled to spike to **$158/ton (+41.1%)**.\n\n"
            "**Recommendations:**\n"
            "* Shift bulk sourcing to Indonesian and South African RB1 coal contracts.\n"
            "* Command power plants to maximize gas/nuclear draw to buffer coal stockpiles."
        )
        confidence = 88.5
        sources = ["Newcastle Port Authority", "BHP Sourcing Group"]
    else:
        response_text = (
            "### AEGIS AI operating system active.\n\n"
            "I can assist you with national energy security scenarios. Try asking:\n"
            "* *'What happens if Iran closes the Strait of Hormuz?'*\n"
            "* *'Should we draw from the Strategic Petroleum Reserves?'*\n"
            "* *'How does a North Sea storm affect UK wind power?'*\n"
            "* *'What is the current coal market risk?'*"
        )
        confidence = 90.0
        sources = ["AEGIS AI Knowledge Graph"]

    return {
        "reply": response_text,
        "confidence_score": confidence,
        "sources": sources,
        "timestamp": "2026-07-18T20:35:00Z"
    }
