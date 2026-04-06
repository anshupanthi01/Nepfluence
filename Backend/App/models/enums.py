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

class Deliverable(str,enum.Enum):
    reel='reel'
    post='post'
    story='story'
    yt_video='yt_video'
    shorts='shorts'

class SubmissionStatus(enum.Enum):
    under_review = "under_review"
    approved = "approved"
    revision_requested = "revision_requested"
    disputed = "disputed"