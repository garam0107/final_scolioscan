from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models import User, Subscribe, SubscribeType, SubscribeCard
from ..schemas import SubscribeResponse, SubscribeCreate, SubscribeTypeResponse
from ..utils import get_current_user

router = APIRouter()


@router.get("/types", response_model=List[SubscribeTypeResponse])
async def get_subscribe_types(db: Session = Depends(get_db)):
    """구독 플랜 목록 조회"""
    types = db.query(SubscribeType).filter(
        SubscribeType.removed_at == None
    ).all()

    return types


@router.get("/current", response_model=Optional[SubscribeResponse])
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """현재 구독 정보 조회"""
    subscription = db.query(Subscribe).filter(
        Subscribe.user_uuid == current_user.id,
        Subscribe.terminated_at == None,
        Subscribe.ended_at > datetime.utcnow()
    ).first()

    return subscription


@router.post("/", response_model=SubscribeResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    subscribe_data: SubscribeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """구독 생성"""
    # 구독 타입 확인
    subscribe_type = db.query(SubscribeType).filter(
        SubscribeType.id == subscribe_data.subscribe_type
    ).first()

    if not subscribe_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscribe type not found"
        )

    # 구독 생성
    db_subscribe = Subscribe(
        user_uuid=current_user.id,
        subscribe_card=subscribe_data.subscribe_card,
        subscribe_type=subscribe_data.subscribe_type,
        started_at=subscribe_data.started_at,
        ended_at=subscribe_data.ended_at
    )

    db.add(db_subscribe)
    db.commit()
    db.refresh(db_subscribe)

    return db_subscribe


@router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """구독 해지"""
    subscription = db.query(Subscribe).filter(
        Subscribe.user_uuid == current_user.id,
        Subscribe.terminated_at == None,
        Subscribe.ended_at > datetime.utcnow()
    ).first()

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active subscription not found"
        )

    subscription.terminated_at = datetime.utcnow()
    db.commit()

    return {"message": "Subscription cancelled successfully"}
