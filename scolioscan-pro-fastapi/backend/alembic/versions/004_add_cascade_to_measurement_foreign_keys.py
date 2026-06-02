"""add cascade to measurement foreign keys

Revision ID: 004
Revises: 003
Create Date: 2026-06-02

"""
from alembic import op
from sqlalchemy import inspect


revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def _find_foreign_key_name(table_name: str, constrained_columns: list[str], referred_table: str) -> str | None:
    inspector = inspect(op.get_bind())

    for foreign_key in inspector.get_foreign_keys(table_name):
        if (
            foreign_key.get('constrained_columns') == constrained_columns
            and foreign_key.get('referred_table') == referred_table
        ):
            return foreign_key.get('name')

    return None


def _drop_foreign_key_if_exists(table_name: str, constrained_columns: list[str], referred_table: str) -> None:
    foreign_key_name = _find_foreign_key_name(table_name, constrained_columns, referred_table)
    if foreign_key_name:
        op.drop_constraint(foreign_key_name, table_name, type_='foreignkey')


def upgrade() -> None:
    # 회원 탈퇴 시 사용자의 2D 측정 데이터가 함께 삭제되도록 FK를 다시 건다.
    _drop_foreign_key_if_exists('curvature_measurements', ['user_id'], 'users')
    op.create_foreign_key(
        'fk_curvature_measurements_user_id',
        'curvature_measurements',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE',
    )

    # 회원 탈퇴 시 사용자의 척추측만계 측정 데이터가 함께 삭제되도록 FK를 다시 건다.
    _drop_foreign_key_if_exists('rotation_measurements', ['user_id'], 'users')
    op.create_foreign_key(
        'fk_rotation_measurements_user_id',
        'rotation_measurements',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE',
    )

    # 연결된 2D 측정 데이터가 삭제될 때 같은 세트의 척추측만계 데이터도 함께 정리한다.
    _drop_foreign_key_if_exists('rotation_measurements', ['curvature_measurement_id'], 'curvature_measurements')
    op.create_foreign_key(
        'fk_rotation_measurements_curvature_measurement_id',
        'rotation_measurements',
        'curvature_measurements',
        ['curvature_measurement_id'],
        ['id'],
        ondelete='CASCADE',
    )


def downgrade() -> None:
    # 롤백 시에는 기존 동작처럼 부모 데이터 삭제를 제한하는 FK로 되돌린다.
    _drop_foreign_key_if_exists('rotation_measurements', ['curvature_measurement_id'], 'curvature_measurements')
    op.create_foreign_key(
        'fk_rotation_measurements_curvature_measurement_id',
        'rotation_measurements',
        'curvature_measurements',
        ['curvature_measurement_id'],
        ['id'],
    )

    _drop_foreign_key_if_exists('rotation_measurements', ['user_id'], 'users')
    op.create_foreign_key(
        'fk_rotation_measurements_user_id',
        'rotation_measurements',
        'users',
        ['user_id'],
        ['id'],
    )

    _drop_foreign_key_if_exists('curvature_measurements', ['user_id'], 'users')
    op.create_foreign_key(
        'fk_curvature_measurements_user_id',
        'curvature_measurements',
        'users',
        ['user_id'],
        ['id'],
    )
