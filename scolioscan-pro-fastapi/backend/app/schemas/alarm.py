from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class AlarmCreate(BaseModel):
    user_uuid: UUID
    alarm_type: int
    title: str
    content: str


class AlarmResponse(BaseModel):
    id: int
    user_uuid: UUID
    alarm_type: int
    title: str
    content: str
    read_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
