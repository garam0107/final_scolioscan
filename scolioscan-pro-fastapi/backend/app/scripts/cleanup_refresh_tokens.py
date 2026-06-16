from datetime import datetime, timedelta

from sqlalchemy import and_, or_

from app.database import SessionLocal
from app.models import RefreshToken


def cleanup_refresh_tokens() -> int:
    """만료 또는 폐기 후 오래 지난 refresh token만 정리한다."""
    db = SessionLocal()
    cutoff = datetime.utcnow() - timedelta(days=30)

    try:
        deleted_count = db.query(RefreshToken).filter(
            or_(
                RefreshToken.expires_at < cutoff,
                and_(
                    RefreshToken.revoked_at.is_not(None),
                    RefreshToken.revoked_at < cutoff,
                ),
            )
        ).delete(synchronize_session=False)
        db.commit()
        return deleted_count
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    deleted_count = cleanup_refresh_tokens()
    print(f"deleted_refresh_tokens={deleted_count}")
