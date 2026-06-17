from fastapi import APIRouter
from .auth import router as auth_router
from .social import router as social_router
from .user import router as user_router
from .alarm import router as alarm_router
from .subscribe import router as subscribe_router
from .contact import router as contact_router
from .admin import router as admin_router
from .rotation import router as rotation_router
from .measurement_set import router as measurement_set_router


api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(social_router, prefix="/auth", tags=["social"])
api_router.include_router(user_router, prefix="/users", tags=["users"])
api_router.include_router(alarm_router, prefix="/alarms", tags=["alarms"])
api_router.include_router(subscribe_router, prefix="/subscribe", tags=["subscribe"])
api_router.include_router(contact_router, prefix="/contact", tags=["contact"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
api_router.include_router(rotation_router, prefix="/rotation", tags=["rotation"])
api_router.include_router(measurement_set_router, prefix="/measurement-sets", tags=["measurement-sets"])
