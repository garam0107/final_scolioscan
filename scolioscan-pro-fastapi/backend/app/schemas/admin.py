from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# =====================
# 고객 관리 스키마
# =====================

class AdminUserResponse(BaseModel):
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
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    detail_address: Optional[str] = None
    birthday: Optional[datetime] = None
    sex: Optional[bool] = None
    is_admin: Optional[bool] = None


# =====================
# 이메일 발송 스키마
# =====================

class AdminEmailRequest(BaseModel):
    subject: str
    content: str
    send_to_all: bool = False
    customer_ids: Optional[List[UUID]] = None
