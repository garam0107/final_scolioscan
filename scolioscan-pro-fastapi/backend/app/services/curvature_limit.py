"""카메라 측정 횟수의 30일 주기 처리를 담당하는 서비스입니다."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import update
from sqlalchemy.orm import Session

from ..models import User

CURVATURE_LIMIT_DEFAULT = 10
CURVATURE_LIMIT_PERIOD = timedelta(days=30)


def utcnow() -> datetime:
    """DB의 기존 naive datetime 컬럼과 맞추기 위해 UTC 기준 naive 시각을 반환합니다."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def next_curvature_limit_reset_at(value: datetime | None = None) -> datetime:
    """가입 또는 만료 확인 시점부터 30일 뒤의 리셋 시각을 계산합니다."""
    return (value or utcnow()) + CURVATURE_LIMIT_PERIOD


def reset_curvature_limit_if_expired(db: Session, user: User) -> bool:
    """만료된 사용자를 요청 시점 기준으로 새 30일 주기로 전환합니다."""
    now = utcnow()
    if user.curvature_limit_reset_at > now:
        return False

    next_reset_at = next_curvature_limit_reset_at(now)
    result = db.execute(
        update(User)
        .where(
            User.id == user.id,
            User.curvature_limit_reset_at <= now,
        )
        .values(
            curvature_limit=CURVATURE_LIMIT_DEFAULT,
            curvature_limit_reset_at=next_reset_at,
        )
    )
    if (result.rowcount or 0) != 1:
        # 동시에 들어온 요청이 먼저 갱신했을 수 있으므로 최신 값을 응답에 사용합니다.
        db.refresh(user)
        return False

    db.commit()
    db.refresh(user)
    return True


def consume_curvature_limit(db: Session, user_id: str) -> bool:
    """측정 저장 직전에 원자적으로 하나를 차감합니다."""
    result = db.execute(
        update(User)
        .where(User.id == user_id, User.curvature_limit > 0)
        .values(curvature_limit=User.curvature_limit - 1)
    )
    return (result.rowcount or 0) == 1
