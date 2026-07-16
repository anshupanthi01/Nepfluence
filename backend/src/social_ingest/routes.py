from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import CurrentUser
from src.database import get_db
from src.influencer_profile.enums import SocialPlatform
from src.social_ingest import service
from src.social_ingest.providers.base import ProviderError
from src.social_ingest.schemas import DiscoverRequest, DiscoveryCreatorPublic, SearchRequest
from src.social_ingest.service import DiscoveryUnavailable
from src.users.model import UserRole

router = APIRouter(prefix="/api/social-ingest", tags=["social-ingest"])


@router.post("/discover", response_model=DiscoveryCreatorPublic)
async def discover_creator(
    payload: DiscoverRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        row = await service.get_or_refresh_profile(db, payload.platform, payload.handle)
    except DiscoveryUnavailable as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except ProviderError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return DiscoveryCreatorPublic.from_row(row)


@router.get("/creator/{platform}/{handle}", response_model=DiscoveryCreatorPublic)
async def get_creator(
    platform: SocialPlatform,
    handle: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        row = await service.get_or_refresh_profile(db, platform, handle)
    except DiscoveryUnavailable as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except ProviderError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return DiscoveryCreatorPublic.from_row(row)


@router.post("/search", response_model=list[DiscoveryCreatorPublic])
async def search_creators(
    payload: SearchRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    # Brand-only: this is what Discover Creators calls, and each miss can be a billed TikHub
    # request - don't leave it open to any authenticated role.
    if current_user.role != UserRole.BRAND:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brand access required")
    try:
        rows = await service.search(db, payload.platform, payload.query, payload.limit)
    except ProviderError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return [DiscoveryCreatorPublic.from_row(row) for row in rows]
