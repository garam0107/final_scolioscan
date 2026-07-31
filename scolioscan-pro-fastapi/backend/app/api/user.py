from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from sqlalchemy.orm import Session
from typing import List, Literal
import logging
import os
import uuid
from pathlib import Path
from ..database import get_db
from ..models import User, CurvatureMeasurement, RotationMeasurement, SocialAccount
from sqlalchemy.exc import IntegrityError,SQLAlchemyError
from ..schemas import (
    PasswordChange,
    SocialAccountInfo,
    UserDeleteRequest,
    UserResponse,
    UserSocialAccountsResponse,
    UserUpdate,
)
from ..utils import get_current_user, get_password_hash, verify_password
from app.services.s3_service import upload_image_to_s3, create_presigned_get_url, delete_s3_object
from app.services.curvature_limit import reset_curvature_limit_if_expired
from app.services.auth_service import utcnow
from app.services.apple_auth_service import (
    encrypt_apple_refresh_token,
    exchange_apple_authorization_code,
    revoke_apple_refresh_token,
    verify_apple_identity,
)
router = APIRouter()
logger = logging.getLogger(__name__)


def _build_social_accounts_response(user: User) -> UserSocialAccountsResponse:
    # 연동되지 않은 기본 상태를 먼저 만들고, relationship으로 읽은 값만 덮어쓴다.
    social_accounts = {
        "google": SocialAccountInfo(is_linked=False, email=None),
        "naver": SocialAccountInfo(is_linked=False, email=None),
        "kakao": SocialAccountInfo(is_linked=False, email=None),
        "apple": SocialAccountInfo(is_linked=False, email=None),
    }

    for social_account in user.social_accounts:
        if social_account.provider not in social_accounts:
            continue

        social_accounts[social_account.provider] = SocialAccountInfo(
            is_linked=True,
            email=social_account.provider_email,
        )

    return UserSocialAccountsResponse(
        google=social_accounts["google"],
        naver=social_accounts["naver"],
        kakao=social_accounts["kakao"],
        apple=social_accounts["apple"],
    )


def _user_response_with_presigned_image(user: User) -> UserResponse:
    # 계산 필드가 추가되어 응답을 명시적으로 조립한다.
    apple_social_account = next(
        (social_account for social_account in user.social_accounts if social_account.provider == "apple"),
        None,
    )
    # 내부 식별용 Apple 주소를 화면에 노출하지 않고, 제공된 relay 이메일만 표시한다.
    display_email = (
        apple_social_account.provider_email
        if user.is_apple_direct_signup and apple_social_account is not None
        else user.user_id
    )

    response = UserResponse(
        id=user.id,
        user_id=user.user_id,
        display_email=display_email,
        name=user.name,
        phone=user.phone,
        birthday=user.birthday,
        sex=user.sex,
        address=user.address,
        detail_address=user.detail_address,
        profile_image=user.profile_image,
        alarm_count=user.alarm_count,
        curvature_limit=user.curvature_limit,
        curvature_limit_reset_at=user.curvature_limit_reset_at,
        setting=user.setting,
        is_admin=user.is_admin,
        is_apple_direct_signup=user.is_apple_direct_signup,
        created_at=user.created_at,
        social_accounts=_build_social_accounts_response(user),
    )

    if user.profile_image:
        response.profile_image = create_presigned_get_url(user.profile_image)

    return response
@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """현재 로그인한 사용자 정보 조회"""
    reset_curvature_limit_if_expired(db, current_user)
    return _user_response_with_presigned_image(current_user)


@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자 프로필 수정"""
    if user_data.name is not None:
        current_user.name = user_data.name
    if user_data.phone is not None:
        current_user.phone = user_data.phone
    if user_data.address is not None:
        current_user.address = user_data.address
    if user_data.detail_address is not None:
        current_user.detail_address = user_data.detail_address
    if user_data.birthday is not None:
        current_user.birthday = user_data.birthday
    if user_data.sex is not None:
        current_user.sex = user_data.sex

    db.commit()
    db.refresh(current_user)

    return _user_response_with_presigned_image(current_user)


@router.delete("/me/social/{provider}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_social_account(
    provider: Literal["google", "naver", "kakao", "apple"],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """현재 사용자에 연결된 소셜 계정 row만 삭제"""
    # 현재 사용자에게 연결된 동일 provider row만 찾아 삭제한다.
    social_account = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.provider == provider,
    ).first()

    if social_account is None:
        # 이미 삭제된 상태여도 재시도를 성공으로 처리해 프론트가 안전하게 복구할 수 있게 한다.
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    if provider == "apple" and current_user.is_apple_direct_signup:
        linked_social_count = sum(1 for account in current_user.social_accounts if account.provider)
        if linked_social_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="다른 로그인 방법을 연결한 뒤 Apple 연결을 해제할 수 있습니다.",
            )

    if provider == "apple" and social_account.apple_refresh_token:
        # Apple 연결은 DB 행을 지우기 전에 공급자 authorization까지 취소한다.
        await revoke_apple_refresh_token(social_account.apple_refresh_token)

    try:
        db.delete(social_account)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="소셜 연동 해제 처리 중 오류가 발생했습니다.",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/me/settings")
async def update_user_settings(
    settings: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자 환경 설정 업데이트"""
    current_user.setting = settings
    db.commit()

    return {"message": "Settings updated successfully", "settings": settings}


@router.put("/me/password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """비밀번호 변경"""
    if current_user.is_apple_direct_signup:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apple 직접 가입 계정은 비밀번호 로그인을 지원하지 않습니다.",
        )
      # 현재 비밀번호 확인
    if not verify_password(password_data.current_password, current_user.user_pw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="현재 비밀번호가 일치하지 않습니다"
        )


    # 새 비밀번호와 확인 비밀번호 일치 확인
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="새 비밀번호가 일치하지 않습니다"
        )
        # 현재 비밀번호와 새 비밀번호가 같은지 확인
    if verify_password(password_data.new_password, current_user.user_pw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="새 비밀번호는 현재 비밀번호와 달라야 합니다"
        )
    # 비밀번호 변경
    current_user.user_pw = get_password_hash(password_data.new_password)
    db.commit()

    return {"message": "비밀번호가 변경되었습니다"}


@router.post("/me/profile-image", response_model=UserResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """프로필 이미지 업로드"""
    # 이미지 파일 검증
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미지 파일만 업로드 가능합니다."
        )

    # 파일 크기 제한 (5MB)
    file_size = 0
    content = await file.read()
    file_size = len(content)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미지 크기는 5MB 이하여야 합니다."
        )

    if current_user.profile_image:
        try:
            delete_s3_object(current_user.profile_image)
        except Exception:
            pass

    profile_key = upload_image_to_s3(
        content,
        file.content_type,
        "profile",
    )

    current_user.profile_image = profile_key
    db.commit()
    db.refresh(current_user)

    return _user_response_with_presigned_image(current_user)


@router.post("/me/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(
    delete_data: UserDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """회원탈퇴"""

    if current_user.is_apple_direct_signup:
        if not delete_data.apple_identity_token or not delete_data.apple_authorization_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apple 재인증 정보가 필요합니다.",
            )

        provider_user_id, _ = await verify_apple_identity(delete_data.apple_identity_token)
        apple_tokens = await exchange_apple_authorization_code(
            delete_data.apple_authorization_code
        )
        exchanged_user_id, _ = await verify_apple_identity(
            apple_tokens["id_token"],
            access_token=apple_tokens["access_token"],
        )
        if exchanged_user_id != provider_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Apple 재인증 정보가 일치하지 않습니다.",
            )

        apple_social_account = db.query(SocialAccount).filter(
            SocialAccount.user_id == current_user.id,
            SocialAccount.provider == "apple",
            SocialAccount.provider_user_id == provider_user_id,
        ).first()
        if apple_social_account is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="현재 계정에 연결된 Apple 계정이 아닙니다.",
            )
        # 탈퇴 직전 재인증에서 받은 refresh token을 저장해 현재 Apple authorization을 revoke한다.
        apple_social_account.apple_refresh_token = encrypt_apple_refresh_token(
            apple_tokens["refresh_token"]
        )
        apple_social_account.apple_token_updated_at = utcnow()
    elif not delete_data.password or not verify_password(delete_data.password, current_user.user_pw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호가 일치하지 않습니다.",
        )

    try:
        user = db.get(User, current_user.id)

        if user is None:
            return Response(status_code=status.HTTP_204_NO_CONTENT)

        profile_image_key = user.profile_image
        apple_social_account = next(
            (
                social_account
                for social_account in user.social_accounts
                if social_account.provider == "apple"
            ),
            None,
        )
        if apple_social_account and apple_social_account.apple_refresh_token:
            try:
                # 외부 Apple 장애가 회원 탈퇴 자체를 막지 않도록 취소를 우선 시도하고 로컬 삭제는 계속한다.
                await revoke_apple_refresh_token(apple_social_account.apple_refresh_token)
            except HTTPException as error:
                logger.warning(
                    "Apple token revocation failed during account deletion: status=%s",
                    error.status_code,
                )

        if profile_image_key:
            try:
                # 계정 삭제 전에 S3 프로필 이미지를 먼저 삭제해 고아 객체가 남지 않도록 한다.
                delete_s3_object(profile_image_key)
            except Exception as error:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="프로필 이미지 삭제에 실패했습니다.",
                ) from error

        db.delete(user)
        db.commit()

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="회원탈퇴 처리 중 오류가 발생했습니다.",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/data/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
): 
    """유저 데이터 초기화"""
    user_id = str(current_user.id)

    try:
         # rotation 데이터 먼저 삭제
        db.query(RotationMeasurement).filter(
             RotationMeasurement.user_id == user_id
         ).delete(synchronize_session=False)

         # rotation 삭제 후 curvature 데이터 삭제 
        db.query(CurvatureMeasurement).filter(
            CurvatureMeasurement.user_id == user_id
        ).delete(synchronize_session=False)

        db.commit()
        
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="유저 데이터 초기화 처리 중 오류가 발생했습니다.",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)    

    
