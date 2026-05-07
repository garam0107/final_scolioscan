from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from pathlib import Path
from ..database import get_db
from ..models import User
from sqlalchemy.exc import IntegrityError
from ..schemas import UserResponse, UserUpdate, PasswordChange
from ..utils import get_current_user, get_password_hash, verify_password

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """현재 로그인한 사용자 정보 조회"""
    return current_user


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

    return current_user


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

    # uploads 디렉토리 생성
    upload_dir = Path("uploads/profile_images")
    upload_dir.mkdir(parents=True, exist_ok=True)

    # 파일 확장자 추출
    file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'

    # 고유한 파일명 생성
    filename = f"{uuid.uuid4()}{file_extension}"
    file_path = upload_dir / filename

    # 이전 프로필 이미지 삭제
    if current_user.profile_image:
        old_file_path = Path(current_user.profile_image.lstrip('/'))
        if old_file_path.exists():
            try:
                old_file_path.unlink()
            except Exception:
                pass  # 파일 삭제 실패해도 계속 진행

    # 파일 저장
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    # DB에 이미지 경로 저장
    current_user.profile_image = f"/uploads/profile_images/{filename}"
    db.commit()
    db.refresh(current_user)

    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """회원탈퇴"""
    try:
        db.delete(current_user)
        db.commit()
        return None
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="회원탈퇴 처리 중 관련 데이터가 남아 있어 삭제할 수 없습니다.",
        )