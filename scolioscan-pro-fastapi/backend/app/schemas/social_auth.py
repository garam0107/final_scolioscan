from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


SocialProvider = Literal["google", "kakao", "naver"]
SocialLinkStatus = Literal["linked", "not_linked"]


class GoogleVerifyRequest(BaseModel):
    id_token: str = Field(..., min_length=1)


class KakaoVerifyRequest(BaseModel):
    code: str = Field(..., min_length=1)


class NaverVerifyRequest(BaseModel):
    code: str = Field(..., min_length=1)
    state: str = Field(..., min_length=1)


class SocialVerifyResponse(BaseModel):
    status: SocialLinkStatus
    provider: SocialProvider
    provider_user_id: str
    provider_email: Optional[EmailStr] = None
    linked_user_id: Optional[str] = None
    verified_at: datetime
