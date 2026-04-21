from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..database import Base
from .types import UUID


class SubscribeType(Base):
    __tablename__ = "subscribe_types"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(16), nullable=False, unique=True)
    price = Column(Integer, nullable=False, default=0)
    description = Column(String(256), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    removed_at = Column(DateTime(timezone=True), nullable=True, default=None)


class SubscribeCard(Base):
    __tablename__ = "subscribe_cards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_uuid = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    billing_key = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    removed_at = Column(DateTime(timezone=True), nullable=True, default=None)

    # Relationships
    user = relationship("User", backref="subscribe_cards")


class Subscribe(Base):
    __tablename__ = "subscribes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_uuid = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    subscribe_card = Column(UUID(as_uuid=True), ForeignKey("subscribe_cards.id"), nullable=False)
    subscribe_type = Column(Integer, ForeignKey("subscribe_types.id"), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=False)
    terminated_at = Column(DateTime(timezone=True), nullable=True, default=None)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", backref="subscribes")
    card = relationship("SubscribeCard")
    type_info = relationship("SubscribeType")
