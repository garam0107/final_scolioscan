from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin, PasswordReset
from ..utils import create_access_token, verify_password, get_password_hash, send_password_reset_email, generate_random_password

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """회원가입"""
    # 이메일 중복 체크
    existing_user = db.query(User).filter(User.user_id == user_data.user_id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 비밀번호 해싱
    hashed_password = get_password_hash(user_data.user_pw)

    # 사용자 생성
    db_user = User(
        user_id=user_data.user_id,
        user_pw=hashed_password,
        name=user_data.name,
        phone=user_data.phone,
        birthday=user_data.birthday,
        sex=user_data.sex,
        address=user_data.address,
        detail_address=user_data.detail_address,
        alarm_count=0,
        setting={"voice_alarm": False}
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {"message": "User created successfully", "user_id": str(db_user.id)}


@router.post("/login")
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """로그인"""
    user = db.query(User).filter(User.user_id == user_data.user_id).first()

    if not user or not verify_password(user_data.user_pw, user.user_pw):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # JWT 토큰 생성
    access_token = create_access_token(data={"sub": user.user_id})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "name": user.name,
        "email": user.user_id
    }


@router.get("/check-email/{email}")
async def check_email(email: str, db: Session = Depends(get_db)):
    """이메일 중복 확인"""
    existing_user = db.query(User).filter(User.user_id == email).first()
    return {"exists": existing_user is not None}


@router.post("/password-reset")
async def password_reset(reset_data: PasswordReset, db: Session = Depends(get_db)):
    """비밀번호 찾기"""
    user = db.query(User).filter(
        User.user_id == reset_data.user_id,
        User.name == reset_data.name
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with provided email and name"
        )

    # 새 비밀번호 생성
    new_password = generate_random_password()
    user.user_pw = get_password_hash(new_password)

    db.commit()

    # 이메일 발송
    email_sent = send_password_reset_email(user.user_id, user.name, new_password)

    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send password reset email"
        )

    return {"message": "Password reset email sent successfully"}
