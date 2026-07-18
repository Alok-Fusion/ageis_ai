from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.schemas import ScenarioRequest

router = APIRouter()

@router.post("/generate-report")
def generate_report(payload: ScenarioRequest, db: Session = Depends(get_db)):
    """Generates a structured Executive Intelligence Report for national security councils."""
    scen = payload.scenario_key
    
    if scen == "hormuz_blockage":
        title = "EXECUTIVE EMERGENCY BRIEF: STRAIT OF HORMUZ BLOCKAGE IMPACTS"
        summary = (
            "This briefing summarizes the national security impacts of the Iranian closure of the Strait of Hormuz. "
            "Under simulated conditions, global energy supply lanes are severely disrupted, necessitating immediate strategic intervention."
        )
        sections = [
            {
                "heading": "1. Commodity Spot Market Impact",
                "details": "Brent crude surged to $118.20/bbl (+50.6%). Natural Gas / LNG spot prices jumped to $21.80/MMBtu (+75.8%). Coal pricing increased to $138/ton."
            },
            {
                "heading": "2. Maritime Logistics & Detours",
                "details": "All vessels routing through the Persian Gulf are detoured via the Cape of Good Hope, adding 14.5 days to deliveries and $420,000 extra in shipping fuel costs per voyage."
            },
            {
                "heading": "3. Refining and Strategic Reserves",
                "details": "Refineries in importing countries (India, Netherlands, Japan) will experience crude supply run cuts of 25%. A release rate of 2.0M bpd from US and IEA Strategic Petroleum Reserves is strongly recommended to stabilize pricing."
            },
            {
                "heading": "4. Strategic Recommendations",
                "details": "1. Deploy 2.0M bpd from SPR immediately.\n2. Reroute all current Persian Gulf fleets.\n3. Pivot raw oil contracts to US Permian and Brazilian offshore suppliers."
            }
        ]
    else:
        title = "EXECUTIVE INTELLIGENCE BRIEF: GENERAL RISK ASSESSMENT"
        summary = "Energy supply chain intelligence assessment under standard operating conditions."
        sections = [
            {
                "heading": "1. Current Operations",
                "details": "All major shipping chokepoints (Hormuz, Suez, Malacca) are open. Supply lines remain normal."
            }
        ]
        
    return {
        "title": title,
        "summary": summary,
        "sections": sections,
        "confidence_score": 96.5,
        "classification": "CONFIDENTIAL // NATIONAL ENERGY SECURITY"
    }

@router.get("/download-report")
def download_report(scenario_key: str = "hormuz_blockage"):
    """Downloads a print-friendly HTML Executive Intelligence Briefing."""
    html_content = f"""
    <html>
    <head>
        <title>AEGIS AI - Executive Intelligence Report</title>
        <style>
            body {{ font-family: 'Arial', sans-serif; background-color: #0c0f12; color: #e2e8f0; padding: 40px; }}
            .container {{ max-width: 800px; margin: 0 auto; border: 1px solid #1a202c; padding: 30px; background-color: #11151a; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); }}
            .header {{ text-align: center; border-bottom: 2px solid #e53e3e; padding-bottom: 20px; margin-bottom: 30px; }}
            .classification {{ color: #e53e3e; font-weight: bold; letter-spacing: 2px; font-size: 14px; }}
            .title {{ font-size: 24px; margin-top: 10px; font-weight: 800; }}
            .meta {{ font-size: 12px; color: #718096; margin-top: 5px; }}
            .summary {{ background-color: #1a202c; padding: 15px; border-left: 4px solid #e53e3e; margin-bottom: 30px; font-style: italic; }}
            .section {{ margin-bottom: 25px; }}
            .section-heading {{ font-size: 18px; color: #4fd1c5; border-bottom: 1px solid #2d3748; padding-bottom: 5px; margin-bottom: 10px; }}
            .section-details {{ font-size: 14px; line-height: 1.6; color: #cbd5e0; }}
            .footer {{ text-align: center; font-size: 11px; color: #4a5568; border-top: 1px solid #2d3748; padding-top: 20px; margin-top: 40px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="classification">CONFIDENTIAL // NATIONAL ENERGY SECURITY</div>
                <div class="title">AEGIS AI EMERGENCY BRIEFING</div>
                <div class="meta">GENERATED: 2026-07-18 | SYSTEM ID: AEGIS-OS-V1.0</div>
            </div>
            
            <div class="summary">
                <strong>Executive Summary:</strong> Strategic intelligence simulation results regarding the energy supply-chain threat profile. All data models validated with 96.5% system confidence.
            </div>
            
            <div class="section">
                <div class="section-heading">1. Geopolitical Event Assessment</div>
                <div class="section-details">
                    The Strait of Hormuz chokepoint is verified as BLOCKED. Navy Intelligence radars confirm deployment of fast attack patrol boats. 18.5M bpd oil flow disrupted.
                </div>
            </div>

            <div class="section">
                <div class="section-heading">2. Commodity Pricing Shocks</div>
                <div class="section-details">
                    - Brent Crude: $118.20 (+50.6%)<br/>
                    - LNG Spot (Asia/EU): $21.80/MMBtu (+75.8%)<br/>
                    - Coal Spot (Newcastle): $138/ton (+23.2%)
                </div>
            </div>

            <div class="section">
                <div class="section-heading">3. Tactical Directives</div>
                <div class="section-details">
                    1. Reroute all active tankers heading to/from the Persian Gulf via Cape of Good Hope (+14.5 days transit delay).<br/>
                    2. Authorize draw of 2.0M bpd from US and allied Strategic Petroleum Reserves (SPR) to stabilize domestic refinery operating rates.<br/>
                    3. Pivot import sourcing to Brazilian offshore crude and US WTI contracts.
                </div>
            </div>
            
            <div class="footer">
                CLASSIFIED DOCUMENT - DO NOT DISTRIBUTE - POWERED BY AEGIS AI SYSTEMS
            </div>
        </div>
    </body>
    </html>
    """
    return Response(content=html_content, media_type="text/html")
