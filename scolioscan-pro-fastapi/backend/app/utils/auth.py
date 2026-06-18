from datetime import datetime, timedelta
from typing import Optional
import hashlib
import hmac
import secrets
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..config import settings
from ..database import get_db
from ..models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def _preprocess_password(password: str) -> str:
    """
    비밀번호를 전처리하여 bcrypt의 72바이트 제한을 우회합니다.
    SHA256으로 먼저 해싱하여 고정 길이로 만듭니다.
    """
    # SHA256으로 해싱 (항상 64자의 hex string이 됨)
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    # 비밀번호를 전처리한 후 검증
    preprocessed = _preprocess_password(plain_password)
    return pwd_context.verify(preprocessed, hashed_password)


def get_password_hash(password: str) -> str:
    """비밀번호 해싱"""
    # 비밀번호를 전처리한 후 bcrypt로 해싱
    preprocessed = _preprocess_password(password)
    return pwd_context.hash(preprocessed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """JWT 액세스 토큰 생성"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token() -> tuple[str, str]:
    """클라이언트에만 내려줄 refresh token 원문과 token_id를 함께 생성한다."""
    token_id = secrets.token_urlsafe(24)
    token_secret = secrets.token_urlsafe(48)
    return f"{token_id}.{token_secret}", token_id


def parse_refresh_token(raw_token: str) -> tuple[str, str]:
    """저장 조회에 사용할 token_id와 검증용 secret 부분을 분리한다."""
    token_id, separator, token_secret = raw_token.partition(".")
    if not token_id or not separator or not token_secret:
        raise ValueError("Invalid refresh token format")
    return token_id, token_secret


def hash_refresh_token(raw_token: str) -> str:
    """서버 secret 기반 HMAC으로 refresh token 원문을 해시한다."""
    return hmac.new(
        settings.REFRESH_TOKEN_SECRET.encode("utf-8"),
        raw_token.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_refresh_token_hash(raw_token: str, token_hash: str) -> bool:
    """DB의 해시와 안전하게 비교해 위조된 토큰을 걸러낸다."""
    return hmac.compare_digest(hash_refresh_token(raw_token), token_hash)


def build_refresh_token_expiry() -> datetime:
    """refresh token 만료 시각을 한 곳에서 계산한다."""
    return datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    
    print("[auth] get_current_user token =", token, flush=True)
    print("[auth] auth file =", __file__, flush=True)
    """현재 로그인한 사용자 정보 가져오기"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        print("[auth] decoded payload =", payload)
        print("[auth] payload sub =", payload.get("sub"))
        user_id: str = payload.get("sub")
        print("[auth] querying user by user_id =", user_id)
        if user_id is None:
            raise credentials_exception
    except JWTError:
        print("[auth] jwt decode error =", error)
        raise credentials_exception

    user = db.query(User).filter(User.user_id == user_id).first()
    print("[auth] queried user =", user)
    if user is None:
        raise credentials_exception

    return user
