from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from pathlib import Path
from typing import List
from datetime import date, datetime, time
import tempfile


from app.database import get_db
from app.models.curvature import CurvatureMeasurement, Severity, BackType
from app.models.user import User
from app.schemas.curvature import CurvatureMeasurementResponse
from app.utils.auth import get_current_user
from app.services.ais_client import predict_angle
from app.services.s3_service import upload_image_to_s3, create_presigned_get_url

router = APIRouter(prefix="/api/curvature", tags=["curvature"])
def _curvature_response_with_presigned_image(
    measurement: CurvatureMeasurement,
) -> CurvatureMeasurementResponse:
    response = CurvatureMeasurementResponse.model_validate(measurement)

    if measurement.image_path:
        response.image_path = create_presigned_get_url(measurement.image_path)

    return response

def _severity_from_max_angle(angles: list[float]) -> Severity:
    max_abs = max(abs(a) for a in angles)
    if max_abs < 10:
        return Severity.normal
    elif max_abs < 25:
        return Severity.mild
    elif max_abs < 40:
        return Severity.moderate
    else:
        return Severity.severe


def _backtype_from_string(s: str) -> BackType:
    mapping = {
        "Normal": BackType.Normal,
        "Thoracic": BackType.Thoracic,
        "Double Thoracic": BackType.DoubleThoracic,
        "Double major": BackType.DoubleMajor,
        "Triple curve": BackType.TripleCurve,
        "Lumbar": BackType.Lumbar,
    }
    return mapping.get(s, BackType.Unknown)


@router.post("/", response_model=CurvatureMeasurementResponse, status_code=201)
async def create_curvature(
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Save image
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")

    contents = await image.read()

    ext = Path(image.filename or "upload.jpg").suffix or ".jpg"

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(contents)
            tmp_path = Path(tmp.name)

        result = await predict_angle(tmp_path)

    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AIS-API call failed: {exc}")

    finally:
        if tmp_path and tmp_path.exists():
            tmp_path.unlink(missing_ok=True)

    try:
        image_key = upload_image_to_s3(
            contents,
            image.content_type,
            "curvature",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {exc}")

    severity = _severity_from_max_angle([
        result["main_thoracic"], result["secondary_thoracic"], result["lumbar"],
    ])
    back_type = _backtype_from_string(result["back_type"])

    measurement = CurvatureMeasurement(
        user_id=str(current_user.id),
        main_thoracic_cobb=result["main_thoracic"],
        secondary_thoracic_cobb=result["secondary_thoracic"],
        lumbar_cobb=result["lumbar"],
        severity=severity,
        back_type=back_type,
        score=None,
        image_path=image_key,
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    return _curvature_response_with_presigned_image(measurement)


@router.get("/", response_model=List[CurvatureMeasurementResponse])
def list_curvatures(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=1000),
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if from_date and to_date and from_date > to_date:
        raise HTTPException(status_code=400, detail="from_date must be before or equal to to_date")

    query = db.query(CurvatureMeasurement).filter(
        CurvatureMeasurement.user_id == str(current_user.id)
    )

    if from_date:
        query = query.filter(
            CurvatureMeasurement.measured_at >= datetime.combine(from_date, time.min)
        )

    if to_date:
        query = query.filter(
            CurvatureMeasurement.measured_at <= datetime.combine(to_date, time.max)
        )
    measurements = (
        query
        .order_by(CurvatureMeasurement.measured_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        _curvature_response_with_presigned_image(measurement)
        for measurement in measurements
    ]


@router.get("/{measurement_id}", response_model=CurvatureMeasurementResponse)
def get_curvature(
    measurement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    measurement = (
        db.query(CurvatureMeasurement)
        .filter(
            CurvatureMeasurement.id == measurement_id,
            CurvatureMeasurement.user_id == str(current_user.id),
        )
        .first()
    )
    if not measurement:
        raise HTTPException(status_code=404, detail="Measurement not found")
    return _curvature_response_with_presigned_image(measurement)

