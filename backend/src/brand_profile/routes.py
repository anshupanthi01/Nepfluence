from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile
from fastapi.concurrency import run_in_threadpool
from PIL import UnidentifiedImageError
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.auth import CurrentUser
from src.config import settings
from src.users.model import UserRole
from src.brand_profile import crud
from src.brand_profile.image_utils import process_brand_logo, delete_brand_logo
from src.brand_profile.schemas import (
    BrandProfileCreate,
    BrandProfileUpdate,
    BrandProfilePublic,
)

router = APIRouter(prefix="/brand-profile", tags=["brand_profile"])


def _require_brand_user(current_user: CurrentUser) -> None:
    # Only BRAND users can create/update/delete.
    # Admin should NOT be allowed (per your requirement).
    if current_user.role != UserRole.BRAND:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only brand users can manage a brand profile",
        )


@router.get("/me", response_model=BrandProfilePublic)
async def get_my_brand_profile(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _require_brand_user(current_user)

    brand_profile = await crud.get_by_user_id(db, current_user.id)
    if not brand_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand profile not found",
        )
    return brand_profile


@router.post("/me", response_model=BrandProfilePublic, status_code=status.HTTP_201_CREATED)
async def create_my_brand_profile(
    payload: BrandProfileCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _require_brand_user(current_user)

    existing = await crud.get_by_user_id(db, current_user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand profile already exists for this user",
        )

    return await crud.create_for_user(db, current_user.id, payload)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_brand_profile(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _require_brand_user(current_user)

    brand_profile = await crud.get_by_user_id(db, current_user.id)
    if not brand_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand profile not found",
        )

    await crud.delete_for_user(db, brand_profile)
    return None


@router.patch("/me", response_model=BrandProfilePublic)
async def update_my_brand_profile(
    payload: BrandProfileUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _require_brand_user(current_user)

    brand_profile = await crud.get_by_user_id(db, current_user.id)
    if not brand_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand profile not found",
        )

    return await crud.update_for_user(db, brand_profile, payload)


@router.patch("/me/logo", response_model=BrandProfilePublic)
async def upload_brand_logo(
    file: UploadFile,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _require_brand_user(current_user)

    brand_profile = await crud.get_by_user_id(db, current_user.id)
    if not brand_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand profile not found",
        )

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE_BYTES//(1024*1024)}MB",
        )

    try:
        new_filename = await run_in_threadpool(process_brand_logo, content)
    except UnidentifiedImageError as err:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file. Please upload a valid image",
        ) from err

    old_filename = brand_profile.logo_file
    brand_profile.logo_file = new_filename

    await db.commit()

    if old_filename:
        delete_brand_logo(old_filename)

    await db.refresh(brand_profile)
    return brand_profile


@router.delete("/me/logo", response_model=BrandProfilePublic)
async def delete_my_brand_logo(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _require_brand_user(current_user)

    brand_profile = await crud.get_by_user_id(db, current_user.id)
    if not brand_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand profile not found",
        )

    old_filename = brand_profile.logo_file
    if old_filename is None:
        raise HTTPException(status_code=400, detail="No brand logo to delete")

    brand_profile.logo_file = None
    await db.commit()

    delete_brand_logo(old_filename)

    await db.refresh(brand_profile)
    return brand_profile
