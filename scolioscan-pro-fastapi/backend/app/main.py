from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import sys
import os

# Add parent directory to path for init_db import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .config import settings
from .database import engine, Base, SessionLocal
from .api import api_router
from .models import AlarmType, AnalysisType, SubscribeType
from app.api import curvature


def init_db():
    """Initialize database with default data"""
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
            SubscribeType(name="베이직", price=9900, description="월 10회 측정"),
            SubscribeType(name="스탠다드", price=19900, description="월 30회 측정 + 전문의 상담"),
            SubscribeType(name="프리미엄", price=39900, description="무제한 측정 + 전문의 상담 + 정밀 분석"),
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

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# CORS 설정
# 개발 모드에서는 모든 origin 허용, 프로덕션에서는 특정 origin만 허용
cors_origins = settings.CORS_ORIGINS if not settings.DEBUG else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(api_router, prefix="/api")
app.include_router(curvature.router)

# 업로드 디렉토리 준비 (Docker 볼륨 마운트를 고려한 경로)
uploads_dir = Path(settings.UPLOAD_DIR)
uploads_dir.mkdir(parents=True, exist_ok=True)

@app.on_event("startup")
async def startup_seed_event():
  init_db()


@app.get("/")
async def root():
    return {
        "message": "Welcome to NextVine API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
