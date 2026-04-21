from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
from .types import UUID


class AlarmType(Base):
    __tablename__ = "alarm_types"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(16), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AnalysisType(Base):
    __tablename__ = "analysis_types"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(16), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Alarm(Base):
    __tablename__ = "alarms"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_uuid = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    alarm_type = Column(Integer, ForeignKey("alarm_types.id"), nullable=False)
    title = Column(String(64), nullable=False)
    content = Column(Text, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True, default=None)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", backref="alarms")
    type_info = relationship("AlarmType")
