from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from uuid import UUID

from ..database import get_db
from ..models import User, AnalysisType
from ..utils.auth import get_current_user, create_access_token
from ..schemas.admin import (
    AdminUserResponse,
    AdminUserUpdate,
    AdminEmailRequest,
)

router = APIRouter()


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """관리자 권한 확인"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다."
        )
    return current_user


# =====================
# 고객(사용자) 관리 API
# =====================

@router.get("/customers", response_model=List[AdminUserResponse])
async def get_customers(
    search: Optional[str] = Query(None, description="검색어 (이름 또는 이메일)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """고객 목록 조회"""
    query = db.query(User)

    if search:
        query = query.filter(
            or_(
                User.name.ilike(f"%{search}%"),
                User.user_id.ilike(f"%{search}%")
            )
        )

    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return users


@router.get("/customers/{user_id}", response_model=AdminUserResponse)
async def get_customer(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """특정 고객 조회"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="고객을 찾을 수 없습니다."
        )
    return user


@router.put("/customers/{user_id}", response_model=AdminUserResponse)
async def update_customer(
    user_id: UUID,
    user_update: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """고객 정보 수정"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="고객을 찾을 수 없습니다."
        )

    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.post("/customers/{user_id}/login-as")
async def login_as_customer(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """해당 사용자로 로그인 (관리자 전용)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="고객을 찾을 수 없습니다."
        )

    access_token = create_access_token(data={"sub": user.user_id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "name": user.name,
        "email": user.user_id,
    }


@router.delete("/customers/{user_id}")
async def delete_customer(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """고객 삭제"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="고객을 찾을 수 없습니다."
        )

    db.delete(user)
    db.commit()

    return {"message": "고객이 삭제되었습니다."}


# =====================
# 이메일 발송 API
# =====================

@router.post("/email/send")
async def send_single_email(
    email_request: AdminEmailRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """개별 고객에게 이메일 발송"""
    from ..utils.email import send_email

    if not email_request.customer_ids or len(email_request.customer_ids) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="수신자를 선택해주세요."
        )

    user = db.query(User).filter(User.id == email_request.customer_ids[0]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )

    # 이메일 수신 동의 확인
    email_consent = user.setting.get('email_notifications', True) if user.setting else True
    if not email_consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="해당 사용자는 이메일 수신에 동의하지 않았습니다."
        )

    # HTML 이메일 템플릿
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h2 style="color: #22BCB7;">{email_request.subject}</h2>
                <div style="white-space: pre-wrap; line-height: 1.6;">
                    {email_request.content}
                </div>
                <hr style="border: 1px solid #eee; margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                    이 이메일은 NextVine에서 발송되었습니다.
                </p>
            </div>
        </body>
    </html>
    """

    success = send_email(user.user_id, email_request.subject, html_content)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="이메일 발송에 실패했습니다."
        )

    return {
        "message": "이메일이 발송되었습니다.",
        "recipient": user.user_id
    }


@router.post("/email/send-bulk")
async def send_bulk_email(
    email_request: AdminEmailRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """이메일 수신 동의한 전체 고객에게 이메일 발송"""
    from ..utils.email import send_email

    # 이메일 수신 동의한 사용자만 조회
    all_users = db.query(User).all()
    recipients = []

    for user in all_users:
        # setting에서 email_notifications 확인 (기본값은 True)
        email_consent = user.setting.get('email_notifications', True) if user.setting else True
        if email_consent:
            recipients.append(user)

    if not recipients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이메일 수신에 동의한 사용자가 없습니다."
        )

    # HTML 이메일 템플릿
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h2 style="color: #22BCB7;">{email_request.subject}</h2>
                <div style="white-space: pre-wrap; line-height: 1.6;">
                    {email_request.content}
                </div>
                <hr style="border: 1px solid #eee; margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                    이 이메일은 NextVine에서 발송되었습니다.
                </p>
            </div>
        </body>
    </html>
    """

    success_count = 0
    fail_count = 0

    for user in recipients:
        try:
            if send_email(user.user_id, email_request.subject, html_content):
                success_count += 1
            else:
                fail_count += 1
        except Exception:
            fail_count += 1

    return {
        "message": f"{success_count}명에게 이메일이 발송되었습니다.",
        "success_count": success_count,
        "fail_count": fail_count,
        "total_recipients": len(recipients)
    }


@router.get("/email/check-consent/{user_id}")
async def check_email_consent(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """사용자의 이메일 수신 동의 여부 확인"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )

    email_consent = user.setting.get('email_notifications', True) if user.setting else True

    return {
        "user_id": str(user_id),
        "email_consent": email_consent
    }
