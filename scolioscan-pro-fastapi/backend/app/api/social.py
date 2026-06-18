import httpx

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import (
    GoogleVerifyRequest,
    KakaoVerifyRequest,
    LoginResponse,
    NaverVerifyRequest,
    SocialLinkExistingRequest,
    SocialSignupRequest,
    SocialTicketExchangeRequest,
    SocialTicketExchangeResponse,
)
from ..services.auth_service import (
    build_login_response,
    find_user_by_normalized_phone,
    issue_refresh_token,
    utcnow,
    verify_user_password,
)
from ..services.octomo_verification import normalize_phone_number
from ..services.social_auth_service import (
    build_app_oauth_redirect_url,
    build_kakao_oauth_start_url,
    build_naver_oauth_start_url,
    build_social_ticket_exchange_response,
    consume_oauth_state_or_401,
    consume_one_time_social_ticket_or_401,
    create_oauth_state,
    create_one_time_social_ticket,
    create_social_account,
    ensure_social_account_not_linked,
    ensure_user_provider_not_linked,
    exchange_kakao_code,
    exchange_naver_code,
    get_social_account,
    verify_google_identity,
    verify_social_temp_token,
)
from ..utils import create_access_token, get_password_hash

router = APIRouter()


@router.post("/social/google/verify", response_model=SocialTicketExchangeResponse)
async def verify_google_social_login(
    payload: GoogleVerifyRequest,
    db: Session = Depends(get_db),
):
    """구글 id_token을 검증한 뒤 바로 login_success 또는 need_account_decision으로 분기한다."""
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


# @router.post("/social/kakao/verify", response_model=SocialVerifyResponse)
# async def verify_kakao_social_login(
#     payload: KakaoVerifyRequest,
#     db: Session = Depends(get_db),
# ):
#     """카카오 code를 검증하고 연결 여부만 반환한다."""
#     provider_user_id, provider_email = await exchange_kakao_code(payload.code)
#     social_account = get_social_account(db, "kakao", provider_user_id)
#     return build_social_verify_response("kakao", provider_user_id, provider_email, social_account)


# @router.post("/social/naver/verify", response_model=SocialVerifyResponse)
# async def verify_naver_social_login(
#     payload: NaverVerifyRequest,
#     db: Session = Depends(get_db),
# ):
#     """네이버 code/state를 검증하고 연결 여부만 반환한다."""
#     provider_user_id, provider_email = await exchange_naver_code(payload.code, payload.state)
#     social_account = get_social_account(db, "naver", provider_user_id)
#     return build_social_verify_response("naver", provider_user_id, provider_email, social_account)


@router.get("/oauth/kakao/start")
async def start_kakao_social_login():
    """카카오 OAuth 로그인 화면으로 이동할 authorize URL을 생성해 바로 리다이렉트한다."""
    state_value = await create_oauth_state("kakao")
    return RedirectResponse(url=build_kakao_oauth_start_url(state_value), status_code=status.HTTP_302_FOUND)


@router.get("/oauth/naver/start")
async def start_naver_social_login():
    """네이버 OAuth 로그인 화면으로 이동할 authorize URL을 생성해 바로 리다이렉트한다."""
    state_value = await create_oauth_state("naver")
    return RedirectResponse(url=build_naver_oauth_start_url(state_value), status_code=status.HTTP_302_FOUND)


@router.get("/oauth/kakao/callback")
async def kakao_social_login_callback(
    code: str | None = Query(None, min_length=1),
    state_value: str = Query(..., alias="state", min_length=1),
    error_code: str | None = Query(None, alias="error"),
    error_description: str | None = Query(None),
):
    """카카오 callback에서 code를 검증한 뒤 앱이 소비할 1회용 ticket을 deep link로 전달한다."""
    try:
        await consume_oauth_state_or_401("kakao", state_value)
        if error_code:
            return RedirectResponse(
                url=build_app_oauth_redirect_url(
                    "kakao",
                    error=error_code,
                    error_description=error_description,
                ),
                status_code=status.HTTP_302_FOUND,
            )
        if not code:
            return RedirectResponse(
                url=build_app_oauth_redirect_url(
                    "kakao",
                    error="invalid_request",
                    error_description="Authorization code is missing",
                ),
                status_code=status.HTTP_302_FOUND,
            )
        provider_user_id, provider_email = await exchange_kakao_code(code)
        ticket = await create_one_time_social_ticket(
            provider="kakao",
            provider_user_id=provider_user_id,
            provider_email=provider_email,
        )
        return RedirectResponse(
            url=build_app_oauth_redirect_url("kakao", ticket=ticket),
            status_code=status.HTTP_302_FOUND,
        )
    except HTTPException as error:
        return RedirectResponse(
            url=build_app_oauth_redirect_url("kakao", error=error.detail),
            status_code=status.HTTP_302_FOUND,
        )


@router.get("/oauth/naver/callback")
async def naver_social_login_callback(
    code: str | None = Query(None, min_length=1),
    state_value: str = Query(..., alias="state", min_length=1),
    error_code: str | None = Query(None, alias="error"),
    error_description: str | None = Query(None),
):
    """네이버 callback에서 code를 검증한 뒤 앱이 소비할 1회용 ticket을 deep link로 전달한다."""
    try:
        await consume_oauth_state_or_401("naver", state_value)
        if error_code:
            return RedirectResponse(
                url=build_app_oauth_redirect_url(
                    "naver",
                    error=error_code,
                    error_description=error_description,
                ),
                status_code=status.HTTP_302_FOUND,
            )
        if not code:
            return RedirectResponse(
                url=build_app_oauth_redirect_url(
                    "naver",
                    error="invalid_request",
                    error_description="Authorization code is missing",
                ),
                status_code=status.HTTP_302_FOUND,
            )
        provider_user_id, provider_email = await exchange_naver_code(code, state_value)
        ticket = await create_one_time_social_ticket(
            provider="naver",
            provider_user_id=provider_user_id,
            provider_email=provider_email,
        )
        return RedirectResponse(
            url=build_app_oauth_redirect_url("naver", ticket=ticket),
            status_code=status.HTTP_302_FOUND,
        )
    except HTTPException as error:
        return RedirectResponse(
            url=build_app_oauth_redirect_url("naver", error=error.detail),
            status_code=status.HTTP_302_FOUND,
        )


@router.post("/social/ticket/exchange", response_model=SocialTicketExchangeResponse)
async def exchange_social_login_ticket(
    payload: SocialTicketExchangeRequest,
    db: Session = Depends(get_db),
):
    """앱이 전달한 1회용 ticket을 검증해 즉시 로그인 또는 계정 선택 단계로 분기한다."""
    social_identity = await consume_one_time_social_ticket_or_401(payload.ticket)
    social_account = get_social_account(
        db,
        social_identity["provider"],
        social_identity["provider_user_id"],
    )

    if social_account is None:
        return build_social_ticket_exchange_response(
            provider=social_identity["provider"],
            provider_user_id=social_identity["provider_user_id"],
            provider_email=social_identity["provider_email"],
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
        provider=social_identity["provider"],
        provider_user_id=social_identity["provider_user_id"],
        provider_email=social_identity["provider_email"],
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
        print("[social signup] created user.id =", user.id)
        print("[social signup] created user.user_id =", user.user_id)
        print("[social signup] social sub for token =", user.user_id)
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
