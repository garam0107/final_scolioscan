from sqlalchemy import Column, String, DateTime, Integer, Boolean, JSON
from sqlalchemy.sql import func
import uuid
from ..database import Base
from .types import UUID


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(String(64), unique=True, nullable=False, index=True)  # email
    user_pw = Column(String(512), nullable=False)
    name = Column(String(32), nullable=False)
    phone = Column(String(64), nullable=False)
    birthday = Column(DateTime, nullable=False)
    sex = Column(Boolean, nullable=False)  # True: Male, False: Female
    address = Column(String(128), nullable=False)
    detail_address = Column(String(128), nullable=True)
    profile_image = Column(String(256), nullable=True)  # 프로필 이미지 URL
    alarm_count = Column(Integer, nullable=False, default=0)
    setting = Column(JSON, nullable=False, default=dict)
    is_admin = Column(Boolean, nullable=False, default=False)  # 관리자 여부
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
