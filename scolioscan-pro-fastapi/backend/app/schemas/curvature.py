from datetime import datetime
from pydantic import BaseModel, ConfigDict
from enum import Enum


class Severity(str, Enum):
    normal = "normal"
    mild = "mild"
    moderate = "moderate"
    severe = "severe"


class BackType(str, Enum):
    Normal = "Normal"
    Thoracic = "Thoracic"
    DoubleThoracic = "Double Thoracic"
    DoubleMajor = "Double major"
    TripleCurve = "Triple curve"
    Lumbar = "Lumbar"
    Unknown = "Unknown"


class CurvatureMeasurementResponse(BaseModel):
    id: int
    user_id: str
    measured_at: datetime
    main_thoracic_cobb: float
    secondary_thoracic_cobb: float
    lumbar_cobb: float
    severity: Severity
    back_type: BackType
    score: float | None
    image_path: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
