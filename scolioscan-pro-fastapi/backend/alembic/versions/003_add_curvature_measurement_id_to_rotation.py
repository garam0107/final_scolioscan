"""add curvature measurement id to rotation

Revision ID: 003
Revises: 002
Create Date: 2026-05-11

"""
from alembic import op
import sqlalchemy as sa


revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 척추측만계 측정이 어떤 2D 촬영 결과와 같은 세트인지 연결하기 위한 컬럼이다.
    op.add_column(
        'rotation_measurements',
        sa.Column('curvature_measurement_id', sa.Integer(), nullable=True),
    )
    # 연결된 2D 촬영 결과를 빠르게 조회하기 위해 별도 인덱스를 둔다.
    op.create_index(
        'ix_rotation_measurements_curvature_measurement_id',
        'rotation_measurements',
        ['curvature_measurement_id'],
    )
    # 실제 curvature_measurements.id만 저장되도록 FK를 건다.
    op.create_foreign_key(
        'fk_rotation_measurements_curvature_measurement_id',
        'rotation_measurements',
        'curvature_measurements',
        ['curvature_measurement_id'],
        ['id'],
    )


def downgrade() -> None:
    # FK가 인덱스와 컬럼에 의존하므로 가장 먼저 제거한다.
    op.drop_constraint(
        'fk_rotation_measurements_curvature_measurement_id',
        'rotation_measurements',
        type_='foreignkey',
    )
    # 컬럼 삭제 전에 해당 컬럼 기반 인덱스를 먼저 제거한다.
    op.drop_index(
        'ix_rotation_measurements_curvature_measurement_id',
        table_name='rotation_measurements',
    )
    op.drop_column('rotation_measurements', 'curvature_measurement_id')
