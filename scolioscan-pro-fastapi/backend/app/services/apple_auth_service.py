from __future__ import annotations

from datetime import datetime, timedelta, timezone
import time

from cryptography.fernet import Fernet, InvalidToken
import httpx
from fastapi import HTTPException, status
from jose import JWTError, jwt

from ..config import settings


APPLE_ISSUER = "https://appleid.apple.com"
APPLE_JWKS_URL = f"{APPLE_ISSUER}/auth/keys"
APPLE_TOKEN_URL = f"{APPLE_ISSUER}/auth/token"
APPLE_REVOKE_URL = f"{APPLE_ISSUER}/auth/revoke"
APPLE_JWKS_CACHE_SECONDS = 3600

_apple_jwks: dict | None = None
_apple_jwks_expires_at = 0.0


def _required_setting(name: str, value: str) -> str:
    if value.strip():
        return value.strip()

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=f"{name} is not configured",
    )


def _get_apple_token_cipher() -> Fernet:
    encryption_key = _required_setting(
        "APPLE_TOKEN_ENCRYPTION_KEY",
        settings.APPLE_TOKEN_ENCRYPTION_KEY,
    )
    try:
        return Fernet(encryption_key.encode("utf-8"))
    except (TypeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="APPLE_TOKEN_ENCRYPTION_KEY is invalid",
        ) from error


def encrypt_apple_refresh_token(refresh_token: str) -> str:
    # Apple refresh token은 평문으로 저장하지 않고 전용 Fernet 키로 암호화한다.
    return _get_apple_token_cipher().encrypt(refresh_token.encode("utf-8")).decode("utf-8")


def decrypt_apple_refresh_token(encrypted_refresh_token: str) -> str:
    try:
        return _get_apple_token_cipher().decrypt(
            encrypted_refresh_token.encode("utf-8")
        ).decode("utf-8")
    except InvalidToken as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stored Apple refresh token could not be decrypted",
        ) from error


def create_apple_client_secret() -> str:
    team_id = _required_setting("APPLE_TEAM_ID", settings.APPLE_TEAM_ID)
    key_id = _required_setting("APPLE_KEY_ID", settings.APPLE_KEY_ID)
    client_id = _required_setting("APPLE_CLIENT_ID", settings.APPLE_CLIENT_ID)
    private_key = _required_setting("APPLE_PRIVATE_KEY", settings.APPLE_PRIVATE_KEY)
    normalized_private_key = private_key.replace("\\n", "\n")
    now = datetime.now(timezone.utc)

    try:
        return jwt.encode(
            {
                "iss": team_id,
                "iat": now,
                "exp": now + timedelta(minutes=5),
                "aud": APPLE_ISSUER,
                "sub": client_id,
            },
            normalized_private_key,
            algorithm="ES256",
            headers={"kid": key_id},
        )
    except (JWTError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Apple client secret could not be created",
        ) from error


async def _get_apple_jwks(force_refresh: bool = False) -> dict:
    global _apple_jwks, _apple_jwks_expires_at

    if (
        not force_refresh
        and _apple_jwks is not None
        and time.monotonic() < _apple_jwks_expires_at
    ):
        return _apple_jwks

    try:
        async with httpx.AsyncClient(
            timeout=settings.SOCIAL_AUTH_HTTP_TIMEOUT_SECONDS
        ) as client:
            response = await client.get(APPLE_JWKS_URL)
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Apple public key request failed",
        ) from error

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Apple public key request failed",
        )

    try:
        payload = response.json()
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Apple returned invalid public keys",
        ) from error

    if not isinstance(payload, dict) or not isinstance(payload.get("keys"), list):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Apple returned invalid public keys",
        )

    _apple_jwks = payload
    _apple_jwks_expires_at = time.monotonic() + APPLE_JWKS_CACHE_SECONDS
    return payload


async def verify_apple_identity(identity_token: str) -> tuple[str, str | None]:
    try:
        token_header = jwt.get_unverified_header(identity_token)
    except JWTError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Apple identity_token",
        ) from error

    key_id = token_header.get("kid")
    algorithm = token_header.get("alg")
    if not isinstance(key_id, str) or algorithm != "RS256":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Apple identity_token header",
        )

    jwks = await _get_apple_jwks()
    matching_key = next(
        (key for key in jwks["keys"] if isinstance(key, dict) and key.get("kid") == key_id),
        None,
    )
    if matching_key is None:
        jwks = await _get_apple_jwks(force_refresh=True)
        matching_key = next(
            (key for key in jwks["keys"] if isinstance(key, dict) and key.get("kid") == key_id),
            None,
        )

    if matching_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Apple signing key was not found",
        )

    client_id = _required_setting("APPLE_CLIENT_ID", settings.APPLE_CLIENT_ID)
    try:
        payload = jwt.decode(
            identity_token,
            matching_key,
            algorithms=["RS256"],
            audience=client_id,
            issuer=APPLE_ISSUER,
        )
    except JWTError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Apple identity_token",
        ) from error

    provider_user_id = payload.get("sub")
    if not isinstance(provider_user_id, str) or not provider_user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Apple identity_token does not contain sub",
        )

    email = payload.get("email")
    provider_email = email if isinstance(email, str) and email.strip() else None
    return provider_user_id, provider_email


async def exchange_apple_authorization_code(authorization_code: str) -> dict:
    client_id = _required_setting("APPLE_CLIENT_ID", settings.APPLE_CLIENT_ID)
    try:
        async with httpx.AsyncClient(
            timeout=settings.SOCIAL_AUTH_HTTP_TIMEOUT_SECONDS
        ) as client:
            response = await client.post(
                APPLE_TOKEN_URL,
                data={
                    "client_id": client_id,
                    "client_secret": create_apple_client_secret(),
                    "code": authorization_code,
                    "grant_type": "authorization_code",
                },
            )
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Apple authorization code exchange failed",
        ) from error

    try:
        payload = response.json()
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Apple returned an invalid token response",
        ) from error

    if response.status_code != status.HTTP_200_OK or not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Apple authorization_code",
        )

    refresh_token = payload.get("refresh_token")
    identity_token = payload.get("id_token")
    if not isinstance(refresh_token, str) or not refresh_token.strip():
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Apple token response does not contain refresh_token",
        )
    if not isinstance(identity_token, str) or not identity_token.strip():
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Apple token response does not contain id_token",
        )

    return payload


async def revoke_apple_refresh_token(encrypted_refresh_token: str) -> None:
    client_id = _required_setting("APPLE_CLIENT_ID", settings.APPLE_CLIENT_ID)
    refresh_token = decrypt_apple_refresh_token(encrypted_refresh_token)
    try:
        async with httpx.AsyncClient(
            timeout=settings.SOCIAL_AUTH_HTTP_TIMEOUT_SECONDS
        ) as client:
            response = await client.post(
                APPLE_REVOKE_URL,
                data={
                    "client_id": client_id,
                    "client_secret": create_apple_client_secret(),
                    "token": refresh_token,
                    "token_type_hint": "refresh_token",
                },
            )
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Apple token revocation failed",
        ) from error

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Apple token revocation failed",
        )
