import httpx
from pathlib import Path
from typing import Any, TypedDict

from ..config import settings


class AngleResult(TypedDict):
    main_thoracic: float
    secondary_thoracic: float
    lumbar: float
    severity: str
    back_type: str


class LandmarkPoint(TypedDict):
    x: float
    y: float
    z: float
    visibility: float


class LandmarkResult(TypedDict):
    detected: bool
    landmarks: list[LandmarkPoint] | None
    face_detected: bool
    face_score: float
    face_count: int


def _ais_api_url() -> str:
    return settings.AIS_API_URL.rstrip("/")


async def predict_angle(image_path: Path) -> AngleResult:
    """Call AIS-API to predict spine angles from an image.

    Raises httpx.HTTPError on network/server errors.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        with open(image_path, "rb") as f:
            files = {"file": (image_path.name, f, "image/jpeg")}
            response = await client.post(f"{_ais_api_url()}/ais/angle", files=files)
        response.raise_for_status()
        data = response.json()
        return {
            "main_thoracic": float(data["main_thoracic"]),
            "secondary_thoracic": float(data["secondary_thoracic"]),
            "lumbar": float(data["lumbar"]),
            "severity": data.get("severity", "normal"),
            "back_type": data.get("back_type", "Unknown"),
        }


async def detect_landmarks(image_path: Path, content_type: str = "image/jpeg") -> LandmarkResult:
    """Call AIS-API to detect pose landmarks from an image."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        with open(image_path, "rb") as f:
            files = {"file": (image_path.name, f, content_type)}
            response = await client.post(f"{_ais_api_url()}/ais/landmarks", files=files)
        response.raise_for_status()
        data: dict[str, Any] = response.json()
        landmarks = data.get("landmarks")
        return {
            "detected": bool(data.get("detected", False)),
            "landmarks": landmarks if isinstance(landmarks, list) else None,
            "face_detected": bool(data.get("face_detected", False)),
            "face_score": float(data.get("face_score", 0) or 0),
            "face_count": int(data.get("face_count", 0) or 0),
        }
