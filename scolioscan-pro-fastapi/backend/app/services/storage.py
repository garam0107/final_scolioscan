from pathlib import Path
from typing import Optional, Union
import uuid
import shutil
from fastapi import UploadFile
from ..config import settings


class UploadStorage:
    """Manage upload directory and file operations."""

    def __init__(self, base_dir: Optional[Union[str, Path]] = None):
        self.base_dir = Path(base_dir or settings.UPLOAD_DIR)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def user_dir(self, user_id) -> Path:
        path = self.base_dir / str(user_id)
        path.mkdir(parents=True, exist_ok=True)
        return path

    def save_analysis_image(self, user_id, image: UploadFile) -> str:
        """Save image under user directory and return relative API url."""
        filename = str(uuid.uuid4())
        file_path = self.user_dir(user_id) / filename

        with file_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        return f"/api/analysis/images/{filename}"

    def get_image_path(self, user_id, filename: str) -> Path:
        """Resolve image path for the given user and filename."""
        safe_name = Path(filename).name  # prevent traversal
        return self.user_dir(user_id) / safe_name
