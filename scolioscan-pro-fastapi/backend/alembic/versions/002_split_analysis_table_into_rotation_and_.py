"""split analysis table into rotation and curvature

Revision ID: 002
Revises: 001
Create Date: 2026-04-15

"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create rotation_measurements table
    op.create_table(
        'rotation_measurements',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('measured_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('upper_thoracic_atr', sa.Float, nullable=False),
        sa.Column('lower_thoracic_atr', sa.Float, nullable=False),
        sa.Column('thoracolumbar_atr', sa.Float, nullable=False),
        sa.Column('upper_lumbar_atr', sa.Float, nullable=False),
        sa.Column('lower_lumbar_atr', sa.Float, nullable=False),
        sa.Column('thoracic_atr', sa.Float, nullable=False),
        sa.Column('lumbar_atr', sa.Float, nullable=False),
        sa.Column('max_severity_zone', sa.Enum('safe', 'caution', 'alert', name='severityzone'), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_rotation_user_measured', 'rotation_measurements', ['user_id', 'measured_at'])

    # Create curvature_measurements table
    op.create_table(
        'curvature_measurements',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('measured_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('main_thoracic_cobb', sa.Float, nullable=False),
        sa.Column('secondary_thoracic_cobb', sa.Float, nullable=False),
        sa.Column('lumbar_cobb', sa.Float, nullable=False),
        sa.Column('severity', sa.Enum('normal', 'mild', 'moderate', 'severe', name='severity'), nullable=False),
        sa.Column('back_type', sa.Enum('Normal', 'Thoracic', 'Double Thoracic', 'Double major', 'Triple curve', 'Lumbar', 'Unknown', name='backtype'), nullable=False),
        sa.Column('score', sa.Float, nullable=True),
        sa.Column('image_path', sa.String(512), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_curvature_user_measured', 'curvature_measurements', ['user_id', 'measured_at'])

    # Data migration: analysis_type=3 (척추측만계) -> rotation_measurements
    # Real table is 'analyses', FK col is 'user_uuid', value cols: main_thoracic, second_thoracic, lumbar
    op.execute("""
        INSERT INTO rotation_measurements (
            user_id, measured_at,
            upper_thoracic_atr, lower_thoracic_atr, thoracolumbar_atr,
            upper_lumbar_atr, lower_lumbar_atr,
            thoracic_atr, lumbar_atr, max_severity_zone, created_at
        )
        SELECT
            user_uuid,
            COALESCE(created_at, NOW()),
            COALESCE(main_thoracic, 0) AS upper_thoracic_atr,
            COALESCE(main_thoracic, 0) AS lower_thoracic_atr,
            COALESCE(second_thoracic, 0) AS thoracolumbar_atr,
            COALESCE(lumbar, 0) AS upper_lumbar_atr,
            COALESCE(lumbar, 0) AS lower_lumbar_atr,
            COALESCE(main_thoracic, 0) AS thoracic_atr,
            COALESCE(lumbar, 0) AS lumbar_atr,
            CASE
                WHEN GREATEST(ABS(COALESCE(main_thoracic, 0)), ABS(COALESCE(second_thoracic, 0)), ABS(COALESCE(lumbar, 0))) >= 7 THEN 'alert'
                WHEN GREATEST(ABS(COALESCE(main_thoracic, 0)), ABS(COALESCE(second_thoracic, 0)), ABS(COALESCE(lumbar, 0))) >= 5 THEN 'caution'
                ELSE 'safe'
            END AS max_severity_zone,
            COALESCE(created_at, NOW())
        FROM analyses
        WHERE analysis_type = 3
    """)

    # Data migration: analysis_type=1 (2D 이미지) -> curvature_measurements
    # No severity/back_type cols in analyses, default to 'normal'/'Unknown'
    op.execute("""
        INSERT INTO curvature_measurements (
            user_id, measured_at,
            main_thoracic_cobb, secondary_thoracic_cobb, lumbar_cobb,
            severity, back_type, score, image_path, created_at
        )
        SELECT
            user_uuid,
            COALESCE(created_at, NOW()),
            COALESCE(main_thoracic, 0),
            COALESCE(second_thoracic, 0),
            COALESCE(lumbar, 0),
            'normal',
            'Unknown',
            score,
            image_url,
            COALESCE(created_at, NOW())
        FROM analyses
        WHERE analysis_type = 1
    """)

    # Drop old analyses table (disable FK checks due to analysis_types FK)
    op.execute('SET FOREIGN_KEY_CHECKS=0')
    op.drop_table('analyses')
    op.execute('SET FOREIGN_KEY_CHECKS=1')


def downgrade() -> None:
    # Recreate analyses table (legacy schema)
    op.create_table(
        'analyses',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_uuid', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('analysis_type', sa.Integer, sa.ForeignKey('analysis_types.id'), nullable=False),
        sa.Column('main_thoracic', sa.Float, nullable=False),
        sa.Column('second_thoracic', sa.Float, nullable=True),
        sa.Column('lumbar', sa.Float, nullable=False),
        sa.Column('score', sa.Float, nullable=True),
        sa.Column('image_url', sa.String(256), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )

    # Restore rotation data back to analyses
    op.execute("""
        INSERT INTO analyses (id, user_uuid, analysis_type, main_thoracic, second_thoracic, lumbar, created_at)
        SELECT UUID(), user_id, 3, thoracic_atr, thoracolumbar_atr, lumbar_atr, created_at
        FROM rotation_measurements
    """)

    # Restore curvature data back to analyses
    op.execute("""
        INSERT INTO analyses (id, user_uuid, analysis_type, main_thoracic, second_thoracic, lumbar, score, image_url, created_at)
        SELECT UUID(), user_id, 1, main_thoracic_cobb, secondary_thoracic_cobb, lumbar_cobb, score, image_path, created_at
        FROM curvature_measurements
    """)

    op.execute('SET FOREIGN_KEY_CHECKS=0')
    op.drop_index('ix_curvature_user_measured', 'curvature_measurements')
    op.drop_table('curvature_measurements')
    op.drop_index('ix_rotation_user_measured', 'rotation_measurements')
    op.drop_table('rotation_measurements')
    op.execute('SET FOREIGN_KEY_CHECKS=1')
