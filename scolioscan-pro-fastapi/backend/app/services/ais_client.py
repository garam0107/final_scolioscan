import httpx
from pathlib import Path
from typing import TypedDict

# AIS_API_URL = "http://ais-api:8000"

#  로컬 테스트용 주소
AIS_API_URL = "http://192.168.0.3:8002"


class AngleResult(TypedDict):
    main_thoracic: float
    secondary_thoracic: float
    lumbar: float
    severity: str
    back_type: str


async def predict_angle(image_path: Path) -> AngleResult:
    """Call AIS-API to predict spine angles from an image.

    Raises httpx.HTTPError on network/server errors.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        with open(image_path, "rb") as f:
            files = {"file": (image_path.name, f, "image/jpeg")}
            response = await client.post(f"{AIS_API_URL}/ais/angle", files=files)
        response.raise_for_status()
        data = response.json()
        return {
            "main_thoracic": float(data["main_thoracic"]),
            "secondary_thoracic": float(data["secondary_thoracic"]),
            "lumbar": float(data["lumbar"]),
            "severity": data.get("severity", "normal"),
            "back_type": data.get("back_type", "Unknown"),
        }
