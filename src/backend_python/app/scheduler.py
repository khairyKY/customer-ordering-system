"""Background scheduler — runs sweep_stale_pending() on a fixed interval."""

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.db import SessionLocal
from app.services.sweep_service import sweep_stale_pending
from app.settings import settings

log = logging.getLogger(__name__)
_scheduler: BackgroundScheduler | None = None


def _job() -> None:
    db = SessionLocal()
    try:
        result = sweep_stale_pending(db)
        if result["cancelled"] or result["confirmed"]:
            log.info(
                "sweep complete cancelled=%d confirmed=%d",
                len(result["cancelled"]),
                len(result["confirmed"]),
            )
    except Exception:
        log.exception("sweep job crashed")
    finally:
        db.close()


def start() -> None:
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.add_job(
        _job,
        trigger="interval",
        seconds=settings.SWEEP_INTERVAL_SECONDS,
        id="sweep_stale_pending",
        replace_existing=True,
    )
    _scheduler.start()
    log.info("scheduler started (interval=%ds)", settings.SWEEP_INTERVAL_SECONDS)


def stop() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        log.info("scheduler stopped")
