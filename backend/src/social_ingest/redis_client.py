from __future__ import annotations

import json
import logging
import time
from typing import Any

import redis.asyncio as redis

from src.config import settings

logger = logging.getLogger(__name__)

_client: "redis.Redis | None" = None

# Discovered by live testing (2026-07-16): with Redis unreachable, a single search request
# makes ~6 sequential Redis calls (cache check, breaker check, budget check, 2x success-
# clear, cache write). At a naive multi-second connect timeout each, those stack up
# sequentially and turned one search into a 13+ second hang - technically "fails open"
# (never crashes), but not tolerable latency-wise. Fix: a short in-memory cooldown that
# short-circuits every call for a few seconds after the first observed failure, instead of
# re-attempting (and re-timing-out) a connection on every single call.
_CONNECT_TIMEOUT_SECONDS = 0.3
_SOCKET_TIMEOUT_SECONDS = 0.3
_FAILURE_COOLDOWN_SECONDS = 5.0
_unavailable_until = 0.0


def _redis_recently_failed() -> bool:
    return time.monotonic() < _unavailable_until


def _mark_redis_failed() -> None:
    global _unavailable_until
    _unavailable_until = time.monotonic() + _FAILURE_COOLDOWN_SECONDS


def get_client() -> "redis.Redis":
    global _client
    if _client is None:
        _client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=_CONNECT_TIMEOUT_SECONDS,
            socket_timeout=_SOCKET_TIMEOUT_SECONDS,
        )
    return _client


# Every method below swallows connection/timeout errors and degrades to a no-op/None. Redis
# here is purely a cost/performance optimization (search-result cache, atomic budget +
# circuit-breaker counters) - a Redis outage must never break discovery ingestion, the same
# principle the plan already applies to TikHub outages (serve stale/DB data, don't 500).
# Each also checks _redis_recently_failed() first to avoid the multi-timeout pileup above.


async def get_json(key: str) -> Any | None:
    if _redis_recently_failed():
        return None
    try:
        raw = await get_client().get(key)
    except Exception as exc:
        logger.warning("redis get failed for %s: %s", key, exc)
        _mark_redis_failed()
        return None
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        return None


async def set_json(key: str, value: Any, ttl_seconds: int) -> None:
    if _redis_recently_failed():
        return
    try:
        await get_client().set(key, json.dumps(value, default=str), ex=ttl_seconds)
    except Exception as exc:
        logger.warning("redis set failed for %s: %s", key, exc)
        _mark_redis_failed()


async def get_value(key: str) -> str | None:
    if _redis_recently_failed():
        return None
    try:
        return await get_client().get(key)
    except Exception as exc:
        logger.warning("redis get failed for %s: %s", key, exc)
        _mark_redis_failed()
        return None


async def set_value(key: str, value: str, ttl_seconds: int | None = None) -> None:
    if _redis_recently_failed():
        return
    try:
        await get_client().set(key, value, ex=ttl_seconds)
    except Exception as exc:
        logger.warning("redis set failed for %s: %s", key, exc)
        _mark_redis_failed()


async def delete_key(key: str) -> None:
    if _redis_recently_failed():
        return
    try:
        await get_client().delete(key)
    except Exception as exc:
        logger.warning("redis delete failed for %s: %s", key, exc)
        _mark_redis_failed()


async def incr_with_ttl(key: str, ttl_seconds: int) -> int | None:
    """Atomically increments a counter, setting its TTL only on first creation.

    Returns None if Redis is unreachable - callers must treat None as "budget/failure count
    unknown" and fail OPEN (allow the call) rather than blocking the feature on an infra
    outage. This is a conscious cost-control tradeoff, not an oversight: a Redis outage
    should degrade cost *enforcement*, not availability.
    """
    if _redis_recently_failed():
        return None
    try:
        client = get_client()
        count = await client.incr(key)
        if count == 1:
            await client.expire(key, ttl_seconds)
        return count
    except Exception as exc:
        logger.warning("redis incr failed for %s: %s", key, exc)
        _mark_redis_failed()
        return None
