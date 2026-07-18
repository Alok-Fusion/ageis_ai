import asyncio
import os
from sqlalchemy.orm import sessionmaker
from backend.app.database.session import SessionLocal
from backend.app.services.live_data import live_data_service
from backend.app.models.models import Event

async def run_periodic_feed_ingestion():
    """Asynchronous background worker that periodically polls RSS feeds and updates threat events."""
    # Allow customizing the interval via env var (for demo speedups)
    interval = int(os.getenv("TICK_INTERVAL_SEC", 1800))
    print(f"AEGIS AI Background Feed Ingestor started. Polling interval: {interval}s")
    
    # Run once immediately on startup so there is fresh data right away
    await ingest_new_headlines()

    while True:
        await asyncio.sleep(interval)
        try:
            await ingest_new_headlines()
        except Exception as e:
            print(f"Error in periodic news ingestion: {e}")

async def ingest_new_headlines():
    """Fetches live RSS feeds, parses threats dynamically, and seeds new Event alerts."""
    print("Background Ingestor: Scanning live Reuters and CNBC energy channels...")
    db = SessionLocal()
    try:
        articles = live_data_service.fetch_live_news()
        new_alerts_count = 0
        
        for art in articles:
            # Check if this headline is already stored to prevent duplicate alerts
            exists = db.query(Event).filter(Event.title == art["title"]).first()
            if exists:
                continue
                
            # Parse threats dynamically using our risk evaluation service
            threat = live_data_service.parse_headline_risk(art["title"])
            
            event = Event(
                title=art["title"],
                content=f"{art['summary']} [Source: {art['source']} | URL: {art['link']}]",
                event_type=threat["event_type"],
                severity=threat["severity"],
                verified=True,
                confidence=threat["confidence"],
                country=threat["country"],
                location=threat["location"]
            )
            db.add(event)
            new_alerts_count += 1
            
        if new_alerts_count > 0:
            db.commit()
            print(f"Background Ingestor: Success. Discovered and parsed {new_alerts_count} new threat events.")
        else:
            print("Background Ingestor: Scan complete. No new risk alerts found.")
            
    except Exception as e:
        print(f"Error during feed ingestion: {e}")
        db.rollback()
    finally:
        db.close()
