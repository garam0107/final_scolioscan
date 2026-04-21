from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "NextVine API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database Settings
    DATABASE_URL: str = "mysql+pymysql://nextvine:nextvine@localhost:3306/nextvine?charset=utf8mb4"

    # JWT Settings
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # SMTP Settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "your-email@gmail.com"
    SMTP_PASSWORD: str = "your-email-password"
    SMTP_FROM_EMAIL: str = "your-email@gmail.com"
    SMTP_FROM_NAME: str = "NextVine"
    SMTP_SSL: bool = False  # True for port 465 (SSL), False for port 587 (TLS)

    # Admin Email
    ADMIN_EMAIL: str = "admin@nextvine.com"

    # Daum Address API
    DAUM_ADDRESS_API_KEY: str = "your-daum-api-key"

    # File Upload Settings
    UPLOAD_DIR: str = "./uploads"  # Relative path works both in Docker and on regular servers

    # CORS Settings
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8081",       # Expo dev server
        "http://127.0.0.1:8081",       # Expo dev server
        "http://192.168.0.190:3000",
        "http://192.168.0.190:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "https://nextvine.primers.co.kr",
        "https://nextvine-service.primers.co.kr",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
