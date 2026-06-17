"""add social accounts

Revision ID: 003
Revises: 002
Create Date: 2026-06-17

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.models.types import UUID


# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "social_accounts",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.Enum("google", "kakao", "naver", name="social_provider"), nullable=False),
        sa.Column("provider_user_id", sa.String(length=128), nullable=False),
        sa.Column("provider_email", sa.String(length=128), nullable=True),
        sa.Column("linked_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider", "provider_user_id", name="uq_social_accounts_provider_user"),
        sa.UniqueConstraint("user_id", "provider", name="uq_social_accounts_user_provider"),
    )
    op.create_index("ix_social_accounts_id", "social_accounts", ["id"], unique=False)
    op.create_index("ix_social_accounts_user_id", "social_accounts", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_social_accounts_user_id", table_name="social_accounts")
    op.drop_index("ix_social_accounts_id", table_name="social_accounts")
    op.drop_table("social_accounts")
