from datetime import datetime, timezone

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..config import settings
from ..models import SocialAccount
from ..schemas import SocialVerifyResponse


GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token"
KAKAO_ME_URL = "https://kapi.kakao.com/v2/user/me"
NAVER_TOKEN_URL = "https://nid.naver.com/oauth2.0/token"
NAVER_PROFILE_URL = "https://openapi.naver.com/v1/nid/me"


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
    """이번 단계에서는 로그인 대신 linked 여부와 연결된 user_id만 반환한다."""
    return SocialVerifyResponse(
        status="linked" if social_account else "not_linked",
        provider=provider,
        provider_user_id=provider_user_id,
        provider_email=provider_email,
        linked_user_id=str(social_account.user_id) if social_account else None,
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


async def exchange_kakao_code(code: str) -> tuple[str, str | None]:
    """카카오 code를 access_token으로 교환한 뒤 사용자 식별자와 이메일을 가져온다."""
    form_data = {
        "grant_type": "authorization_code",
        "client_id": settings.KAKAO_REST_API_KEY,
        "redirect_uri": settings.KAKAO_REDIRECT_URI,
        "code": code,
    }
    if settings.KAKAO_CLIENT_SECRET:
        form_data["client_secret"] = settings.KAKAO_CLIENT_SECRET

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
