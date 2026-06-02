from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from ..config import settings
from ..models.user import User
from ..services.ais_client import detect_landmarks
from ..utils import get_current_user


router = APIRouter()

MAX_LANDMARK_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _looks_like_allowed_image(content: bytes, content_type: str) -> bool:
    if content_type == "image/jpeg":
        return content.startswith(b"\xff\xd8\xff")
    if content_type == "image/png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/webp":
        return content.startswith(b"RIFF") and content[8:12] == b"WEBP"
    return False


@router.post("/landmarks")
async def detect_measure2d_landmarks(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """2D 자동 촬영 자세 판정을 위해 AIS 랜드마크 서버를 백엔드에서 대신 호출한다."""
    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="지원하지 않는 이미지 형식입니다.",
        )

    content = await file.read(MAX_LANDMARK_IMAGE_SIZE + 1)
    if len(content) > MAX_LANDMARK_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미지 크기는 5MB 이하여야 합니다.",
        )

    if not content or not _looks_like_allowed_image(content, content_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="올바른 이미지 파일이 아닙니다.",
        )

    temp_dir = Path(settings.UPLOAD_DIR) / "measure2d" / "tmp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    temp_path = temp_dir / f"{current_user.id}_{uuid.uuid4().hex}{ALLOWED_IMAGE_TYPES[content_type]}"

    try:
        temp_path.write_bytes(content)
        return await detect_landmarks(temp_path, content_type)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AIS-API 랜드마크 호출에 실패했습니다.",
        ) from error
    finally:
        temp_path.unlink(missing_ok=True)
