from pydantic import BaseModel, ConfigDict

from app.schemas.curvature import CurvatureMeasurementResponse
from app.schemas.rotation import RotationMeasurementResponse


class MeasurementSetResponse(BaseModel):
    curvature: CurvatureMeasurementResponse | None
    rotation: RotationMeasurementResponse | None

    model_config = ConfigDict(from_attributes=True)
