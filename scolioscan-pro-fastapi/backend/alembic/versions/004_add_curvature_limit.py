"""add monthly curvature measurement limit

Revision ID: 004
Revises: 003
Create Date: 2026-07-24
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("curvature_limit", sa.Integer(), nullable=False, server_default="10"),
    )
    op.add_column(
        "users",
        sa.Column("curvature_limit_reset_at", sa.DateTime(), nullable=True),
    )
    op.execute(
        sa.text(
            "UPDATE users SET curvature_limit_reset_at = "
            "UTC_TIMESTAMP() "
            "WHERE curvature_limit_reset_at IS NULL"
        )
    )
    op.alter_column("users", "curvature_limit_reset_at", nullable=False)
    op.alter_column("users", "curvature_limit", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "curvature_limit_reset_at")
    op.drop_column("users", "curvature_limit")
