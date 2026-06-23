from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


SocialProvider = Literal["google", "kakao", "naver"]
SocialTicketExchangeStatus = Literal["login_success", "need_account_decision"]


class GoogleVerifyRequest(BaseModel):
    id_token: str = Field(..., min_length=1)
    device_id: str = Field(..., min_length=1, max_length=128)
    device_name: str = Field(..., min_length=1, max_length=128)


class KakaoVerifyRequest(BaseModel):
    access_token: str = Field(..., min_length=1)
    device_id: str = Field(..., min_length=1, max_length=128)
    device_name: str = Field(..., min_length=1, max_length=128)


class NaverVerifyRequest(BaseModel):
    access_token: str = Field(..., min_length=1)
    device_id: str = Field(..., min_length=1, max_length=128)
    device_name: str = Field(..., min_length=1, max_length=128)


class SocialLinkExistingRequest(BaseModel):
    social_temp_token: str = Field(..., min_length=1)
    user_id: EmailStr
    user_pw: str = Field(..., min_length=8, max_length=128)
    device_id: str = Field(..., min_length=1, max_length=128)
    device_name: str = Field(..., min_length=1, max_length=128)


class SocialLinkCurrentRequest(BaseModel):
    social_temp_token: str = Field(..., min_length=1)


class SocialSignupRequest(BaseModel):
    social_temp_token: str = Field(..., min_length=1)
    user_id: EmailStr
    user_pw: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=1, max_length=32)
    phone: str
    birthday: datetime
    sex: bool
    address: str
    detail_address: Optional[str] = None
    device_id: str = Field(..., min_length=1, max_length=128)
    device_name: str = Field(..., min_length=1, max_length=128)


class SocialTicketExchangeResponse(BaseModel):
    status: SocialTicketExchangeStatus
    provider: SocialProvider
    provider_user_id: str
    provider_email: Optional[EmailStr] = None
    linked_user_id: Optional[str] = None
    social_temp_token: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: Optional[str] = None
    user_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    verified_at: datetime
