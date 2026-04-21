from fastapi import APIRouter, Depends, HTTPException, status
from ..schemas import ContactCreate
from ..utils import send_contact_email

router = APIRouter()


@router.post("/", status_code=status.HTTP_200_OK)
async def send_contact(contact_data: ContactCreate):
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
