from sqlalchemy import Boolean, Column, DateTime, Integer, JSON, String
from sqlalchemy.orm import relationship
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
    # Apple 직접 가입은 휴대폰 본인인증 정보를 받지 않으므로 프로필 필수값을 비워 둘 수 있다.
    phone = Column(String(64), nullable=True)
    birthday = Column(DateTime, nullable=True)
    sex = Column(Boolean, nullable=True)  # True: Male, False: Female
    address = Column(String(128), nullable=True)
    detail_address = Column(String(128), nullable=True)
    # 비밀번호를 발급하지 않는 Apple 직접 가입 계정을 일반 계정과 구분한다.
    is_apple_direct_signup = Column(Boolean, nullable=False, default=False)
    profile_image = Column(String(256), nullable=True)  # 프로필 이미지 URL
    alarm_count = Column(Integer, nullable=False, default=0)
    curvature_limit = Column(Integer, nullable=False, default=10)
    curvature_limit_reset_at = Column(DateTime, nullable=False)
    setting = Column(JSON, nullable=False, default=dict)
    is_admin = Column(Boolean, nullable=False, default=False)  # 관리자 여부
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    # 계정 관리 화면에서 소셜 연동 상태를 함께 내려주기 위해 관계를 명시한다.
    social_accounts = relationship("SocialAccount", back_populates="user", cascade="all, delete-orphan")
