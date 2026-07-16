from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from src.database import AsyncSessionLocal
from src.social_ingest import crud, service

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def refresh_claimed_creators_nightly() -> None:
    """Nightly refresh of claimed/onboarded creators only (plan §4) - unclaimed/scraped rows
    are refreshed on-demand only, never on a schedule, so recurring cost is bounded to the
    actual roster rather than the whole scraped universe. No-ops safely if nothing is claimed
    yet (Track 2's OAuth connect flow is what actually claims a creator).
    """
    async with AsyncSessionLocal() as db:
        claimed = await crud.list_claimed(db)
        logger.info("refresh_claimed_creators_nightly: refreshing %d claimed creators", len(claimed))
        for creator in claimed:
            try:
                await service.refresh_claimed_creator(db, creator)
            except Exception:
                logger.exception(
                    "refresh_claimed_creators_nightly: failed for %s/%s",
                    creator.platform.value,
                    creator.handle,
                )


def start_scheduler() -> None:
    if scheduler.running:
        return
    scheduler.add_job(
        refresh_claimed_creators_nightly,
        trigger=CronTrigger(hour=2, minute=0),
        id="refresh_claimed_creators_nightly",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
