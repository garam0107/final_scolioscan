from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
from datetime import datetime, timedelta
from jose import JWTError, jwt
from ..database import get_db
from ..models import User
from ..schemas import (
    OctomoIssueCodeRequest,
    OctomoIssueCodeResponse,
    OctomoVerifyRequest,
    OctomoVerifyResponse,
    UserCreate,
    UserLogin,
    PasswordResetVerify,
    PasswordResetCheckResponse,
    PasswordResetVerifyResponse,
    PasswordResetConfirm,
    EmailFindRequest,
    EmailFindCheckResponse,
    EmailFindVerifyResponse,
)
from ..utils import create_access_token, verify_password, get_password_hash
# OCTOMO 관련 import
from ..config import settings
from ..services.octomo_verification import issue_verification_code, normalize_phone_number, verify_verification_code_with_octomo

router = APIRouter()
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = 10
PASSWORD_RESET_TOKEN_TYPE = "password_reset"


def create_password_reset_token(user: User) -> str:
    """비밀번호 재설정 전용 토큰을 짧은 유효시간으로 발급합니다."""
    expire = datetime.utcnow() + timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user.user_id,
        "user_id": str(user.id),
        "type": PASSWORD_RESET_TOKEN_TYPE,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_password_reset_user(reset_token: str, db: Session) -> User:
    """재설정 토큰을 검증하고 대상 사용자를 조회합니다."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired password reset token",
    )

    try:
        payload = jwt.decode(reset_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != PASSWORD_RESET_TOKEN_TYPE:
            raise credentials_exception

        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        raise credentials_exception

    return user


def find_user_by_name_and_phone(name: str, phone: str, db: Session) -> User | None:
    """이름과 휴대전화 번호가 모두 일치하는 사용자를 찾습니다."""
    normalized_phone = normalize_phone_number(phone)
    users = db.query(User).filter(User.name == name).all()

    for user in users:
        if normalize_phone_number(user.phone) == normalized_phone:
            return user

    return None


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

@router.get("/check-phone/{phone}")
async def check_phone(phone: str, db: Session = Depends(get_db)):
    """휴대폰 번호 중복 확인"""
    existing_user_phone = db.query(User).filter(User.phone == phone).first()
    return {"exists" : existing_user_phone is not None}

# OCTOMO 인증 관련 API
@router.post("/issue-code", response_model=OctomoIssueCodeResponse)
async def issue_phone_verification_code(payload: OctomoIssueCodeRequest):
    """휴대폰 인증코드를 발급합니다."""
    try:
        challenge = await issue_verification_code(payload.phoneNumber)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return OctomoIssueCodeResponse(
        phoneNumber=challenge.phone_number,
        code=challenge.code,
        recipientNumber=settings.OCTOMO_RECIPIENT_NUMBER,
        messageText=challenge.code,
        expiresAt=challenge.expires_at,
        expiresInSeconds=settings.OCTOMO_VERIFICATION_TTL_SECONDS,
    )


@router.post("/verify", response_model=OctomoVerifyResponse)
async def verify_phone_verification(payload: OctomoVerifyRequest):
    """OCTOMO를 통해 인증 여부를 확인합니다."""
    try:
        verified = await verify_verification_code_with_octomo(payload.phoneNumber)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OCTOMO API 호출에 실패했습니다.",
        ) from error
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    return OctomoVerifyResponse(verified=verified)


@router.post("/email-find/check", response_model=EmailFindCheckResponse)
async def check_email_find_account(
    email_find_data: EmailFindRequest,
    db: Session = Depends(get_db)
):
    """이메일 찾기 전에 이름과 휴대전화 번호가 일치하는 계정이 있는지 확인합니다."""
    user = find_user_by_name_and_phone(
        name=email_find_data.name,
        phone=email_find_data.phone,
        db=db,
    )

    return EmailFindCheckResponse(exists=user is not None)


@router.post("/email-find/verify", response_model=EmailFindVerifyResponse)
async def verify_email_find(
    email_find_data: EmailFindRequest,
    db: Session = Depends(get_db)
):
    """휴대전화 인증이 완료되면 해당 계정의 이메일을 반환합니다."""
    user = find_user_by_name_and_phone(
        name=email_find_data.name,
        phone=email_find_data.phone,
        db=db,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with provided name and phone"
        )

    try:
        verified = await verify_verification_code_with_octomo(email_find_data.phone)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OCTOMO API verification failed",
        ) from error
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone verification is required"
        )

    return EmailFindVerifyResponse(email=user.user_id)


@router.post("/password-reset/check", response_model=PasswordResetCheckResponse)
async def check_password_reset_account(
    reset_data: PasswordResetVerify,
    db: Session = Depends(get_db)
):
    """비밀번호 찾기 전에 이메일, 이름, 휴대전화 번호가 모두 일치하는지 확인합니다."""
    normalized_phone = normalize_phone_number(reset_data.phone)
    user = db.query(User).filter(
        User.user_id == reset_data.user_id,
        User.name == reset_data.name,
    ).first()

    exists = bool(user and normalize_phone_number(user.phone) == normalized_phone)
    return PasswordResetCheckResponse(exists=exists)


@router.post("/password-reset/verify", response_model=PasswordResetVerifyResponse)
async def verify_password_reset(
    reset_data: PasswordResetVerify,
    db: Session = Depends(get_db)
):
    """회원 정보와 휴대전화 인증을 확인한 뒤 비밀번호 재설정 토큰을 발급합니다."""
    normalized_phone = normalize_phone_number(reset_data.phone)
    user = db.query(User).filter(
        User.user_id == reset_data.user_id,
        User.name == reset_data.name,
    ).first()

    if not user or normalize_phone_number(user.phone) != normalized_phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with provided email, name and phone"
        )

    try:
        verified = await verify_verification_code_with_octomo(reset_data.phone)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OCTOMO API verification failed",
        ) from error
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone verification is required"
        )

    return PasswordResetVerifyResponse(reset_token=create_password_reset_token(user))


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """재설정 토큰이 유효할 때 새 비밀번호로 변경합니다."""
    if reset_data.new_password != reset_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirm password do not match"
        )

    user = get_password_reset_user(reset_data.reset_token, db)
    if verify_password(reset_data.new_password, user.user_pw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )

    user.user_pw = get_password_hash(reset_data.new_password)
    db.commit()

    return {"message": "Password has been reset successfully"}


