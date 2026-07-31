"""make profile fields optional for Apple direct signup

Revision ID: 006
Revises: 005
Create Date: 2026-07-31
"""

from typing import Sequence, Union

from alembic import op


revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Apple 로그인 단계에서는 휴대폰·생년월일·성별·주소를 수집하지 않는다.
    op.execute("ALTER TABLE users MODIFY COLUMN phone VARCHAR(64) NULL")
    op.execute("ALTER TABLE users MODIFY COLUMN birthday DATETIME NULL")
    op.execute("ALTER TABLE users MODIFY COLUMN sex TINYINT(1) NULL")
    op.execute("ALTER TABLE users MODIFY COLUMN address VARCHAR(128) NULL")


def downgrade() -> None:
    # NULL 계정이 남아 있으면 NOT NULL 복구가 실패하므로 먼저 호출자가 값을 보완해야 한다.
    op.execute("ALTER TABLE users MODIFY COLUMN phone VARCHAR(64) NOT NULL")
    op.execute("ALTER TABLE users MODIFY COLUMN birthday DATETIME NOT NULL")
    op.execute("ALTER TABLE users MODIFY COLUMN sex TINYINT(1) NOT NULL")
    op.execute("ALTER TABLE users MODIFY COLUMN address VARCHAR(128) NOT NULL")
