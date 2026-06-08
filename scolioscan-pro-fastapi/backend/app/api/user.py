from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from pathlib import Path
from ..database import get_db
from ..models import User, CurvatureMeasurement, RotationMeasurement
from sqlalchemy.exc import IntegrityError,SQLAlchemyError
from ..schemas import UserResponse, UserUpdate, PasswordChange, UserDeleteRequest
from ..utils import get_current_user, get_password_hash, verify_password
from app.services.s3_service import upload_image_to_s3, create_presigned_get_url, delete_s3_object
router = APIRouter()


def _user_response_with_presigned_image(user: User) -> UserResponse:
    response = UserResponse.model_validate(user)

    if user.profile_image:
        response.profile_image = create_presigned_get_url(user.profile_image)

    return response 
@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """현재 로그인한 사용자 정보 조회"""
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

    if not verify_password(delete_data.password, current_user.user_pw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호가 일치하지 않습니다.",
        )

    try:
        user = db.get(User, current_user.id)

        if user is None:
            return Response(status_code=status.HTTP_204_NO_CONTENT)

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

    