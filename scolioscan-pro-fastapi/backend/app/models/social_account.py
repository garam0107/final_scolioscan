from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from ..database import Base
from .types import UUID


class SocialAccount(Base):
    __tablename__ = "social_accounts"
    __table_args__ = (
        UniqueConstraint("provider", "provider_user_id", name="uq_social_accounts_provider_user"),
        UniqueConstraint("user_id", "provider", name="uq_social_accounts_user_provider"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(
        Enum("google", "kakao", "naver", name="social_provider"),
        nullable=False,
    )
    provider_user_id = Column(String(128), nullable=False)
    provider_email = Column(String(128), nullable=True)
    linked_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    # 사용자 엔티티에서 역방향으로 연동 목록을 읽을 수 있게 연결한다.
    user = relationship("User", back_populates="social_accounts")
