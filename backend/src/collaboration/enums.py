import enum


class CollaborationState(str, enum.Enum):
    ESCROW_PENDING = "escrow_pending"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    PAUSED = "paused"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"


class EscrowStatus(str, enum.Enum):
    PENDING = "pending"
    HELD = "held"
    RELEASED = "released"


class LedgerType(str, enum.Enum):
    ESCROW_DEPOSIT = "escrow_deposit"
    PAYOUT_RELEASE = "payout_release"
    REFUND = "refund"
    PARTIAL_REFUND = "partial_refund"
    ADJUSTMENT_DEBIT = "adjustment_debit"
    ADJUSTMENT_CREDIT = "adjustment_credit"
