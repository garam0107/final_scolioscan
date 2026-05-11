from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from app.database import Base
import enum


class SeverityZone(str, enum.Enum):
    safe = "safe"
    caution = "caution"
    alert = "alert"


class RotationMeasurement(Base):
    __tablename__ = "rotation_measurements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    measured_at = Column(DateTime, nullable=False, server_default=func.now())

    upper_thoracic_atr = Column(Float, nullable=False)
    lower_thoracic_atr = Column(Float, nullable=False)
    thoracolumbar_atr = Column(Float, nullable=False)
    upper_lumbar_atr = Column(Float, nullable=False)
    lower_lumbar_atr = Column(Float, nullable=False)

    thoracic_atr = Column(Float, nullable=False)
    lumbar_atr = Column(Float, nullable=False)

    max_severity_zone = Column(SQLEnum(SeverityZone), nullable=False)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    # 같이 측정한 2D 촬영 결과를 연결하기 위한 curvature id
    curvature_measurement_id = Column(
        Integer,
        ForeignKey("curvature_measurements.id"),
        nullable=True,
        index=True,
    )
