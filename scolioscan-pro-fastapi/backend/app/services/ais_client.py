import httpx
from pathlib import Path
from typing import TypedDict

from ..config import settings


class AngleResult(TypedDict):
    main_thoracic: float
    secondary_thoracic: float
    lumbar: float
    severity: str
    back_type: str


def _ais_api_url() -> str:
    return settings.AIS_API_URL.rstrip("/")


async def predict_angle(image_path: Path) -> AngleResult:
    """Call AIS-API to predict spine angles from an image.

    Raises httpx.HTTPError on network/server errors.
    """
    async with httpx.AsyncClient(timeout=90.0) as client:
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

