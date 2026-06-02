from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from ..models import User
from ..schemas import ContactCreate
from ..utils import get_current_user, send_contact_email

router = APIRouter()


@router.post("/", status_code=status.HTTP_200_OK)
async def send_contact(
    contact_data: ContactCreate,
    current_user: User = Depends(get_current_user),
):
    """고객센터 문의 발송"""
    email_sent = send_contact_email(
        user_email=contact_data.email,
        inquiry_type=contact_data.inquiry_type,
        inquiry_content=contact_data.inquiry_content
    )

    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send contact email"
        )

    return {"message": "Contact inquiry sent successfully"}


@router.post("/with-attachments", status_code=status.HTTP_200_OK)
async def send_contact_with_attachments(
    email: Optional[str] = Form(default=None),
    inquiry_type: str = Form(...),
    inquiry_content: str = Form(...),
    screenshots: Optional[List[UploadFile]] = File(default=None),
    current_user: User = Depends(get_current_user),
):
    """스크린샷을 포함한 고객센터 문의 발송"""
    attachments = []

    for screenshot in screenshots or []:
        if not screenshot.content_type or not screenshot.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files can be attached"
            )

        attachments.append({
            "filename": screenshot.filename or "screenshot.jpg",
            "content_type": screenshot.content_type,
            "content": await screenshot.read(),
        })

    email_sent = send_contact_email(
        # 사용자가 회신 이메일을 생략하면 로그인 계정 이메일을 사용한다.
        user_email=email or current_user.user_id,
        inquiry_type=inquiry_type,
        inquiry_content=inquiry_content,
        attachments=attachments,
    )

    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send contact email"
        )

    return {"message": "Contact inquiry sent successfully"}
