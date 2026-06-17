from __future__ import annotations

import asyncio
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from ..config import settings
from ..models import SocialAccount, User
from ..schemas import SocialTicketExchangeResponse, SocialVerifyResponse


GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token"
KAKAO_ME_URL = "https://kapi.kakao.com/v2/user/me"
NAVER_TOKEN_URL = "https://nid.naver.com/oauth2.0/token"
NAVER_PROFILE_URL = "https://openapi.naver.com/v1/nid/me"
SOCIAL_TEMP_TOKEN_TYPE = "social_temp"
KAKAO_AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize"
NAVER_AUTHORIZE_URL = "https://nid.naver.com/oauth2.0/authorize"


@dataclass
class PendingSocialOauthState:
    provider: str
    expires_at: datetime


@dataclass
class OneTimeSocialTicket:
    provider: str
    provider_user_id: str
    provider_email: str | None
    expires_at: datetime


_pending_oauth_states: dict[str, PendingSocialOauthState] = {}
_pending_oauth_states_lock = asyncio.Lock()
_one_time_social_tickets: dict[str, OneTimeSocialTicket] = {}
_one_time_social_tickets_lock = asyncio.Lock()


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


def build_social_verify_response(
    provider: str,
    provider_user_id: str,
    provider_email: str | None,
    social_account: SocialAccount | None,
) -> SocialVerifyResponse:
    """미연결 소셜 계정이면 다음 단계에서 재사용할 임시 토큰을 함께 반환한다."""
    social_temp_token = None
    response_status = "linked"

    if social_account is None:
        response_status = "need_account_decision"
        social_temp_token = create_social_temp_token(
            provider=provider,
            provider_user_id=provider_user_id,
            provider_email=provider_email,
        )

    return SocialVerifyResponse(
        status=response_status,
        provider=provider,
        provider_user_id=provider_user_id,
        provider_email=provider_email,
        linked_user_id=str(social_account.user_id) if social_account else None,
        social_temp_token=social_temp_token,
        verified_at=datetime.now(timezone.utc),
    )


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


async def create_oauth_state(provider: str) -> str:
    """OAuth 시작과 callback을 안전하게 이어주기 위해 짧은 만료시간의 state를 저장한다."""
    state_value = secrets.token_urlsafe(24)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.SOCIAL_OAUTH_STATE_EXPIRE_MINUTES)

    async with _pending_oauth_states_lock:
        _cleanup_expired_oauth_states_locked()
        _pending_oauth_states[state_value] = PendingSocialOauthState(
            provider=provider,
            expires_at=expires_at,
        )

    return state_value


async def consume_oauth_state_or_401(provider: str, state_value: str) -> None:
    """Callback에 도착한 state가 해당 공급자에서 발급한 값인지 확인하고 즉시 소비한다."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired oauth state",
    )

    async with _pending_oauth_states_lock:
        _cleanup_expired_oauth_states_locked()
        pending_state = _pending_oauth_states.pop(state_value, None)

    if pending_state is None:
        raise credentials_exception

    if pending_state.provider != provider:
        raise credentials_exception


def build_kakao_oauth_start_url(state_value: str) -> str:
    """카카오 로그인 화면으로 보낼 authorize URL을 만든다."""
    query = urlencode(
        {
            "response_type": "code",
            "client_id": settings.KAKAO_REST_API_KEY,
            "redirect_uri": settings.KAKAO_REDIRECT_URI,
            "state": state_value,
        }
    )
    return f"{KAKAO_AUTHORIZE_URL}?{query}"


def build_naver_oauth_start_url(state_value: str) -> str:
    """네이버 로그인 화면으로 보낼 authorize URL을 만든다."""
    query = urlencode(
        {
            "response_type": "code",
            "client_id": settings.NAVER_CLIENT_ID,
            "redirect_uri": settings.NAVER_REDIRECT_URI,
            "state": state_value,
        }
    )
    return f"{NAVER_AUTHORIZE_URL}?{query}"


async def create_one_time_social_ticket(
    provider: str,
    provider_user_id: str,
    provider_email: str | None,
) -> str:
    """Callback 이후 앱으로 복귀할 때만 잠깐 쓰는 1회용 ticket을 저장한다."""
    ticket = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.SOCIAL_ONE_TIME_TICKET_EXPIRE_MINUTES)

    async with _one_time_social_tickets_lock:
        _cleanup_expired_social_tickets_locked()
        _one_time_social_tickets[ticket] = OneTimeSocialTicket(
            provider=provider,
            provider_user_id=provider_user_id,
            provider_email=provider_email,
            expires_at=expires_at,
        )

    return ticket


async def consume_one_time_social_ticket_or_401(ticket: str) -> dict:
    """앱이 전달한 1회용 ticket을 검증하고 즉시 소비한다."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired social login ticket",
    )

    async with _one_time_social_tickets_lock:
        _cleanup_expired_social_tickets_locked()
        ticket_payload = _one_time_social_tickets.pop(ticket, None)

    if ticket_payload is None:
        raise credentials_exception

    return {
        "provider": ticket_payload.provider,
        "provider_user_id": ticket_payload.provider_user_id,
        "provider_email": ticket_payload.provider_email,
    }


def build_app_oauth_redirect_url(
    provider: str,
    ticket: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
) -> str:
    """브라우저 callback 완료 후 앱 deep link로 돌아갈 URL을 만든다."""
    base_url = settings.APP_OAUTH_RETURN_BASE.rstrip("/")
    query: dict[str, str] = {}
    if ticket is not None:
        query["ticket"] = ticket
    if error is not None:
        query["error"] = error
    if error_description is not None:
        query["error_description"] = error_description

    query_string = urlencode(query)
    if query_string:
        return f"{base_url}/{provider}?{query_string}"
    return f"{base_url}/{provider}"


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


def _cleanup_expired_oauth_states_locked() -> None:
    now = datetime.utcnow()
    expired_states = [
        state_value
        for state_value, pending_state in _pending_oauth_states.items()
        if pending_state.expires_at <= now
    ]
    for state_value in expired_states:
        _pending_oauth_states.pop(state_value, None)


def _cleanup_expired_social_tickets_locked() -> None:
    now = datetime.utcnow()
    expired_tickets = [
        ticket
        for ticket, ticket_payload in _one_time_social_tickets.items()
        if ticket_payload.expires_at <= now
    ]
    for ticket in expired_tickets:
        _one_time_social_tickets.pop(ticket, None)


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


async def exchange_kakao_code(code: str) -> tuple[str, str | None]:
    """카카오 code를 access_token으로 교환한 뒤 사용자 식별자와 이메일을 가져온다."""
    form_data = {
        "grant_type": "authorization_code",
        "client_id": settings.KAKAO_REST_API_KEY,
        # 카카오 시크릿 사용이 활성화된 운영 설정에 맞춰 항상 포함한다.
        "client_secret": settings.KAKAO_CLIENT_SECRET,
        "redirect_uri": settings.KAKAO_REDIRECT_URI,
        "code": code,
    }

    try:
        async with httpx.AsyncClient(timeout=settings.SOCIAL_AUTH_HTTP_TIMEOUT_SECONDS) as client:
            token_response = await client.post(
                KAKAO_TOKEN_URL,
                data=form_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            token_payload = parse_provider_json_response(token_response, "Kakao")
            if token_response.status_code != status.HTTP_200_OK:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=extract_provider_error_message(token_payload, "Kakao token exchange failed"),
                )

            access_token = token_payload.get("access_token")
            if not isinstance(access_token, str) or not access_token.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Kakao token response does not contain access_token",
                )

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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=extract_provider_error_message(profile_payload, "Kakao profile request failed"),
        )

    provider_user_id = profile_payload.get("id")
    if provider_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kakao profile does not contain id",
        )

    kakao_account = profile_payload.get("kakao_account") if isinstance(profile_payload, dict) else None
    provider_email = None
    if isinstance(kakao_account, dict):
        email = kakao_account.get("email")
        if isinstance(email, str) and email.strip():
            provider_email = email

    return str(provider_user_id), provider_email


async def exchange_naver_code(code: str, state_value: str) -> tuple[str, str | None]:
    """네이버 code/state를 검증해 프로필 기준 식별자와 이메일을 가져온다."""
    query = {
        "grant_type": "authorization_code",
        "client_id": settings.NAVER_CLIENT_ID,
        "client_secret": settings.NAVER_CLIENT_SECRET,
        "redirect_uri": settings.NAVER_REDIRECT_URI,
        "code": code,
        "state": state_value,
    }

    try:
        async with httpx.AsyncClient(timeout=settings.SOCIAL_AUTH_HTTP_TIMEOUT_SECONDS) as client:
            token_response = await client.get(NAVER_TOKEN_URL, params=query)
            token_payload = parse_provider_json_response(token_response, "Naver")
            if token_response.status_code != status.HTTP_200_OK:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=extract_provider_error_message(token_payload, "Naver token exchange failed"),
                )

            access_token = token_payload.get("access_token")
            if not isinstance(access_token, str) or not access_token.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Naver token response does not contain access_token",
                )

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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=extract_provider_error_message(profile_payload, "Naver profile request failed"),
        )

    response_payload = profile_payload.get("response") if isinstance(profile_payload, dict) else None
    if not isinstance(response_payload, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Naver profile response is invalid",
        )

    provider_user_id = response_payload.get("id")
    if not isinstance(provider_user_id, str) or not provider_user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Naver profile does not contain id",
        )

    email = response_payload.get("email")
    provider_email = email if isinstance(email, str) and email.strip() else None
    return provider_user_id, provider_email
