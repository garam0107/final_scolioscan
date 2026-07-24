from datetime import datetime
from typing import Dict, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    user_id: EmailStr
    user_pw: str = Field(..., min_length=8, max_length=128, description="비밀번호 (8-128자)")
    name: str = Field(..., min_length=1, max_length=32)
    phone: str
    birthday: datetime
    sex: bool  # True: Male, False: Female
    address: str
    detail_address: Optional[str] = None


class UserLogin(BaseModel):
    user_id: EmailStr
    user_pw: str
    device_id: str = Field(..., min_length=1, max_length=128)
    device_name: str = Field(..., min_length=1, max_length=128)


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    email: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LogoutRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


class PasswordResetVerify(BaseModel):
    user_id: EmailStr
    name: str = Field(..., min_length=1, max_length=32)
    phone: str = Field(..., min_length=10, max_length=20)


class PasswordResetCheckResponse(BaseModel):
    exists: bool


class PasswordResetVerifyResponse(BaseModel):
    reset_token: str
    token_type: str = "password_reset"


class PasswordResetConfirm(BaseModel):
    reset_token: str
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)


class EmailFindRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=32)
    phone: str = Field(..., min_length=10, max_length=20)


class EmailFindCheckResponse(BaseModel):
    exists: bool


class EmailFindVerifyResponse(BaseModel):
    email: str


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=6, max_length=128, description="현재 비밀번호")
    new_password: str = Field(..., min_length=6, max_length=128, description="새 비밀번호 (6-128자)")
    confirm_password: str = Field(..., min_length=6, max_length=128, description="새 비밀번호 확인")


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    detail_address: Optional[str] = None
    birthday: Optional[datetime] = None
    sex: Optional[bool] = None  # True: Male, False: Female


class UserDeleteRequest(BaseModel):
    password: str = Field(..., min_length=1, max_length=128)


class SocialAccountInfo(BaseModel):
    is_linked: bool
    email: Optional[str] = None


class UserSocialAccountsResponse(BaseModel):
    google: SocialAccountInfo
    naver: SocialAccountInfo
    kakao: SocialAccountInfo


class UserResponse(BaseModel):
    id: UUID
    user_id: str
    name: str
    phone: str
    birthday: datetime
    sex: bool
    address: str
    detail_address: Optional[str]
    profile_image: Optional[str]
    alarm_count: int
    curvature_limit: int
    curvature_limit_reset_at: datetime
    setting: Dict
    is_admin: bool = False  # 관리자 여부
    created_at: datetime
    social_accounts: UserSocialAccountsResponse

    class Config:
        from_attributes = True
