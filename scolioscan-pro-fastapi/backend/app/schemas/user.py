from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict
from datetime import datetime
from uuid import UUID


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


class PasswordReset(BaseModel):
    user_id: EmailStr
    name: str


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
    setting: Dict
    is_admin: bool = False  # 관리자 여부
    created_at: datetime

    class Config:
        from_attributes = True
