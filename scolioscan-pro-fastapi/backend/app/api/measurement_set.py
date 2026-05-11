from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.curvature import CurvatureMeasurement
from ..models.rotation import RotationMeasurement
from ..models.user import User
from ..schemas.measurement_set import MeasurementSetResponse
from ..utils import get_current_user


router = APIRouter()


def _get_user_curvature(
    curvature_id: int,
    db: Session,
    current_user: User,
) -> CurvatureMeasurement:
    curvature = (
        db.query(CurvatureMeasurement)
        .filter(
            CurvatureMeasurement.id == curvature_id,
            CurvatureMeasurement.user_id == str(current_user.id),
        )
        .first()
    )
    if not curvature:
        raise HTTPException(status_code=404, detail="Curvature measurement not found")
    return curvature


def _get_user_rotation(
    rotation_id: int,
    db: Session,
    current_user: User,
) -> RotationMeasurement:
    rotation = (
        db.query(RotationMeasurement)
        .filter(
            RotationMeasurement.id == rotation_id,
            RotationMeasurement.user_id == str(current_user.id),
        )
        .first()
    )
    if not rotation:
        raise HTTPException(status_code=404, detail="Rotation measurement not found")
    return rotation


@router.get("/by-curvature/{curvature_id}", response_model=MeasurementSetResponse)
def get_measurement_set_by_curvature(
    curvature_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    curvature = _get_user_curvature(curvature_id, db, current_user)
    # 2D 촬영 결과에 연결된 척추측만계 측정값을 함께 내려준다.
    rotation = (
        db.query(RotationMeasurement)
        .filter(
            RotationMeasurement.curvature_measurement_id == curvature.id,
            RotationMeasurement.user_id == str(current_user.id),
        )
        .order_by(RotationMeasurement.measured_at.desc())
        .first()
    )

    return MeasurementSetResponse(curvature=curvature, rotation=rotation)


@router.get("/by-rotation/{rotation_id}", response_model=MeasurementSetResponse)
def get_measurement_set_by_rotation(
    rotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rotation = _get_user_rotation(rotation_id, db, current_user)
    curvature = None

    if rotation.curvature_measurement_id is not None:
        # 척추측만계 측정값에 연결된 2D 촬영 결과도 현재 사용자 소유인지 확인한다.
        curvature = _get_user_curvature(rotation.curvature_measurement_id, db, current_user)

    return MeasurementSetResponse(curvature=curvature, rotation=rotation)
