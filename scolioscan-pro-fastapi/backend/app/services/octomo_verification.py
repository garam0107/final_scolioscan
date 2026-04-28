from __future__ import annotations

import asyncio
import re
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional

import httpx

from ..config import settings


PHONE_NUMBER_PATTERN = re.compile(r"^01[016789]\d{7,8}$")


@dataclass
class VerificationChallenge:
    phone_number: str
    code: str
    issued_at: datetime
    expires_at: datetime


_verification_challenges: dict[str, VerificationChallenge] = {}
_verification_lock = asyncio.Lock()


def normalize_phone_number(phone_number: str) -> str:
    """휴대폰 번호에서 숫자만 남깁니다."""
    return re.sub(r"\D", "", phone_number)


def validate_phone_number(phone_number: str) -> str:
    """휴대폰 번호 형식을 확인하고 정규화된 값을 반환합니다."""
    normalized_phone_number = normalize_phone_number(phone_number)
    if not PHONE_NUMBER_PATTERN.fullmatch(normalized_phone_number):
        raise ValueError("올바른 휴대폰 번호 형식이 아닙니다.")

    return normalized_phone_number


def generate_verification_code(length: int = 6) -> str:
    """6자리 숫자 인증코드를 생성합니다."""
    upper_bound = 10**length
    return f"{secrets.randbelow(upper_bound):0{length}d}"


async def issue_verification_code(phone_number: str) -> VerificationChallenge:
    """휴대폰 번호 기준으로 인증코드를 발급하고 메모리에 저장합니다."""
    normalized_phone_number = validate_phone_number(phone_number)
    now = datetime.utcnow()
    expires_at = now + timedelta(seconds=settings.OCTOMO_VERIFICATION_TTL_SECONDS)

    challenge = VerificationChallenge(
        phone_number=normalized_phone_number,
        code=generate_verification_code(),
        issued_at=now,
        expires_at=expires_at,
    )

    async with _verification_lock:
        _verification_challenges[normalized_phone_number] = challenge

    return challenge


async def get_active_verification_challenge(phone_number: str) -> Optional[VerificationChallenge]:
    """유효한 인증코드가 있는지 확인합니다."""
    normalized_phone_number = validate_phone_number(phone_number)

    async with _verification_lock:
        challenge = _verification_challenges.get(normalized_phone_number)
        if challenge is None:
            return None

        if datetime.utcnow() >= challenge.expires_at:
            _verification_challenges.pop(normalized_phone_number, None)
            return None

        return challenge


async def verify_verification_code_with_octomo(phone_number: str) -> bool:
    """OCTOMO API로 실제 수신 여부를 조회합니다."""
    challenge = await get_active_verification_challenge(phone_number)
    if challenge is None:
        return False

    verified = await _check_octomo_message_exists(
        phone_number=challenge.phone_number,
        code=challenge.code,
    )

    if verified:
        async with _verification_lock:
            _verification_challenges.pop(challenge.phone_number, None)

    return verified


async def _check_octomo_message_exists(phone_number: str, code: str) -> bool:
    """OCTOMO 공용 메시지 조회 API를 호출합니다."""
    if not settings.OCTOMO_API_KEY:
        raise RuntimeError("OCTOMO API Key가 설정되지 않았습니다.")

    base_url = settings.OCTOMO_API_BASE_URL.rstrip("/")
    request_url = f"{base_url}/message/exists"

    headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    settings.OCTOMO_API_KEY_HEADER: f"Octomo {settings.OCTOMO_API_KEY}",
}


    request_body = {
        "mobileNum": phone_number,
        "text": code,
    }

    async with httpx.AsyncClient(timeout=settings.OCTOMO_HTTP_TIMEOUT_SECONDS) as client:
        response = await client.post(request_url, json=request_body, headers=headers)
        response.raise_for_status()

    payload = response.json()
    if isinstance(payload, dict):
        if isinstance(payload.get("exists"), bool):
            return payload["exists"]

        if isinstance(payload.get("verified"), bool):
            return payload["verified"]

        data = payload.get("data")
        if isinstance(data, dict):
            if isinstance(data.get("exists"), bool):
                return data["exists"]
            if isinstance(data.get("verified"), bool):
                return data["verified"]

    raise RuntimeError("OCTOMO 응답에서 exists 또는 verified 값을 확인할 수 없습니다.")

