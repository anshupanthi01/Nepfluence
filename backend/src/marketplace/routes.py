from __future__ import annotations

import json
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends

from src.auth import CurrentUser
from src.marketplace.schemas import MarketplaceState

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
DATA_FILE = DATA_DIR / "marketplace_state.json"

INITIAL_STATE = {
    "campaigns": [],
    "applications": [],
    "collaborations": [],
    "messages": [],
    "wallets": [],
    "ledger": [],
    "discoveryDecisions": [],
}


def _read_state() -> MarketplaceState:
    if not DATA_FILE.exists():
        return MarketplaceState.model_validate(INITIAL_STATE)

    with DATA_FILE.open("r", encoding="utf-8") as file:
        return MarketplaceState.model_validate(json.load(file))


def _write_state(state: MarketplaceState) -> MarketplaceState:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(state.model_dump(mode="json"), file, indent=2)
    return state


@router.get("/state", response_model=MarketplaceState)
async def get_marketplace_state(current_user: CurrentUser):
    return _read_state()


@router.put("/state", response_model=MarketplaceState)
async def replace_marketplace_state(
    state: MarketplaceState,
    current_user: CurrentUser,
):
    return _write_state(state)


@router.post("/reset", response_model=MarketplaceState)
async def reset_marketplace_state(current_user: CurrentUser):
    return _write_state(MarketplaceState.model_validate(INITIAL_STATE))
