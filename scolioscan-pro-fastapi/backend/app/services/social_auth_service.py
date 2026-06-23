from __future__ import annotations

from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from ..config import settings
from ..models import SocialAccount, User
from ..schemas import SocialTicketExchangeResponse


GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
KAKAO_ME_URL = "https://kapi.kakao.com/v2/user/me"
NAVER_PROFILE_URL = "https://openapi.naver.com/v1/nid/me"
SOCIAL_TEMP_TOKEN_TYPE = "social_temp"


def extract_provider_error_message(payload: object, default_message: str) -> str:
    """공급자 응답마다 다른 에러 필드를 한 곳에서 정리한다."""
    if not isinstance(payload, dict):
        return default_message

    for key in ("error_description", "error_msg", "msg", "message", "error"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value

    return default_message


def parse_provider_json_response(
    response: httpx.Response,
    provider_name: str,
) -> dict:
    """공급자 응답이 JSON이 아니면 백엔드 내부 오류 대신 502로 정리한다."""
    try:
        payload = response.json()
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"{provider_name} returned an invalid response",
        ) from error

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"{provider_name} returned an invalid response",
        )

    return payload


def get_social_account(
    db: Session,
    provider: str,
    provider_user_id: str,
) -> SocialAccount | None:
    """소셜 계정 연결 여부는 이메일이 아니라 provider와 provider_user_id로만 판단한다."""
    return db.query(SocialAccount).filter(
        SocialAccount.provider == provider,
        SocialAccount.provider_user_id == provider_user_id,
    ).first()


def create_social_temp_token(
    provider: str,
    provider_user_id: str,
    provider_email: str | None,
) -> str:
    """소셜 검증 이후 계정 연결 또는 신규 가입 단계로 넘길 임시 JWT를 발급한다."""
    expire = datetime.utcnow() + timedelta(minutes=settings.SOCIAL_TEMP_TOKEN_EXPIRE_MINUTES)
    payload = {
        "type": SOCIAL_TEMP_TOKEN_TYPE,
        "provider": provider,
        "provider_user_id": provider_user_id,
        "provider_email": provider_email,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_social_temp_token(token: str) -> dict:
    """후속 소셜 연결 API에서 사용할 임시 토큰의 서명과 필수 값을 검증한다."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired social_temp_token",
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as error:
        raise credentials_exception from error

    if payload.get("type") != SOCIAL_TEMP_TOKEN_TYPE:
        raise credentials_exception

    provider = payload.get("provider")
    provider_user_id = payload.get("provider_user_id")
    provider_email = payload.get("provider_email")

    if provider not in {"google", "kakao", "naver"}:
        raise credentials_exception

    if not isinstance(provider_user_id, str) or not provider_user_id.strip():
        raise credentials_exception

    if provider_email is not None and (not isinstance(provider_email, str) or not provider_email.strip()):
        raise credentials_exception

    return {
        "provider": provider,
        "provider_user_id": provider_user_id,
        "provider_email": provider_email,
    }


def ensure_social_account_not_linked(
    db: Session,
    provider: str,
    provider_user_id: str,
) -> None:
    """임시 토큰이 오래 남아 있어도 이미 연결된 소셜 계정이면 후속 처리를 막는다."""
    social_account = get_social_account(
        db=db,
        provider=provider,
        provider_user_id=provider_user_id,
    )
    if social_account is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Social account is already linked",
        )


def ensure_user_provider_not_linked(
    db: Session,
    user: User,
    provider: str,
) -> None:
    """한 계정에 같은 공급자를 중복 연결하지 않도록 미리 차단한다."""
    existing_account = db.query(SocialAccount).filter(
        SocialAccount.user_id == user.id,
        SocialAccount.provider == provider,
    ).first()
    if existing_account is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{provider} is already linked to this user",
        )


def create_social_account(
    db: Session,
    user: User,
    provider: str,
    provider_user_id: str,
    provider_email: str | None,
    linked_at: datetime,
) -> SocialAccount:
    """기존 사용자 또는 신규 사용자 계정에 소셜 연결 정보를 생성한다."""
    social_account = SocialAccount(
        user_id=user.id,
        provider=provider,
        provider_user_id=provider_user_id,
        provider_email=provider_email,
        linked_at=linked_at,
        last_login_at=linked_at,
    )
    db.add(social_account)
    return social_account


def build_social_ticket_exchange_response(
    provider: str,
    provider_user_id: str,
    provider_email: str | None,
    social_account: SocialAccount | None,
    access_token: str | None = None,
    refresh_token: str | None = None,
    user: User | None = None,
) -> SocialTicketExchangeResponse:
    """ticket 교환 결과를 linked 여부에 따라 로그인 성공 또는 계정 선택 단계로 정리한다."""
    if social_account is None:
        social_temp_token = create_social_temp_token(
            provider=provider,
            provider_user_id=provider_user_id,
            provider_email=provider_email,
        )
        return SocialTicketExchangeResponse(
            status="need_account_decision",
            provider=provider,
            provider_user_id=provider_user_id,
            provider_email=provider_email,
            linked_user_id=None,
            social_temp_token=social_temp_token,
            verified_at=datetime.now(timezone.utc),
        )

    return SocialTicketExchangeResponse(
        status="login_success",
        provider=provider,
        provider_user_id=provider_user_id,
        provider_email=provider_email,
        linked_user_id=str(social_account.user_id),
        social_temp_token=None,
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer" if access_token and refresh_token else None,
        user_id=str(user.id) if user is not None else None,
        name=user.name if user is not None else None,
        email=user.user_id if user is not None else None,
        verified_at=datetime.now(timezone.utc),
    )


async def verify_google_identity(id_token: str) -> tuple[str, str | None]:
    """구글 tokeninfo 응답에서 sub와 email을 추출해 1차 검증에 사용한다."""
    try:
        async with httpx.AsyncClient(timeout=settings.SOCIAL_AUTH_HTTP_TIMEOUT_SECONDS) as client:
            response = await client.get(GOOGLE_TOKENINFO_URL, params={"id_token": id_token})
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Google verification request failed",
        ) from error

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google id_token",
        )

    payload = parse_provider_json_response(response, "Google")
    if payload.get("aud") != settings.GOOGLE_WEB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google id_token audience mismatch",
        )

    issuer = payload.get("iss")
    if issuer not in {"accounts.google.com", "https://accounts.google.com"}:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token issuer",
        )

    provider_user_id = payload.get("sub")
    if not isinstance(provider_user_id, str) or not provider_user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google token does not contain sub",
        )

    email = payload.get("email")
    return provider_user_id, email if isinstance(email, str) and email.strip() else None


async def verify_kakao_access_token(access_token: str) -> tuple[str, str | None]:
    """카카오 SDK가 받은 access token으로 프로필을 조회해 식별자와 이메일을 가져온다."""
    try:
        async with httpx.AsyncClient(timeout=settings.SOCIAL_AUTH_HTTP_TIMEOUT_SECONDS) as client:
            profile_response = await client.get(
                KAKAO_ME_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Kakao verification request failed",
        ) from error

    profile_payload = parse_provider_json_response(profile_response, "Kakao")
    if profile_response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=extract_provider_error_message(profile_payload, "Invalid Kakao access_token"),
        )

    provider_user_id = profile_payload.get("id")
    if provider_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kakao profile does not contain id",
        )

    kakao_account = profile_payload.get("kakao_account") if isinstance(profile_payload, dict) else None
    provider_email = None
    if isinstance(kakao_account, dict):
        email = kakao_account.get("email")
        if isinstance(email, str) and email.strip():
            provider_email = email

    return str(provider_user_id), provider_email


async def verify_naver_access_token(access_token: str) -> tuple[str, str | None]:
    """네이버 SDK가 받은 access token으로 프로필을 조회해 식별자와 이메일을 가져온다."""
    try:
        async with httpx.AsyncClient(timeout=settings.SOCIAL_AUTH_HTTP_TIMEOUT_SECONDS) as client:
            profile_response = await client.get(
                NAVER_PROFILE_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Naver verification request failed",
        ) from error

    profile_payload = parse_provider_json_response(profile_response, "Naver")
    if profile_response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=extract_provider_error_message(profile_payload, "Invalid Naver access_token"),
        )

    response_payload = profile_payload.get("response") if isinstance(profile_payload, dict) else None
    if not isinstance(response_payload, dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Naver profile response is invalid",
        )

    provider_user_id = response_payload.get("id")
    if not isinstance(provider_user_id, str) or not provider_user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Naver profile does not contain id",
        )

    email = response_payload.get("email")
    provider_email = email if isinstance(email, str) and email.strip() else None
    return provider_user_id, provider_email
