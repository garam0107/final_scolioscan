from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from app.database import Base
import enum


class Severity(str, enum.Enum):
    normal = "normal"
    mild = "mild"
    moderate = "moderate"
    severe = "severe"


class BackType(str, enum.Enum):
    Normal = "Normal"
    Thoracic = "Thoracic"
    DoubleThoracic = "Double Thoracic"
    DoubleMajor = "Double major"
    TripleCurve = "Triple curve"
    Lumbar = "Lumbar"
    Unknown = "Unknown"


class CurvatureMeasurement(Base):
    __tablename__ = "curvature_measurements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    measured_at = Column(DateTime, nullable=False, server_default=func.now())

    main_thoracic_cobb = Column(Float, nullable=False)
    secondary_thoracic_cobb = Column(Float, nullable=False)
    lumbar_cobb = Column(Float, nullable=False)

    severity = Column(
        SQLEnum(Severity, values_callable=lambda e: [x.value for x in e]),
        nullable=False,
    )
    back_type = Column(
        SQLEnum(BackType, values_callable=lambda e: [x.value for x in e]),
        nullable=False,
    )

    score = Column(Float, nullable=True)
    image_path = Column(String(512), nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
