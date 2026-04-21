from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import User, Alarm, AlarmType
from ..schemas import AlarmResponse, AlarmCreate
from ..utils import get_current_user

router = APIRouter()


@router.get("/", response_model=List[AlarmResponse])
async def get_alarms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """알림 목록 조회"""
    alarms = db.query(Alarm).filter(
        Alarm.user_uuid == current_user.id
    ).order_by(Alarm.created_at.desc()).all()

    return alarms


@router.get("/unread-count")
async def get_unread_alarm_count(
    current_user: User = Depends(get_current_user)
):
    """읽지 않은 알림 개수"""
    return {"count": current_user.alarm_count}


@router.post("/{alarm_id}/read")
async def mark_alarm_as_read(
    alarm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """알림 읽음 처리"""
    alarm = db.query(Alarm).filter(
        Alarm.id == alarm_id,
        Alarm.user_uuid == current_user.id
    ).first()

    if not alarm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alarm not found"
        )

    if alarm.read_at is None:
        alarm.read_at = datetime.utcnow()
        current_user.alarm_count = max(0, current_user.alarm_count - 1)
        db.commit()

    return {"message": "Alarm marked as read"}


@router.post("/read-all")
async def mark_all_alarms_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """모든 알림 읽음 처리"""
    db.query(Alarm).filter(
        Alarm.user_uuid == current_user.id,
        Alarm.read_at == None
    ).update({"read_at": datetime.utcnow()})

    current_user.alarm_count = 0
    db.commit()

    return {"message": "All alarms marked as read"}
