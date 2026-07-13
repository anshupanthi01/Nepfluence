from __future__ import annotations

from typing import Callable, Hashable, TypeVar

from pydantic import BaseModel

from src.marketplace.schemas import (
    MarketplaceApplication,
    MarketplaceCampaign,
    MarketplaceCollaboration,
    MarketplaceMessage,
    MarketplaceState,
)

T = TypeVar("T", bound=BaseModel)


def _campaign_owners(campaigns: list[MarketplaceCampaign]) -> dict[int, str | None]:
    return {campaign.id: campaign.brandUserId for campaign in campaigns}


def _collab_owners(
    collaborations: list[MarketplaceCollaboration],
    campaign_owners: dict[int, str | None],
) -> dict[int, tuple[str | None, str | None]]:
    return {
        collab.id: (collab.brandUserId or campaign_owners.get(collab.campaignId), collab.creatorUserId)
        for collab in collaborations
    }


def _application_owns(application: MarketplaceApplication, campaign_owners: dict[int, str | None], user_id: str) -> bool:
    return application.creatorUserId == user_id or campaign_owners.get(application.campaignId) == user_id


def _collaboration_owns(collab: MarketplaceCollaboration, campaign_owners: dict[int, str | None], user_id: str) -> bool:
    brand = collab.brandUserId or campaign_owners.get(collab.campaignId)
    return brand == user_id or collab.creatorUserId == user_id


def _message_owns(
    message: MarketplaceMessage,
    collab_owners: dict[int, tuple[str | None, str | None]],
    campaign_owners: dict[int, str | None],
    user_id: str,
) -> bool:
    collab_brand, collab_creator = collab_owners.get(message.roomId, (None, None))
    brand = message.brandUserId or collab_brand or campaign_owners.get(message.campaignId)
    creator = message.creatorUserId or collab_creator
    return brand == user_id or creator == user_id


def scope_read(state: MarketplaceState, user_id: str) -> MarketplaceState:
    campaign_owners = _campaign_owners(state.campaigns)
    collab_owners = _collab_owners(state.collaborations, campaign_owners)

    return MarketplaceState(
        campaigns=state.campaigns,
        applications=[
            application
            for application in state.applications
            if _application_owns(application, campaign_owners, user_id)
        ],
        collaborations=[
            collab for collab in state.collaborations if _collaboration_owns(collab, campaign_owners, user_id)
        ],
        messages=[
            message
            for message in state.messages
            if _message_owns(message, collab_owners, campaign_owners, user_id)
        ],
        wallets=[wallet for wallet in state.wallets if wallet.userId == user_id],
        ledger=[
            entry for entry in state.ledger if entry.fromUserId == user_id or entry.toUserId == user_id
        ],
        discoveryDecisions=[
            decision for decision in state.discoveryDecisions if decision.brandUserId == user_id
        ],
    )


def _merge_owned(
    existing_list: list[T],
    incoming_list: list[T],
    owns: Callable[[T], bool],
    id_of: Callable[[T], Hashable] = lambda record: record.id,
) -> list[T]:
    existing_by_id = {id_of(record): record for record in existing_list}
    # Ownership of *existing* ids is decided from the server's own record, never from what the
    # incoming payload claims — otherwise a client could relabel a foreign record to steal it.
    foreign_ids = {record_id for record_id, record in existing_by_id.items() if not owns(record)}

    own_incoming: dict[Hashable, T] = {}
    for record in incoming_list:
        record_id = id_of(record)
        if record_id in foreign_ids:
            continue
        if not owns(record):
            continue
        own_incoming[record_id] = record

    # An id the writer owned in `existing` but omitted from `incoming` is treated as a delete.
    return [existing_by_id[record_id] for record_id in foreign_ids] + list(own_incoming.values())


def merge_write(existing: MarketplaceState, incoming: MarketplaceState, user_id: str) -> MarketplaceState:
    campaigns = _merge_owned(
        existing.campaigns,
        incoming.campaigns,
        owns=lambda campaign: campaign.brandUserId == user_id,
    )
    campaign_owners = _campaign_owners(campaigns)

    applications = _merge_owned(
        existing.applications,
        incoming.applications,
        owns=lambda application: _application_owns(application, campaign_owners, user_id),
    )

    collaborations = _merge_owned(
        existing.collaborations,
        incoming.collaborations,
        owns=lambda collab: _collaboration_owns(collab, campaign_owners, user_id),
    )
    collab_owners = _collab_owners(collaborations, campaign_owners)

    messages = _merge_owned(
        existing.messages,
        incoming.messages,
        owns=lambda message: _message_owns(message, collab_owners, campaign_owners, user_id),
    )

    wallets = _merge_owned(
        existing.wallets,
        incoming.wallets,
        owns=lambda wallet: wallet.userId == user_id,
        id_of=lambda wallet: (wallet.userId, wallet.role),
    )

    ledger = _merge_owned(
        existing.ledger,
        incoming.ledger,
        owns=lambda entry: entry.fromUserId == user_id or entry.toUserId == user_id,
    )

    discovery_decisions = _merge_owned(
        existing.discoveryDecisions,
        incoming.discoveryDecisions,
        owns=lambda decision: decision.brandUserId == user_id,
        id_of=lambda decision: (decision.brandUserId, decision.handle),
    )

    # `campaign.applications` is a client-mutated counter written by a non-owning creator
    # (apply/withdraw). Recomputing it here from the merged applications list avoids granting
    # creators write authority over brand-owned campaign rows.
    counts: dict[int, int] = {}
    for application in applications:
        counts[application.campaignId] = counts.get(application.campaignId, 0) + 1
    campaigns = [
        campaign.model_copy(update={"applications": counts.get(campaign.id, 0)}) for campaign in campaigns
    ]

    return MarketplaceState(
        campaigns=campaigns,
        applications=applications,
        collaborations=collaborations,
        messages=messages,
        wallets=wallets,
        ledger=ledger,
        discoveryDecisions=discovery_decisions,
    )
