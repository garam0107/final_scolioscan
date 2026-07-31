import hashlib
import secrets

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import (
    AppleVerifyRequest,
    GoogleVerifyRequest,
    KakaoVerifyRequest,
    LoginResponse,
    NaverVerifyRequest,
    SocialLinkCurrentRequest,
    SocialLinkExistingRequest,
    SocialSignupRequest,
    SocialTicketExchangeResponse,
)
from ..services.auth_service import (
    build_login_response,
    find_user_by_normalized_phone,
    issue_refresh_token,
    utcnow,
    verify_user_password,
)
from ..services.apple_auth_service import (
    encrypt_apple_refresh_token,
    exchange_apple_authorization_code,
    verify_apple_identity,
)
from ..services.octomo_verification import normalize_phone_number
from ..services.social_auth_service import (
    build_social_ticket_exchange_response,
    create_social_account,
    ensure_social_account_not_linked,
    ensure_user_provider_not_linked,
    get_social_account,
    verify_google_identity,
    verify_kakao_access_token,
    verify_naver_access_token,
    verify_social_temp_token,
)
from ..utils import create_access_token, get_current_user, get_password_hash
from ..services.curvature_limit import next_curvature_limit_reset_at

router = APIRouter()


@router.post("/social/apple/verify", response_model=SocialTicketExchangeResponse)
async def verify_apple_social_login(
    payload: AppleVerifyRequest,
    db: Session = Depends(get_db),
):
    """Apple 서명 토큰과 일회성 코드를 검증한 뒤 기존 소셜 계정 흐름으로 분기한다."""
    provider_user_id, provider_email = await verify_apple_identity(payload.identity_token)
    apple_tokens = await exchange_apple_authorization_code(payload.authorization_code)
    exchanged_user_id, exchanged_email = await verify_apple_identity(
        apple_tokens["id_token"],
        access_token=apple_tokens["access_token"],
    )

    if exchanged_user_id != provider_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Apple authorization_code identity mismatch",
        )

    encrypted_refresh_token = encrypt_apple_refresh_token(apple_tokens["refresh_token"])
    provider_email = provider_email or exchanged_email
    social_account = get_social_account(db, "apple", provider_user_id)

    if social_account is None:
        # Apple 신규 사용자는 다른 소셜 로그인처럼 계정 선택 모달을 거치지 않고
        # 필요한 최소 정보만으로 ScolioScan 계정을 즉시 만든다.
        user_id = provider_email
        if (
            not user_id
            or len(user_id) > 64
            or db.query(User).filter(User.user_id == user_id).first() is not None
        ):
            # users.user_id가 VARCHAR(64)이므로 해시 일부만 사용해 내부 이메일 길이를 보장한다.
            user_id = f"apple-{hashlib.sha256(provider_user_id.encode()).hexdigest()[:32]}@scolioscan.local"

        user = User(
            user_id=user_id,
            user_pw=get_password_hash(secrets.token_urlsafe(32)),
            name=(payload.full_name or "Apple User").strip()[:32] or "Apple User",
            phone=None,
            birthday=None,
            sex=None,
            address=None,
            detail_address=None,
            alarm_count=0,
            curvature_limit=10,
            curvature_limit_reset_at=next_curvature_limit_reset_at(),
            setting={"voice_alarm": False},
        )
        db.add(user)
        now = utcnow()
        created_social_account = create_social_account(
            db=db,
            user=user,
            provider="apple",
            provider_user_id=provider_user_id,
            provider_email=provider_email,
            linked_at=now,
            provider_refresh_token=encrypted_refresh_token,
        )
        try:
            db.flush()
        except IntegrityError as error:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Apple account is already linked",
            ) from error

        access_token = create_access_token(data={"sub": user.user_id})
        refresh_token, _ = issue_refresh_token(
            db=db,
            user=user,
            device_id=payload.device_id,
            device_name=payload.device_name,
        )
        db.commit()

        return build_social_ticket_exchange_response(
            provider="apple",
            provider_user_id=provider_user_id,
            provider_email=provider_email,
            social_account=created_social_account,
            access_token=access_token,
            refresh_token=refresh_token,
            user=user,
        )

    user = db.get(User, social_account.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Linked user not found",
        )

    now = utcnow()
    social_account.provider_email = provider_email or social_account.provider_email
    social_account.apple_refresh_token = encrypted_refresh_token
    social_account.apple_token_updated_at = now
    social_account.last_login_at = now
    access_token = create_access_token(data={"sub": user.user_id})
    refresh_token, _ = issue_refresh_token(
        db=db,
        user=user,
        device_id=payload.device_id,
        device_name=payload.device_name,
    )
    db.commit()

    return build_social_ticket_exchange_response(
        provider="apple",
        provider_user_id=provider_user_id,
        provider_email=provider_email,
        social_account=social_account,
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


@router.post("/social/google/verify", response_model=SocialTicketExchangeResponse)
async def verify_google_social_login(
    payload: GoogleVerifyRequest,
    db: Session = Depends(get_db),
):
    """구글 id_token을 검증한 뒤 바로 로그인 또는 계정 선택 단계로 분기한다."""
    provider_user_id, provider_email = await verify_google_identity(payload.id_token)
    social_account = get_social_account(db, "google", provider_user_id)

    if social_account is None:
        return build_social_ticket_exchange_response(
            provider="google",
            provider_user_id=provider_user_id,
            provider_email=provider_email,
            social_account=None,
        )

    user = db.get(User, social_account.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Linked user not found",
        )

    social_account.last_login_at = utcnow()
    access_token = create_access_token(data={"sub": user.user_id})
    refresh_token, _ = issue_refresh_token(
        db=db,
        user=user,
        device_id=payload.device_id,
        device_name=payload.device_name,
    )
    db.commit()

    return build_social_ticket_exchange_response(
        provider="google",
        provider_user_id=provider_user_id,
        provider_email=provider_email,
        social_account=social_account,
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


@router.post("/social/kakao/verify", response_model=SocialTicketExchangeResponse)
async def verify_kakao_social_login(
    payload: KakaoVerifyRequest,
    db: Session = Depends(get_db),
):
    """카카오 SDK access token을 검증한 뒤 바로 로그인 또는 계정 선택 단계로 분기한다."""
    provider_user_id, provider_email = await verify_kakao_access_token(payload.access_token)
    social_account = get_social_account(db, "kakao", provider_user_id)

    if social_account is None:
        return build_social_ticket_exchange_response(
            provider="kakao",
            provider_user_id=provider_user_id,
            provider_email=provider_email,
            social_account=None,
        )

    user = db.get(User, social_account.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Linked user not found",
        )

    social_account.last_login_at = utcnow()
    access_token = create_access_token(data={"sub": user.user_id})
    refresh_token, _ = issue_refresh_token(
        db=db,
        user=user,
        device_id=payload.device_id,
        device_name=payload.device_name,
    )
    db.commit()

    return build_social_ticket_exchange_response(
        provider="kakao",
        provider_user_id=provider_user_id,
        provider_email=provider_email,
        social_account=social_account,
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


@router.post("/social/naver/verify", response_model=SocialTicketExchangeResponse)
async def verify_naver_social_login(
    payload: NaverVerifyRequest,
    db: Session = Depends(get_db),
):
    """네이버 SDK access token을 검증한 뒤 바로 로그인 또는 계정 선택 단계로 분기한다."""
    provider_user_id, provider_email = await verify_naver_access_token(payload.access_token)
    social_account = get_social_account(db, "naver", provider_user_id)

    if social_account is None:
        return build_social_ticket_exchange_response(
            provider="naver",
            provider_user_id=provider_user_id,
            provider_email=provider_email,
            social_account=None,
        )

    user = db.get(User, social_account.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Linked user not found",
        )

    social_account.last_login_at = utcnow()
    access_token = create_access_token(data={"sub": user.user_id})
    refresh_token, _ = issue_refresh_token(
        db=db,
        user=user,
        device_id=payload.device_id,
        device_name=payload.device_name,
    )
    db.commit()

    return build_social_ticket_exchange_response(
        provider="naver",
        provider_user_id=provider_user_id,
        provider_email=provider_email,
        social_account=social_account,
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


@router.post("/social/link-existing", response_model=LoginResponse)
async def link_existing_social_account(
    payload: SocialLinkExistingRequest,
    db: Session = Depends(get_db),
):
    """소셜 임시 토큰을 검증한 뒤 기존 계정과 연결하고 바로 로그인한다."""
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
        provider_refresh_token=social_identity["provider_refresh_token"],
    )
    try:
        # 동시에 같은 소셜 계정이 먼저 연결되면 unique 제약 에러를 409로 바꾼다.
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


@router.post("/social/link-current", status_code=status.HTTP_204_NO_CONTENT)
async def connect_social_account(
    payload: SocialLinkCurrentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """계정 관리 화면에서 현재 로그인된 계정에 소셜 계정을 연결한다."""
    social_identity = verify_social_temp_token(payload.social_temp_token)
    provider = social_identity["provider"]
    provider_user_id = social_identity["provider_user_id"]

    # 다른 계정에 이미 연결된 소셜이면 현재 계정에 붙이지 못하도록 먼저 막는다.
    linked_social_account = get_social_account(
        db=db,
        provider=provider,
        provider_user_id=provider_user_id,
    )
    if linked_social_account is not None:
        if linked_social_account.user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 연결된 소셜 계정입니다.",
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="다른 계정에 이미 연결된 소셜 계정입니다.",
        )

    # 현재 계정에 같은 provider가 이미 연결된 상태도 명시적으로 차단한다.
    try:
        ensure_user_provider_not_linked(
            db=db,
            user=current_user,
            provider=provider,
        )
    except HTTPException as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 연결된 소셜 계정입니다.",
        ) from error

    create_social_account(
        db=db,
        user=current_user,
        provider=provider,
        provider_user_id=provider_user_id,
        provider_email=social_identity["provider_email"],
        linked_at=utcnow(),
        provider_refresh_token=social_identity["provider_refresh_token"],
    )
    try:
        # 동시 요청으로 unique 제약이 걸리는 경우도 409로 응답한다.
        db.flush()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="소셜 계정 연결 처리 중 충돌이 발생했습니다. 다시 시도해주세요.",
        ) from error

    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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

    # 일반 회원가입과 같은 필드를 받되, 생성 직후 소셜 연결과 로그인을 이어간다.
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
        curvature_limit=10,
        curvature_limit_reset_at=next_curvature_limit_reset_at(),
        setting={"voice_alarm": False},
    )
    db.add(user)
    try:
        # 동시 가입으로 unique 제약이 걸리는 경우도 같은 409 응답으로 정리한다.
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
        provider_refresh_token=social_identity["provider_refresh_token"],
    )
    try:
        # 임시 토큰이 남아 있어도 먼저 연결된 소셜 계정이면 두 번째 flush에서 막는다.
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
