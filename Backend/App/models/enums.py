import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    brand = "brand"
    influencer = "influencer"

class SocialPlatform(str, enum.Enum):
    instagram = "instagram"
    youtube = "youtube"
    tiktok = "tiktok"

class CampaignStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    completed = "completed"
    cancelled = "cancelled"

class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    withdrawn = "withdrawn"