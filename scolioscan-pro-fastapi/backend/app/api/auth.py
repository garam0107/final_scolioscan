import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import User
from ..schemas import (
    EmailFindCheckResponse,
    EmailFindRequest,
    EmailFindVerifyResponse,
    GoogleVerifyRequest,
    KakaoVerifyRequest,
    LoginResponse,
    LogoutRequest,
    NaverVerifyRequest,
    OctomoIssueCodeRequest,
    OctomoIssueCodeResponse,
    OctomoVerifyRequest,
    OctomoVerifyResponse,
    PasswordResetCheckResponse,
    PasswordResetConfirm,
    PasswordResetVerify,
    PasswordResetVerifyResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    SocialLinkExistingRequest,
    SocialSignupRequest,
    SocialVerifyResponse,
    UserCreate,
    UserLogin,
)
from ..services.auth_service import (
    build_login_response,
    build_password_reset_password_hash,
    create_password_reset_token,
    ensure_refresh_token_is_active,
    find_user_by_normalized_phone,
    find_user_by_name_and_phone,
    get_password_reset_user,
    get_refresh_token_or_401,
    issue_refresh_token,
    revoke_all_active_refresh_tokens,
    utcnow,
    verify_user_password,
)
from ..services.octomo_verification import (
    issue_verification_code,
    normalize_phone_number,
    verify_verification_code_with_octomo,
)
from ..services.social_auth_service import (
    build_social_verify_response,
    create_social_account,
    ensure_social_account_not_linked,
    ensure_user_provider_not_linked,
    exchange_kakao_code,
    exchange_naver_code,
    get_social_account,
    verify_social_temp_token,
    verify_google_identity,
)
from ..utils import create_access_token, get_password_hash

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """회원가입"""
    existing_user = db.query(User).filter(User.user_id == user_data.user_id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed_password = get_password_hash(user_data.user_pw)

    db_user = User(
        user_id=user_data.user_id,
        user_pw=hashed_password,
        name=user_data.name,
        phone=user_data.phone,
        birthday=user_data.birthday,
        sex=user_data.sex,
        address=user_data.address,
        detail_address=user_data.detail_address,
        alarm_count=0,
        setting={"voice_alarm": False},
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {"message": "User created successfully", "user_id": str(db_user.id)}


@router.post("/login", response_model=LoginResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """로그인"""
    user = db.query(User).filter(User.user_id == user_data.user_id).first()

    if not user or not verify_user_password(user_data.user_pw, user.user_pw):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # 로그인 시 access/refresh token을 함께 발급하고 DB에는 refresh hash만 남긴다.
    access_token = create_access_token(data={"sub": user.user_id})
    refresh_token, _ = issue_refresh_token(
        db=db,
        user=user,
        device_id=user_data.device_id,
        device_name=user_data.device_name,
    )

    db.commit()

    return build_login_response(user, access_token, refresh_token)


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_tokens(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """refresh token rotation으로 새 access/refresh token 쌍을 발급한다."""
    current_token = get_refresh_token_or_401(db, payload.refresh_token)
    ensure_refresh_token_is_active(current_token)

    user = db.get(User, current_token.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    now = utcnow()
    new_refresh_token, new_refresh_row = issue_refresh_token(
        db=db,
        user=user,
        device_id=current_token.device_id,
        device_name=current_token.device_name,
    )

    current_token.revoked_at = now
    current_token.last_used_at = now
    current_token.replaced_by_token_id = new_refresh_row.token_id

    access_token = create_access_token(data={"sub": user.user_id})
    db.commit()

    return RefreshTokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
    )


@router.post("/logout")
async def logout(payload: LogoutRequest, db: Session = Depends(get_db)):
    """클라이언트가 보낸 refresh token을 서버에서 폐기한다."""
    refresh_token = get_refresh_token_or_401(db, payload.refresh_token)
    ensure_refresh_token_is_active(refresh_token)

    now = utcnow()
    refresh_token.revoked_at = now
    refresh_token.last_used_at = now
    db.commit()

    return {"message": "Logged out successfully"}


@router.post("/social/google/verify", response_model=SocialVerifyResponse)
async def verify_google_social_login(
    payload: GoogleVerifyRequest,
    db: Session = Depends(get_db),
):
    """구글 id_token을 검증하고 연결 여부만 반환한다."""
    provider_user_id, provider_email = await verify_google_identity(payload.id_token)
    social_account = get_social_account(db, "google", provider_user_id)
    return build_social_verify_response("google", provider_user_id, provider_email, social_account)


@router.post("/social/kakao/verify", response_model=SocialVerifyResponse)
async def verify_kakao_social_login(
    payload: KakaoVerifyRequest,
    db: Session = Depends(get_db),
):
    """카카오 code를 검증하고 연결 여부만 반환한다."""
    provider_user_id, provider_email = await exchange_kakao_code(payload.code)
    social_account = get_social_account(db, "kakao", provider_user_id)
    return build_social_verify_response("kakao", provider_user_id, provider_email, social_account)


@router.post("/social/naver/verify", response_model=SocialVerifyResponse)
async def verify_naver_social_login(
    payload: NaverVerifyRequest,
    db: Session = Depends(get_db),
):
    """네이버 code/state를 검증하고 연결 여부만 반환한다."""
    provider_user_id, provider_email = await exchange_naver_code(payload.code, payload.state)
    social_account = get_social_account(db, "naver", provider_user_id)
    return build_social_verify_response("naver", provider_user_id, provider_email, social_account)


@router.post("/social/link-existing", response_model=LoginResponse)
async def link_existing_social_account(
    payload: SocialLinkExistingRequest,
    db: Session = Depends(get_db),
):
    """소셜 임시 토큰을 검증한 뒤 기존 계정에 연결하고 바로 로그인한다."""
    social_identity = verify_social_temp_token(payload.social_temp_token)
    ensure_social_account_not_linked(
        db=db,
        provider=social_identity["provider"],
        provider_user_id=social_identity["provider_user_id"],
    )

    user = db.query(User).filter(User.user_id == payload.user_id).first()
    if not user or not verify_user_password(payload.user_pw, user.user_pw):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    ensure_user_provider_not_linked(
        db=db,
        user=user,
        provider=social_identity["provider"],
    )

    now = utcnow()
    create_social_account(
        db=db,
        user=user,
        provider=social_identity["provider"],
        provider_user_id=social_identity["provider_user_id"],
        provider_email=social_identity["provider_email"],
        linked_at=now,
    )
    try:
        # 동시 요청으로 같은 소셜 계정이 먼저 연결된 경우 DB unique 제약 오류를 409로 변환한다.
        db.flush()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Social account is already linked",
        ) from error

    access_token = create_access_token(data={"sub": user.user_id})
    refresh_token, _ = issue_refresh_token(
        db=db,
        user=user,
        device_id=payload.device_id,
        device_name=payload.device_name,
    )
    db.commit()

    return build_login_response(user, access_token, refresh_token)


@router.post("/social/signup", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def signup_with_social_account(
    payload: SocialSignupRequest,
    db: Session = Depends(get_db),
):
    """소셜 임시 토큰을 검증한 뒤 신규 계정을 만들고 연결과 로그인을 한 번에 처리한다."""
    social_identity = verify_social_temp_token(payload.social_temp_token)
    ensure_social_account_not_linked(
        db=db,
        provider=social_identity["provider"],
        provider_user_id=social_identity["provider_user_id"],
    )

    existing_user = db.query(User).filter(User.user_id == payload.user_id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    normalized_phone = normalize_phone_number(payload.phone)
    existing_phone_user = find_user_by_normalized_phone(normalized_phone, db)
    if existing_phone_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Phone already registered",
        )

    # 일반 회원가입과 같은 사용자 필드를 받되, 생성 직후 소셜 연결과 로그인까지 이어간다.
    user = User(
        user_id=payload.user_id,
        user_pw=get_password_hash(payload.user_pw),
        name=payload.name,
        phone=payload.phone,
        birthday=payload.birthday,
        sex=payload.sex,
        address=payload.address,
        detail_address=payload.detail_address,
        alarm_count=0,
        setting={"voice_alarm": False},
    )
    db.add(user)
    try:
        # 사전 중복 검사 이후에도 동시 가입이 들어오면 DB unique 제약 기준으로 한 번 더 막는다.
        db.flush()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from error

    now = utcnow()
    create_social_account(
        db=db,
        user=user,
        provider=social_identity["provider"],
        provider_user_id=social_identity["provider_user_id"],
        provider_email=social_identity["provider_email"],
        linked_at=now,
    )
    try:
        # 임시 토큰 재사용이나 동시 요청으로 같은 소셜 계정이 먼저 연결된 경우를 막는다.
        db.flush()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Social account is already linked",
        ) from error

    access_token = create_access_token(data={"sub": user.user_id})
    refresh_token, _ = issue_refresh_token(
        db=db,
        user=user,
        device_id=payload.device_id,
        device_name=payload.device_name,
    )
    db.commit()

    return build_login_response(user, access_token, refresh_token)


@router.get("/check-email/{email}")
async def check_email(email: str, db: Session = Depends(get_db)):
    """이메일 중복 확인"""
    existing_user = db.query(User).filter(User.user_id == email).first()
    return {"exists": existing_user is not None}


@router.get("/check-phone/{phone}")
async def check_phone(phone: str, db: Session = Depends(get_db)):
    """전화번호 중복 확인"""
    normalized_phone = normalize_phone_number(phone)
    existing_user_phone = find_user_by_normalized_phone(normalized_phone, db)
    return {"exists": existing_user_phone is not None}


@router.post("/issue-code", response_model=OctomoIssueCodeResponse)
async def issue_phone_verification_code(payload: OctomoIssueCodeRequest):
    """전화번호 인증 코드를 발급한다."""
    try:
        challenge = await issue_verification_code(payload.phoneNumber)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return OctomoIssueCodeResponse(
        phoneNumber=challenge.phone_number,
        code=challenge.code,
        recipientNumber=settings.OCTOMO_RECIPIENT_NUMBER,
        messageText=challenge.code,
        expiresAt=challenge.expires_at,
        expiresInSeconds=settings.OCTOMO_VERIFICATION_TTL_SECONDS,
    )


@router.post("/verify", response_model=OctomoVerifyResponse)
async def verify_phone_verification(payload: OctomoVerifyRequest):
    """OCTOMO를 통해 인증 여부를 확인한다."""
    try:
        verified = await verify_verification_code_with_octomo(payload.phoneNumber)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OCTOMO API 호출에 실패했습니다.",
        ) from error
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    return OctomoVerifyResponse(verified=verified)


@router.post("/email-find/check", response_model=EmailFindCheckResponse)
async def check_email_find_account(
    email_find_data: EmailFindRequest,
    db: Session = Depends(get_db),
):
    """이메일 찾기 전에 이름과 전화번호가 일치하는 계정이 있는지 확인한다."""
    normalized_phone = normalize_phone_number(email_find_data.phone)
    user = find_user_by_name_and_phone(
        name=email_find_data.name,
        normalized_phone=normalized_phone,
        db=db,
    )

    return EmailFindCheckResponse(exists=user is not None)


@router.post("/email-find/verify", response_model=EmailFindVerifyResponse)
async def verify_email_find(
    email_find_data: EmailFindRequest,
    db: Session = Depends(get_db),
):
    """전화번호 인증이 끝나면 해당 계정의 이메일을 반환한다."""
    normalized_phone = normalize_phone_number(email_find_data.phone)
    user = find_user_by_name_and_phone(
        name=email_find_data.name,
        normalized_phone=normalized_phone,
        db=db,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with provided name and phone",
        )

    try:
        verified = await verify_verification_code_with_octomo(email_find_data.phone)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OCTOMO API verification failed",
        ) from error
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone verification is required",
        )

    return EmailFindVerifyResponse(email=user.user_id)


@router.post("/password-reset/check", response_model=PasswordResetCheckResponse)
async def check_password_reset_account(
    reset_data: PasswordResetVerify,
    db: Session = Depends(get_db),
):
    """비밀번호 찾기 전에 이메일, 이름, 전화번호가 모두 일치하는지 확인한다."""
    normalized_phone = normalize_phone_number(reset_data.phone)
    user = db.query(User).filter(
        User.user_id == reset_data.user_id,
        User.name == reset_data.name,
    ).first()

    exists = bool(user and normalize_phone_number(user.phone) == normalized_phone)
    return PasswordResetCheckResponse(exists=exists)


@router.post("/password-reset/verify", response_model=PasswordResetVerifyResponse)
async def verify_password_reset(
    reset_data: PasswordResetVerify,
    db: Session = Depends(get_db),
):
    """회원 정보와 전화번호 인증을 확인하고 비밀번호 재설정 토큰을 발급한다."""
    normalized_phone = normalize_phone_number(reset_data.phone)
    user = db.query(User).filter(
        User.user_id == reset_data.user_id,
        User.name == reset_data.name,
    ).first()

    if not user or normalize_phone_number(user.phone) != normalized_phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with provided email, name and phone",
        )

    try:
        verified = await verify_verification_code_with_octomo(reset_data.phone)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OCTOMO API verification failed",
        ) from error
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone verification is required",
        )

    return PasswordResetVerifyResponse(reset_token=create_password_reset_token(user))


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    """재설정 토큰이 유효하면 새 비밀번호로 변경한다."""
    if reset_data.new_password != reset_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirm password do not match",
        )

    user = get_password_reset_user(reset_data.reset_token, db)
    if verify_user_password(reset_data.new_password, user.user_pw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )

    # 비밀번호 재설정 이후에는 남아 있는 세션을 모두 끊어 이전 refresh token 재사용을 막는다.
    user.user_pw = build_password_reset_password_hash(reset_data.new_password)
    revoke_all_active_refresh_tokens(db, user, utcnow())
    db.commit()

    return {"message": "Password has been reset successfully"}
