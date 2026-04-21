from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from typing import List
import uuid
import shutil

from app.database import get_db
from app.models.curvature import CurvatureMeasurement, Severity, BackType
from app.models.user import User
from app.schemas.curvature import CurvatureMeasurementResponse
from app.utils.auth import get_current_user
from app.services.ais_client import predict_angle
from app.config import settings


router = APIRouter(prefix="/api/curvature", tags=["curvature"])

UPLOAD_DIR = Path(settings.UPLOAD_DIR) / "curvature"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


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
    ext = Path(image.filename or "upload.jpg").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(image.file, f)

    # Call AIS-API
    try:
        result = await predict_angle(file_path)
    except Exception as exc:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=502, detail=f"AIS-API call failed: {exc}")

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
        image_path=f"curvature/{filename}",
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    return measurement


@router.get("/", response_model=List[CurvatureMeasurementResponse])
def list_curvatures(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(CurvatureMeasurement)
        .filter(CurvatureMeasurement.user_id == str(current_user.id))
        .order_by(CurvatureMeasurement.measured_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


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
    return measurement


@router.get("/images/{filename}")
def get_curvature_image(
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify ownership
    measurement = (
        db.query(CurvatureMeasurement)
        .filter(
            CurvatureMeasurement.image_path == f"curvature/{filename}",
            CurvatureMeasurement.user_id == str(current_user.id),
        )
        .first()
    )
    if not measurement:
        raise HTTPException(status_code=404, detail="Image not found")

    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
