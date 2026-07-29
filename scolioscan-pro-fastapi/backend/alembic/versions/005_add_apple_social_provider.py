"""add apple social provider credentials

Revision ID: 005
Revises: 004
Create Date: 2026-07-29

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _get_provider_column_type(connection) -> str:
    column_type = connection.execute(
        sa.text(
            "SELECT COLUMN_TYPE "
            "FROM INFORMATION_SCHEMA.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() "
            "AND TABLE_NAME = 'social_accounts' "
            "AND COLUMN_NAME = 'provider'"
        )
    ).scalar_one_or_none()

    if not isinstance(column_type, str):
        raise RuntimeError("social_accounts.provider column was not found")

    return column_type.lower()


def _get_social_account_columns(connection) -> set[str]:
    # 실제 MySQL 스키마를 기준으로 이미 적용된 DDL은 건너뛰어 재실행을 안전하게 만든다.
    return {
        column["name"]
        for column in sa.inspect(connection).get_columns("social_accounts")
    }


def upgrade() -> None:
    connection = op.get_bind()
    provider_column_type = _get_provider_column_type(connection)
    existing_columns = _get_social_account_columns(connection)

    if "'apple'" not in provider_column_type:
        op.execute(
            "ALTER TABLE social_accounts "
            "MODIFY COLUMN provider ENUM('google', 'kakao', 'naver', 'apple') NOT NULL"
        )

    if "apple_refresh_token" not in existing_columns:
        op.add_column(
            "social_accounts",
            sa.Column("apple_refresh_token", sa.Text(), nullable=True),
        )

    if "apple_token_updated_at" not in existing_columns:
        op.add_column(
            "social_accounts",
            sa.Column("apple_token_updated_at", sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    connection = op.get_bind()
    provider_column_type = _get_provider_column_type(connection)
    existing_columns = _get_social_account_columns(connection)

    if "'apple'" in provider_column_type:
        # enum 축소 전에 Apple 연결 행을 제거해야 MySQL 변환 오류가 발생하지 않는다.
        op.execute("DELETE FROM social_accounts WHERE provider = 'apple'")
        op.execute(
            "ALTER TABLE social_accounts "
            "MODIFY COLUMN provider ENUM('google', 'kakao', 'naver') NOT NULL"
        )

    if "apple_token_updated_at" in existing_columns:
        op.drop_column("social_accounts", "apple_token_updated_at")

    if "apple_refresh_token" in existing_columns:
        op.drop_column("social_accounts", "apple_refresh_token")
