from __future__ import annotations
from datetime import UTC,datetime
from sqlalchemy import DateTime,ForeignKey,Integer,String,Text,func,Enum,Boolean
from sqlalchemy.orm import mapped_column,Mapped,relationship
from typing import List,Optional,TYPE_CHECKING
import enum
from src.database import Base

from src.influencer_profile.enums import InfluencerNiche

class InfluencerProfile(Base):
    __tablename__="influencer_profile"
    id:Mapped[int]=mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    bio: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    niche: Mapped[InfluencerNiche] = mapped_column(
        Enum(InfluencerNiche),
        nullable=False,
        index=True,
    )