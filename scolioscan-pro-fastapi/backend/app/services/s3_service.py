# backend/app/services/s3_service.py

import io
import uuid
import boto3

from app.config import settings
from botocore.config import Config

s3_client = boto3.client(
    "s3",
    region_name=settings.AWS_REGION,
    endpoint_url=f"https://s3.{settings.AWS_REGION}.amazonaws.com",
    config=Config(
        signature_version="s3v4",
        s3={"addressing_style": "virtual"},
    ),
)


def _get_extension(content_type: str | None) -> str:
    if content_type == "image/png":
        return "png"
    if content_type == "image/webp":
        return "webp"
    return "jpg"


def upload_image_to_s3(
    contents: bytes,
    content_type: str | None,
    prefix: str,
) -> str:
    if not settings.S3_BUCKET:
        raise RuntimeError("S3_BUCKET is not configured")

    ext = _get_extension(content_type)
    key = f"{prefix}/{uuid.uuid4().hex}.{ext}"

    s3_client.upload_fileobj(
        io.BytesIO(contents),
        settings.S3_BUCKET,
        key,
        ExtraArgs={
            "ContentType": content_type or "image/jpeg",
            "ServerSideEncryption": "AES256",
        },
    )

    return key


def create_presigned_get_url(key: str, expires_in: int = 86400) -> str:
    if not settings.S3_BUCKET:
        raise RuntimeError("S3_BUCKET is not configured")

    return s3_client.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": settings.S3_BUCKET,
            "Key": key,
        },
        ExpiresIn=expires_in,
    )


def delete_s3_object(key: str) -> None:
    if not settings.S3_BUCKET:
        raise RuntimeError("S3_BUCKET is not configured")

    s3_client.delete_object(
        Bucket=settings.S3_BUCKET,
        Key=key,
    )