from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "NextVine API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database Settings
    DATABASE_URL: str = "mysql+pymysql://nextvine:nextvine@localhost:3306/nextvine?charset=utf8mb4"

    # JWT Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    REFRESH_TOKEN_SECRET: str

    # SMTP Settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "your-email@gmail.com"
    SMTP_PASSWORD: str = "your-email-password"
    SMTP_FROM_EMAIL: str = "your-email@gmail.com"
    SMTP_FROM_NAME: str = "NextVine"
    SMTP_SSL: bool = False  # True for port 465 (SSL), False for port 587 (TLS)

    # Admin Email
    ADMIN_EMAIL: str = "nextvinedev@gmail.com"

    # Daum Address API
    DAUM_ADDRESS_API_KEY: str = "your-daum-api-key"

    # OCTOMO SMS 인증 설정
    OCTOMO_API_BASE_URL: str = "https://api.octoverse.kr/octomo/v1/public"
    OCTOMO_API_KEY: str = ""
    OCTOMO_API_KEY_HEADER: str = "Authorization"
    OCTOMO_API_KEY_PREFIX: str = "Octomo "
    OCTOMO_HTTP_TIMEOUT_SECONDS: float = 10.0
    OCTOMO_VERIFICATION_TTL_SECONDS: int = 300
    OCTOMO_RECIPIENT_NUMBER: str = ""

    # AIS API Settings
    AIS_API_URL: str = "http://ais-api:8000"

    # AWS S3 Settings
    AWS_REGION: str = "ap-northeast-2"
    S3_BUCKET: str = ""

    # Social Login Settings
    GOOGLE_WEB_CLIENT_ID: str
    KAKAO_REST_API_KEY: str
    KAKAO_CLIENT_SECRET: str
    KAKAO_REDIRECT_URI: str
    KAKAO_ADMIN_KEY: str
    NAVER_CLIENT_ID: str
    NAVER_CLIENT_SECRET: str
    NAVER_REDIRECT_URI: str
    SOCIAL_AUTH_HTTP_TIMEOUT_SECONDS: float = 10.0
    SOCIAL_TEMP_TOKEN_EXPIRE_MINUTES: int = 10
    SOCIAL_OAUTH_STATE_EXPIRE_MINUTES: int = 10
    SOCIAL_ONE_TIME_TICKET_EXPIRE_MINUTES: int = 10
    APP_OAUTH_RETURN_BASE: str = "scolioscan://oauth"

    # File Upload Settings
    UPLOAD_DIR: str = "./uploads"  # Relative path works both in Docker and on regular servers

    # CORS Settings
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
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
