from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.curvature import CurvatureMeasurement
from ..models.rotation import RotationMeasurement
from ..models.user import User
from ..schemas.measurement_set import MeasurementSetResponse
from app.schemas.curvature import CurvatureMeasurementResponse
from app.services.s3_service import create_presigned_get_url
from ..utils import get_current_user


router = APIRouter()
def _curvature_response_with_presigned_image(
    curvature: CurvatureMeasurement | None,
) -> CurvatureMeasurementResponse | None:
    if curvature is None:
        return None

    response = CurvatureMeasurementResponse.model_validate(curvature)

    if curvature.image_path:
        response.image_path = create_presigned_get_url(curvature.image_path)

    return response
@router.get("/", response_model=list[MeasurementSetResponse])
def list_measurement_sets(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=1000),
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if from_date and to_date and from_date > to_date:
        raise HTTPException(status_code=400, detail="from_date must be before or equal to to_date")

    curvature_query = db.query(CurvatureMeasurement).filter(
        CurvatureMeasurement.user_id == str(current_user.id)
    )

    if from_date:
        curvature_query = curvature_query.filter(
            CurvatureMeasurement.measured_at >= datetime.combine(from_date, time.min)
        )

    if to_date:
        curvature_query = curvature_query.filter(
            CurvatureMeasurement.measured_at <= datetime.combine(to_date, time.max)
        )

    curvatures = (
        curvature_query
        .order_by(CurvatureMeasurement.measured_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    curvature_ids = [curvature.id for curvature in curvatures]
    rotation_by_curvature_id: dict[int, RotationMeasurement] = {}

    if curvature_ids:
        # 목록 카드마다 연결된 최신 척추측만계 측정값을 빠르게 붙이기 위해 한 번에 조회한다.
        rotations = (
            db.query(RotationMeasurement)
            .filter(
                RotationMeasurement.user_id == str(current_user.id),
                RotationMeasurement.curvature_measurement_id.in_(curvature_ids),
            )
            .order_by(RotationMeasurement.measured_at.desc())
            .all()
        )

        for rotation in rotations:
            if rotation.curvature_measurement_id is None:
                continue

            rotation_by_curvature_id.setdefault(rotation.curvature_measurement_id, rotation)

    return [
        MeasurementSetResponse(
            curvature=_curvature_response_with_presigned_image(curvature),
            rotation=rotation_by_curvature_id.get(curvature.id),
        )
        for curvature in curvatures
    ]


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

    return MeasurementSetResponse(
    curvature=_curvature_response_with_presigned_image(curvature),
    rotation=rotation,
)


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

    return MeasurementSetResponse(
    curvature=_curvature_response_with_presigned_image(curvature),
    rotation=rotation,
)