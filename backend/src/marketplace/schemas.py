from typing import Literal

from pydantic import BaseModel, Field


CampaignStatus = Literal["DRAFT", "OPEN", "PUBLISHED", "PAUSED", "CLOSED", "COMPLETED"]
ApplicationStatus = Literal["PENDING", "ACCEPTED", "REJECTED"]
EscrowStatus = Literal["NOT_REQUIRED", "PENDING", "HELD", "RELEASED"]
CollaborationState = Literal["ESCROW_PENDING", "IN_PROGRESS", "SUBMITTED", "APPROVED"]
Country = Literal["NP", "IN"]
Sender = Literal["brand", "creator"]
WalletRole = Literal["brand", "creator"]
LedgerType = Literal["ESCROW_DEPOSIT", "PAYOUT_RELEASE"]


class DeliverableChecklist(BaseModel):
    briefMatched: bool = True
    usageRights: bool = True
    noCopyrightMusic: bool = True


class DeliverableSubmission(BaseModel):
    videoUrl: str
    postUrl: str = ""
    caption: str = ""
    notes: str = ""
    aspectRatio: str = "9:16"
    duration: str = "30s"
    submittedAt: str
    checklist: DeliverableChecklist = Field(default_factory=DeliverableChecklist)


class MarketplaceCampaign(BaseModel):
    id: int
    brandUserId: str | None = None
    brand: str
    title: str
    niche: str
    budget: int
    country: Country
    platform: str
    status: CampaignStatus
    applications: int = 0
    accepted: int = 0
    reach: int = 0
    deadline: str
    brief: str


class MarketplaceApplication(BaseModel):
    id: int
    creatorUserId: str | None = None
    creator: str
    handle: str
    country: Country
    niche: str
    followers: str
    match: int = 90
    status: ApplicationStatus = "PENDING"
    campaignId: int


class MarketplaceCollaboration(BaseModel):
    id: int
    brandUserId: str | None = None
    creatorUserId: str | None = None
    campaign: str
    campaignId: int
    brand: str
    creator: str
    state: CollaborationState
    escrow: EscrowStatus
    deliverable: str
    payout: int
    submission: DeliverableSubmission | None = None
    hiddenForBrandAt: str | None = None
    hiddenForCreatorAt: str | None = None


class MarketplaceMessage(BaseModel):
    id: int
    roomId: int
    campaignId: int | None = None
    brandUserId: str | None = None
    creatorUserId: str | None = None
    sender: Sender
    senderName: str
    body: str
    createdAt: str
    deletedForBrandAt: str | None = None
    deletedForCreatorAt: str | None = None


class MarketplaceWallet(BaseModel):
    userId: str
    role: WalletRole
    balance: int = 0
    escrowHeld: int = 0
    released: int = 0


class MarketplaceLedgerEntry(BaseModel):
    id: int
    collaborationId: int
    fromUserId: str | None = None
    toUserId: str | None = None
    type: LedgerType
    amount: int
    createdAt: str


class CreatorDiscoveryDecision(BaseModel):
    handle: str
    creator: str
    brandUserId: str | None = None
    status: Literal["SELECTED", "REJECTED"]
    decidedAt: str


class MarketplaceState(BaseModel):
    campaigns: list[MarketplaceCampaign]
    applications: list[MarketplaceApplication]
    collaborations: list[MarketplaceCollaboration]
    messages: list[MarketplaceMessage]
    wallets: list[MarketplaceWallet] = Field(default_factory=list)
    ledger: list[MarketplaceLedgerEntry] = Field(default_factory=list)
    discoveryDecisions: list[CreatorDiscoveryDecision] = Field(default_factory=list)
