from datetime import datetime, timedelta

from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from ..config import settings
from ..models import RefreshToken, User
from ..schemas import LoginResponse
from ..services.octomo_verification import normalize_phone_number
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
    """비밀번호 재설정 토큰을 검증하고 대상 사용자를 조회한다."""
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


def find_user_by_name_and_phone(name: str, normalized_phone: str, db: Session) -> User | None:
    """이름과 정규화된 전화번호가 모두 일치하는 사용자를 찾는다."""
    users = db.query(User).filter(User.name == name).all()

    for user in users:
        if normalize_phone_number(user.phone) == normalized_phone:
            return user

    return None


def find_user_by_normalized_phone(normalized_phone: str, db: Session) -> User | None:
    """휴대폰 번호 포맷 차이를 무시하고 기존 가입 여부를 확인한다."""
    users = db.query(User).all()

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
    """클라이언트용 refresh token 원문과 DB 저장용 해시 레코드를 함께 만든다."""
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
    """기존 로그인 응답 포맷을 한 곳에서 맞춘다."""
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=str(user.id),
        name=user.name,
        email=user.user_id,
    )


def build_password_reset_password_hash(new_password: str) -> str:
    """비밀번호 재설정 시 기존 해시 규칙을 그대로 재사용한다."""
    return get_password_hash(new_password)


def verify_user_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증 로직을 서비스 계층에서 재사용할 수 있게 감싼다."""
    return verify_password(plain_password, hashed_password)
