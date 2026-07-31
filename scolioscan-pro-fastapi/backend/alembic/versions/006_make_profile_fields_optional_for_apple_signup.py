"""make profile fields optional for apple direct signup

Revision ID: 006
Revises: 005
Create Date: 2026-07-31
"""

from alembic import op
import sqlalchemy as sa


revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Apple 직접 가입은 한국 휴대폰 본인인증 단계 없이 생성되므로 프로필 값을 선택 사항으로 둔다.
    op.alter_column("users", "phone", existing_type=sa.String(length=64), nullable=True)
    op.alter_column("users", "birthday", existing_type=sa.DateTime(), nullable=True)
    op.alter_column("users", "sex", existing_type=sa.Boolean(), nullable=True)
    op.alter_column("users", "address", existing_type=sa.String(length=128), nullable=True)
    op.add_column(
        "users",
        sa.Column("is_apple_direct_signup", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("users", "is_apple_direct_signup")
    op.alter_column("users", "address", existing_type=sa.String(length=128), nullable=False)
    op.alter_column("users", "sex", existing_type=sa.Boolean(), nullable=False)
    op.alter_column("users", "birthday", existing_type=sa.DateTime(), nullable=False)
    op.alter_column("users", "phone", existing_type=sa.String(length=64), nullable=False)
