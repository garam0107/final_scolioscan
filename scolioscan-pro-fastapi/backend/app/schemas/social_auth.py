from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


SocialProvider = Literal["google", "kakao", "naver"]
SocialVerifyStatus = Literal["linked", "need_account_decision"]


class GoogleVerifyRequest(BaseModel):
    id_token: str = Field(..., min_length=1)


class KakaoVerifyRequest(BaseModel):
    code: str = Field(..., min_length=1)


class NaverVerifyRequest(BaseModel):
    code: str = Field(..., min_length=1)
    state: str = Field(..., min_length=1)


class SocialVerifyResponse(BaseModel):
    status: SocialVerifyStatus
    provider: SocialProvider
    provider_user_id: str
    provider_email: Optional[EmailStr] = None
    linked_user_id: Optional[str] = None
    social_temp_token: Optional[str] = None
    verified_at: datetime
