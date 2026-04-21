from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class SubscribeTypeResponse(BaseModel):
    id: int
    name: str
    price: int
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SubscribeCreate(BaseModel):
    user_uuid: UUID
    subscribe_card: UUID
    subscribe_type: int
    started_at: datetime
    ended_at: datetime


class SubscribeResponse(BaseModel):
    id: UUID
    user_uuid: UUID
    subscribe_card: UUID
    subscribe_type: int
    started_at: datetime
    ended_at: datetime
    terminated_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
