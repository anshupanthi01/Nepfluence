"""add conversation and message soft delete fields

Revision ID: 20260711_0001
Revises:
Create Date: 2026-07-11
"""

from alembic import op
import sqlalchemy as sa


revision = "20260711_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("conversations", sa.Column("hidden_for_brand_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("conversations", sa.Column("hidden_for_creator_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("messages", sa.Column("deleted_for_sender_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("messages", sa.Column("deleted_for_recipient_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("messages", "deleted_for_recipient_at")
    op.drop_column("messages", "deleted_for_sender_at")
    op.drop_column("conversations", "hidden_for_creator_at")
    op.drop_column("conversations", "hidden_for_brand_at")
