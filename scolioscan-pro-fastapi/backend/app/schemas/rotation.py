from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class SeverityZone(str, Enum):
    safe = "safe"
    caution = "caution"
    alert = "alert"


class RotationMeasurementCreate(BaseModel):
    upper_thoracic_atr: float = Field(..., ge=-90, le=90)
    lower_thoracic_atr: float = Field(..., ge=-90, le=90)
    thoracolumbar_atr: float = Field(..., ge=-90, le=90)
    upper_lumbar_atr: float = Field(..., ge=-90, le=90)
    lower_lumbar_atr: float = Field(..., ge=-90, le=90)
    curvature_measurement_id: int | None = Field(default=None, ge=1)


class RotationMeasurementResponse(BaseModel):
    id: int
    user_id: str
    measured_at: datetime
    upper_thoracic_atr: float
    lower_thoracic_atr: float
    thoracolumbar_atr: float
    upper_lumbar_atr: float
    lower_lumbar_atr: float
    thoracic_atr: float
    lumbar_atr: float
    max_severity_zone: SeverityZone
    created_at: datetime
    curvature_measurement_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


def compute_zone(atr_values: list[float]) -> SeverityZone:
    max_abs = max(abs(v) for v in atr_values)
    if max_abs < 5.0:
        return SeverityZone.safe
    elif max_abs < 7.0:
        return SeverityZone.caution
    else:
        return SeverityZone.alert
