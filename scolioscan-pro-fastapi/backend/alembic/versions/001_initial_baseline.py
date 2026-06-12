"""initial baseline

Revision ID: 001
Revises:
Create Date: 2026-06-12

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.models.types import UUID


# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 현재 모델 기준으로 새 DB를 바로 만들 수 있게 기본 테이블을 한 번에 생성한다.
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("user_pw", sa.String(length=512), nullable=False),
        sa.Column("name", sa.String(length=32), nullable=False),
        sa.Column("phone", sa.String(length=64), nullable=False),
        sa.Column("birthday", sa.DateTime(), nullable=False),
        sa.Column("sex", sa.Boolean(), nullable=False),
        sa.Column("address", sa.String(length=128), nullable=False),
        sa.Column("detail_address", sa.String(length=128), nullable=True),
        sa.Column("profile_image", sa.String(length=256), nullable=True),
        sa.Column("alarm_count", sa.Integer(), nullable=False),
        sa.Column("setting", sa.JSON(), nullable=False),
        sa.Column("is_admin", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_user_id", "users", ["user_id"], unique=True)

    op.create_table(
        "alarm_types",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_alarm_types_id", "alarm_types", ["id"], unique=False)
    op.create_index("ix_alarm_types_name", "alarm_types", ["name"], unique=True)

    op.create_table(
        "analysis_types",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_analysis_types_id", "analysis_types", ["id"], unique=False)
    op.create_index("ix_analysis_types_name", "analysis_types", ["name"], unique=True)

    op.create_table(
        "subscribe_types",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=16), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(length=256), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("removed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_subscribe_types_id", "subscribe_types", ["id"], unique=False)
    op.create_index("ix_subscribe_types_name", "subscribe_types", ["name"], unique=True)

    op.create_table(
        "subscribe_cards",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_uuid", UUID(as_uuid=True), nullable=False),
        sa.Column("billing_key", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("removed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_uuid"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_subscribe_cards_id", "subscribe_cards", ["id"], unique=False)
    op.create_index("ix_subscribe_cards_user_uuid", "subscribe_cards", ["user_uuid"], unique=False)

    op.create_table(
        "subscribes",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_uuid", UUID(as_uuid=True), nullable=False),
        sa.Column("subscribe_card", UUID(as_uuid=True), nullable=False),
        sa.Column("subscribe_type", sa.Integer(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("terminated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["subscribe_card"], ["subscribe_cards.id"]),
        sa.ForeignKeyConstraint(["subscribe_type"], ["subscribe_types.id"]),
        sa.ForeignKeyConstraint(["user_uuid"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_subscribes_id", "subscribes", ["id"], unique=False)
    op.create_index("ix_subscribes_user_uuid", "subscribes", ["user_uuid"], unique=False)

    op.create_table(
        "alarms",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_uuid", UUID(as_uuid=True), nullable=False),
        sa.Column("alarm_type", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=64), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["alarm_type"], ["alarm_types.id"]),
        sa.ForeignKeyConstraint(["user_uuid"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_alarms_id", "alarms", ["id"], unique=False)
    op.create_index("ix_alarms_user_uuid", "alarms", ["user_uuid"], unique=False)

    op.create_table(
        "curvature_measurements",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("measured_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("main_thoracic_cobb", sa.Float(), nullable=False),
        sa.Column("secondary_thoracic_cobb", sa.Float(), nullable=False),
        sa.Column("lumbar_cobb", sa.Float(), nullable=False),
        sa.Column("severity", sa.Enum("normal", "mild", "moderate", "severe", name="severity"), nullable=False),
        sa.Column(
            "back_type",
            sa.Enum("Normal", "Thoracic", "Double Thoracic", "Double major", "Triple curve", "Lumbar", "Unknown", name="backtype"),
            nullable=False,
        ),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("image_path", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_curvature_measurements_user_id", "curvature_measurements", ["user_id"], unique=False)

    op.create_table(
        "rotation_measurements",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("measured_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("upper_thoracic_atr", sa.Float(), nullable=False),
        sa.Column("lower_thoracic_atr", sa.Float(), nullable=False),
        sa.Column("thoracolumbar_atr", sa.Float(), nullable=False),
        sa.Column("upper_lumbar_atr", sa.Float(), nullable=False),
        sa.Column("lower_lumbar_atr", sa.Float(), nullable=False),
        sa.Column("thoracic_atr", sa.Float(), nullable=False),
        sa.Column("lumbar_atr", sa.Float(), nullable=False),
        sa.Column("max_severity_zone", sa.Enum("safe", "caution", "alert", name="severityzone"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("curvature_measurement_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["curvature_measurement_id"], ["curvature_measurements.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_rotation_measurements_curvature_measurement_id", "rotation_measurements", ["curvature_measurement_id"], unique=False)
    op.create_index("ix_rotation_measurements_user_id", "rotation_measurements", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_rotation_measurements_user_id", table_name="rotation_measurements")
    op.drop_index("ix_rotation_measurements_curvature_measurement_id", table_name="rotation_measurements")
    op.drop_table("rotation_measurements")

    op.drop_index("ix_curvature_measurements_user_id", table_name="curvature_measurements")
    op.drop_table("curvature_measurements")

    op.drop_index("ix_alarms_user_uuid", table_name="alarms")
    op.drop_index("ix_alarms_id", table_name="alarms")
    op.drop_table("alarms")

    op.drop_index("ix_subscribes_user_uuid", table_name="subscribes")
    op.drop_index("ix_subscribes_id", table_name="subscribes")
    op.drop_table("subscribes")

    op.drop_index("ix_subscribe_cards_user_uuid", table_name="subscribe_cards")
    op.drop_index("ix_subscribe_cards_id", table_name="subscribe_cards")
    op.drop_table("subscribe_cards")

    op.drop_index("ix_subscribe_types_name", table_name="subscribe_types")
    op.drop_index("ix_subscribe_types_id", table_name="subscribe_types")
    op.drop_table("subscribe_types")

    op.drop_index("ix_analysis_types_name", table_name="analysis_types")
    op.drop_index("ix_analysis_types_id", table_name="analysis_types")
    op.drop_table("analysis_types")

    op.drop_index("ix_alarm_types_name", table_name="alarm_types")
    op.drop_index("ix_alarm_types_id", table_name="alarm_types")
    op.drop_table("alarm_types")

    op.drop_index("ix_users_user_id", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
