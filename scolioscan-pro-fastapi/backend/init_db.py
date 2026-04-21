"""
Database initialization script
Run this script to create initial data in the database
"""
from app.database import SessionLocal, engine, Base
from app.models import AlarmType, AnalysisType, SubscribeType
from datetime import datetime

def init_db():
    """Initialize database with default data"""
    # Create all tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Create Alarm Types
        alarm_types = [
            AlarmType(name="시스템"),
            AlarmType(name="측정"),
            AlarmType(name="구독"),
            AlarmType(name="공지사항"),
        ]

        for alarm_type in alarm_types:
            existing = db.query(AlarmType).filter(AlarmType.name == alarm_type.name).first()
            if not existing:
                db.add(alarm_type)

        # Create Analysis Types
        analysis_types = [
            AnalysisType(name="2D 이미지"),
            AnalysisType(name="3D 동영상"),
            AnalysisType(name="척추측만계"),
        ]

        for analysis_type in analysis_types:
            existing = db.query(AnalysisType).filter(AnalysisType.name == analysis_type.name).first()
            if not existing:
                db.add(analysis_type)

        # Create Subscribe Types
        subscribe_types = [
            SubscribeType(
                name="베이직",
                price=9900,
                description="월 10회 측정"
            ),
            SubscribeType(
                name="스탠다드",
                price=19900,
                description="월 30회 측정 + 전문의 상담"
            ),
            SubscribeType(
                name="프리미엄",
                price=39900,
                description="무제한 측정 + 전문의 상담 + 정밀 분석"
            ),
        ]

        for subscribe_type in subscribe_types:
            existing = db.query(SubscribeType).filter(SubscribeType.name == subscribe_type.name).first()
            if not existing:
                db.add(subscribe_type)

        db.commit()
        print("✅ Database initialized successfully!")

    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
