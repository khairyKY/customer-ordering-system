"""FastAPI application entry point.

Run with:
    uvicorn app.main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import scheduler
from app.db import Base, engine
from app.exceptions import register_handlers
from app.middleware import PromptInjectionGuard, install_pii_redaction
from app.routers import auth, cart, catalog, events, inventory, orders, payment, tickets
from app.settings import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
install_pii_redaction()
log = logging.getLogger("app")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    log.info("schema ready (db=%s)", settings.DATABASE_URL.split("://", 1)[0])
    scheduler.start()
    yield
    # Shutdown
    scheduler.stop()


app = FastAPI(
    title="COS — Member D API",
    description="Auth + Orders + Inventory (Python / FastAPI)",
    version="2.0.0",
    lifespan=lifespan,
)

# Global exception handlers — DomainError → JSON response
register_handlers(app)

# Semantic-perimeter defense — reject prompt-injection payloads (CSE323 §3).
app.add_middleware(PromptInjectionGuard)

# CORS — allow the Vite frontend + Member A/B's Node backend during dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_V1 = "/api/v1"
app.include_router(auth.router, prefix=API_V1)
app.include_router(orders.router, prefix=API_V1)
app.include_router(inventory.router, prefix=API_V1)
app.include_router(events.router, prefix=API_V1)
app.include_router(cart.router, prefix=API_V1)
app.include_router(catalog.router, prefix=API_V1)
app.include_router(payment.router, prefix=API_V1)
app.include_router(tickets.router, prefix=API_V1)


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok", "service": "member-d-api", "version": "2.0.0"}
