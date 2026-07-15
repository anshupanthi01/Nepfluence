import enum


class CampaignStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"
    COMPLETED = "completed"
    IN_REVIEW = "in_review"
    DISPUTED = "disputed"