from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.auth import CurrentUser
from src.users.model_user import UserRole
from src.influencer_profile import crud
from src.influencer_profile.schemas import (
    InfluencerProfileCreate,
    InfluencerProfileUpdate,
    InfluencerProfilePublic,
)

router = APIRouter(prefix="/influencer-profile", tags=["influencer_profile"])


def _require_influencer_user(current_user: CurrentUser) -> None:
    # Only INFLUENCER users can create/update/delete.
    # Admin should NOT be allowed (same pattern as brand).
    if current_user.role != UserRole.INFLUENCER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only influencer users can manage an influencer profile",
        )


@router.get("/me", response_model=InfluencerProfilePublic)
async def get_my_influencer_profile(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _require_influencer_user(current_user)

    influencer_profile = await crud.get_by_user_id(db, current_user.id)
    if not influencer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Influencer profile not found",
        )
    return influencer_profile


@router.post(
    "/me",
    response_model=InfluencerProfilePublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_my_influencer_profile(
    payload: InfluencerProfileCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _require_influencer_user(current_user)

    existing = await crud.get_by_user_id(db, current_user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Influencer profile already exists for this user",
        )

    return await crud.create_for_user(db, current_user.id, payload)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_influencer_profile(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _require_influencer_user(current_user)

    influencer_profile = await crud.get_by_user_id(db, current_user.id)
    if not influencer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Influencer profile not found",
        )

    await crud.delete_for_user(db, influencer_profile)
    return None


@router.patch("/me", response_model=InfluencerProfilePublic)
async def update_my_influencer_profile(
    payload: InfluencerProfileUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _require_influencer_user(current_user)

    influencer_profile = await crud.get_by_user_id(db, current_user.id)
    if not influencer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Influencer profile not found",
        )

    return await crud.update_for_user(db, influencer_profile, payload)