from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.curvature import CurvatureMeasurement
from ..models.rotation import RotationMeasurement
from ..models.user import User
from ..schemas.rotation import (
    RotationMeasurementCreate,
    RotationMeasurementResponse,
    compute_zone,
)
from ..utils import get_current_user


router = APIRouter()


@router.post("/", response_model=RotationMeasurementResponse, status_code=201)
def create_rotation(
    payload: RotationMeasurementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    atr_values = [
        payload.upper_thoracic_atr,
        payload.lower_thoracic_atr,
        payload.thoracolumbar_atr,
        payload.upper_lumbar_atr,
        payload.lower_lumbar_atr,
    ]
    thoracic_atr = (payload.upper_thoracic_atr + payload.lower_thoracic_atr) / 2
    lumbar_atr = (payload.upper_lumbar_atr + payload.lower_lumbar_atr) / 2
    zone = compute_zone([thoracic_atr, payload.thoracolumbar_atr, lumbar_atr])

    # rotation은 클라이언트 ID를 신뢰하지 않고, 저장 시점의 최신 2D 측정 결과에만 연결한다.
    latest_curvature = (
        db.query(CurvatureMeasurement)
        .filter(CurvatureMeasurement.user_id == str(current_user.id))
        .order_by(
            CurvatureMeasurement.measured_at.desc(),
            CurvatureMeasurement.id.desc(),
        )
        .first()
    )
    if latest_curvature is None:
        raise HTTPException(
            status_code=409,
            detail="A curvature measurement is required before rotation measurement",
        )

    measurement = RotationMeasurement(
        user_id=str(current_user.id),
        curvature_measurement_id=latest_curvature.id,
        upper_thoracic_atr=payload.upper_thoracic_atr,
        lower_thoracic_atr=payload.lower_thoracic_atr,
        thoracolumbar_atr=payload.thoracolumbar_atr,
        upper_lumbar_atr=payload.upper_lumbar_atr,
        lower_lumbar_atr=payload.lower_lumbar_atr,
        thoracic_atr=thoracic_atr,
        lumbar_atr=lumbar_atr,
        max_severity_zone=zone,
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    return measurement


@router.get("/", response_model=List[RotationMeasurementResponse])
def list_rotations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(RotationMeasurement)
        .filter(RotationMeasurement.user_id == str(current_user.id))
        .order_by(RotationMeasurement.measured_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{measurement_id}", response_model=RotationMeasurementResponse)
def get_rotation(
    measurement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    measurement = (
        db.query(RotationMeasurement)
        .filter(
            RotationMeasurement.id == measurement_id,
            RotationMeasurement.user_id == str(current_user.id),
        )
        .first()
    )
    if not measurement:
        raise HTTPException(status_code=404, detail="Measurement not found")
    return measurement
