from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import RefreshToken, User
from ..schemas import (
    EmailFindCheckResponse,
    EmailFindRequest,
    EmailFindVerifyResponse,
    LoginResponse,
    LogoutRequest,
    OctomoIssueCodeRequest,
    OctomoIssueCodeResponse,
    OctomoVerifyRequest,
    OctomoVerifyResponse,
    PasswordResetCheckResponse,
    PasswordResetConfirm,
    PasswordResetVerify,
    PasswordResetVerifyResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    UserCreate,
    UserLogin,
)
from ..services.octomo_verification import (
    issue_verification_code,
    normalize_phone_number,
    verify_verification_code_with_octomo,
)
from ..utils import (
    build_refresh_token_expiry,
    create_access_token,
    create_refresh_token,
    get_password_hash,
    hash_refresh_token,
    parse_refresh_token,
    verify_password,
    verify_refresh_token_hash,
)

router = APIRouter()
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = 10
PASSWORD_RESET_TOKEN_TYPE = "password_reset"


def utcnow() -> datetime:
    return datetime.utcnow()


def create_password_reset_token(user: User) -> str:
    """비밀번호 재설정 전용 JWT를 짧은 만료 시간으로 발급한다."""
    expire = utcnow() + timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user.user_id,
        "user_id": str(user.id),
        "type": PASSWORD_RESET_TOKEN_TYPE,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_password_reset_user(reset_token: str, db: Session) -> User:
    """재설정 토큰을 검증하고 대상 사용자를 조회한다."""
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
    """이름과 전화번호가 모두 일치하는 사용자를 찾는다."""
    normalized_phone = normalize_phone_number(phone)
    users = db.query(User).filter(User.name == name).all()

    for user in users:
        if normalize_phone_number(user.phone) == normalized_phone:
            return user

    return None


def revoke_all_active_refresh_tokens(db: Session, user: User, revoked_at: datetime) -> None:
    """보안상 세션을 모두 끊어야 할 때 활성 refresh token을 일괄 폐기한다."""
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked_at.is_(None),
    ).update(
        {
            RefreshToken.revoked_at: revoked_at,
            RefreshToken.last_used_at: revoked_at,
        },
        synchronize_session=False,
    )


def issue_refresh_token(
    db: Session,
    user: User,
    device_id: str,
    device_name: str,
) -> tuple[str, RefreshToken]:
    """클라이언트 원문과 DB 저장용 해시 레코드를 함께 만든다."""
    raw_refresh_token, token_id = create_refresh_token()
    refresh_token = RefreshToken(
        user_id=user.id,
        token_id=token_id,
        token_hash=hash_refresh_token(raw_refresh_token),
        device_id=device_id,
        device_name=device_name,
        expires_at=build_refresh_token_expiry(),
    )
    db.add(refresh_token)
    return raw_refresh_token, refresh_token


def get_refresh_token_or_401(db: Session, raw_refresh_token: str) -> RefreshToken:
    """token_id 조회 뒤 해시를 대조해 refresh token 원문 저장 없이 검증한다."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
    )

    try:
        token_id, _ = parse_refresh_token(raw_refresh_token)
    except ValueError:
        raise credentials_exception

    refresh_token = db.query(RefreshToken).filter(RefreshToken.token_id == token_id).first()
    if not refresh_token:
        raise credentials_exception

    if not verify_refresh_token_hash(raw_refresh_token, refresh_token.token_hash):
        raise credentials_exception

    return refresh_token


def ensure_refresh_token_is_active(refresh_token: RefreshToken) -> None:
    """폐기되었거나 만료된 refresh token 재사용을 막는다."""
    now = utcnow()
    if refresh_token.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )
    if refresh_token.expires_at <= now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )


def build_login_response(user: User, access_token: str, refresh_token: str) -> LoginResponse:
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=str(user.id),
        name=user.name,
        email=user.user_id,
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """회원가입"""
    existing_user = db.query(User).filter(User.user_id == user_data.user_id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed_password = get_password_hash(user_data.user_pw)

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
        setting={"voice_alarm": False},
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {"message": "User created successfully", "user_id": str(db_user.id)}


@router.post("/login", response_model=LoginResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """로그인"""
    user = db.query(User).filter(User.user_id == user_data.user_id).first()

    if not user or not verify_password(user_data.user_pw, user.user_pw):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # 로그인 시 access/refresh token을 함께 발급하고 DB에는 refresh hash만 남긴다.
    access_token = create_access_token(data={"sub": user.user_id})
    refresh_token, _ = issue_refresh_token(
        db=db,
        user=user,
        device_id=user_data.device_id,
        device_name=user_data.device_name,
    )

    db.commit()

    return build_login_response(user, access_token, refresh_token)


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_tokens(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """refresh token rotation으로 새 access/refresh token 쌍을 발급한다."""
    current_token = get_refresh_token_or_401(db, payload.refresh_token)
    ensure_refresh_token_is_active(current_token)

    user = db.get(User, current_token.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    now = utcnow()
    new_refresh_token, new_refresh_row = issue_refresh_token(
        db=db,
        user=user,
        device_id=current_token.device_id,
        device_name=current_token.device_name,
    )

    current_token.revoked_at = now
    current_token.last_used_at = now
    current_token.replaced_by_token_id = new_refresh_row.token_id

    access_token = create_access_token(data={"sub": user.user_id})
    db.commit()

    return RefreshTokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
    )


@router.post("/logout")
async def logout(payload: LogoutRequest, db: Session = Depends(get_db)):
    """클라이언트가 보낸 refresh token을 서버에서 폐기한다."""
    refresh_token = get_refresh_token_or_401(db, payload.refresh_token)
    ensure_refresh_token_is_active(refresh_token)

    now = utcnow()
    refresh_token.revoked_at = now
    refresh_token.last_used_at = now
    db.commit()

    return {"message": "Logged out successfully"}


@router.get("/check-email/{email}")
async def check_email(email: str, db: Session = Depends(get_db)):
    """이메일 중복 확인"""
    existing_user = db.query(User).filter(User.user_id == email).first()
    return {"exists": existing_user is not None}


@router.get("/check-phone/{phone}")
async def check_phone(phone: str, db: Session = Depends(get_db)):
    """전화번호 중복 확인"""
    existing_user_phone = db.query(User).filter(User.phone == phone).first()
    return {"exists": existing_user_phone is not None}


@router.post("/issue-code", response_model=OctomoIssueCodeResponse)
async def issue_phone_verification_code(payload: OctomoIssueCodeRequest):
    """전화번호 인증 코드를 발급한다."""
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
    """OCTOMO를 통해 인증 여부를 확인한다."""
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
    db: Session = Depends(get_db),
):
    """이메일 찾기 전에 이름과 전화번호가 일치하는 계정이 있는지 확인한다."""
    user = find_user_by_name_and_phone(
        name=email_find_data.name,
        phone=email_find_data.phone,
        db=db,
    )

    return EmailFindCheckResponse(exists=user is not None)


@router.post("/email-find/verify", response_model=EmailFindVerifyResponse)
async def verify_email_find(
    email_find_data: EmailFindRequest,
    db: Session = Depends(get_db),
):
    """전화번호 인증이 끝나면 해당 계정의 이메일을 반환한다."""
    user = find_user_by_name_and_phone(
        name=email_find_data.name,
        phone=email_find_data.phone,
        db=db,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with provided name and phone",
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
            detail="Phone verification is required",
        )

    return EmailFindVerifyResponse(email=user.user_id)


@router.post("/password-reset/check", response_model=PasswordResetCheckResponse)
async def check_password_reset_account(
    reset_data: PasswordResetVerify,
    db: Session = Depends(get_db),
):
    """비밀번호 찾기 전에 이메일, 이름, 전화번호가 모두 일치하는지 확인한다."""
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
    db: Session = Depends(get_db),
):
    """회원 정보와 전화번호 인증을 확인하고 비밀번호 재설정 토큰을 발급한다."""
    normalized_phone = normalize_phone_number(reset_data.phone)
    user = db.query(User).filter(
        User.user_id == reset_data.user_id,
        User.name == reset_data.name,
    ).first()

    if not user or normalize_phone_number(user.phone) != normalized_phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with provided email, name and phone",
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
            detail="Phone verification is required",
        )

    return PasswordResetVerifyResponse(reset_token=create_password_reset_token(user))


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    """재설정 토큰이 유효하면 새 비밀번호로 변경한다."""
    if reset_data.new_password != reset_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirm password do not match",
        )

    user = get_password_reset_user(reset_data.reset_token, db)
    if verify_password(reset_data.new_password, user.user_pw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )

    # 비밀번호 재설정 이후에는 남아 있는 세션을 모두 끊어 이전 refresh token 재사용을 막는다.
    user.user_pw = get_password_hash(reset_data.new_password)
    revoke_all_active_refresh_tokens(db, user, utcnow())
    db.commit()

    return {"message": "Password has been reset successfully"}
