import asyncio
import base64
from datetime import datetime, timedelta, timezone
import hashlib
import os
import unittest
from unittest.mock import AsyncMock, patch

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa
from jose import jwt


# 로컬 비밀값과 무관하게 설정 모듈을 가져올 수 있도록 테스트 전용 값을 사용한다.
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("REFRESH_TOKEN_SECRET", "test-refresh-secret")
os.environ.setdefault("GOOGLE_WEB_CLIENT_ID", "test-google-client")
os.environ.setdefault("KAKAO_REST_API_KEY", "test-kakao-key")
os.environ.setdefault("KAKAO_CLIENT_SECRET", "test-kakao-secret")
os.environ.setdefault("KAKAO_REDIRECT_URI", "https://example.com/kakao")
os.environ.setdefault("KAKAO_ADMIN_KEY", "test-kakao-admin")
os.environ.setdefault("NAVER_CLIENT_ID", "test-naver-client")
os.environ.setdefault("NAVER_CLIENT_SECRET", "test-naver-secret")
os.environ.setdefault("NAVER_REDIRECT_URI", "https://example.com/naver")

from app.config import settings
from app.services import apple_auth_service
from app.services.social_auth_service import (
    create_social_temp_token,
    verify_social_temp_token,
)


def _base64url_uint(value: int) -> str:
    raw_value = value.to_bytes((value.bit_length() + 7) // 8, "big")
    return base64.urlsafe_b64encode(raw_value).rstrip(b"=").decode("ascii")


class AppleAuthServiceTest(unittest.TestCase):
    def setUp(self) -> None:
        self.original_client_id = settings.APPLE_CLIENT_ID
        self.original_encryption_key = settings.APPLE_TOKEN_ENCRYPTION_KEY
        self.original_team_id = settings.APPLE_TEAM_ID
        self.original_key_id = settings.APPLE_KEY_ID
        self.original_private_key = settings.APPLE_PRIVATE_KEY
        settings.APPLE_CLIENT_ID = "com.nextvine.scolioscan"
        settings.APPLE_TOKEN_ENCRYPTION_KEY = Fernet.generate_key().decode("ascii")

    def tearDown(self) -> None:
        settings.APPLE_CLIENT_ID = self.original_client_id
        settings.APPLE_TOKEN_ENCRYPTION_KEY = self.original_encryption_key
        settings.APPLE_TEAM_ID = self.original_team_id
        settings.APPLE_KEY_ID = self.original_key_id
        settings.APPLE_PRIVATE_KEY = self.original_private_key

    def test_refresh_token_is_encrypted_and_restored(self) -> None:
        plain_token = "apple-refresh-token"

        encrypted_token = apple_auth_service.encrypt_apple_refresh_token(plain_token)

        self.assertNotEqual(encrypted_token, plain_token)
        self.assertEqual(
            apple_auth_service.decrypt_apple_refresh_token(encrypted_token),
            plain_token,
        )

    def test_apple_refresh_token_survives_social_temp_token(self) -> None:
        encrypted_token = apple_auth_service.encrypt_apple_refresh_token(
            "apple-refresh-token"
        )
        social_temp_token = create_social_temp_token(
            provider="apple",
            provider_user_id="apple-user-id",
            provider_email="relay@privaterelay.appleid.com",
            provider_refresh_token=encrypted_token,
        )

        identity = verify_social_temp_token(social_temp_token)

        self.assertEqual(identity["provider"], "apple")
        self.assertEqual(identity["provider_user_id"], "apple-user-id")
        self.assertEqual(identity["provider_refresh_token"], encrypted_token)

    def test_identity_token_signature_and_claims_are_verified(self) -> None:
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        public_numbers = private_key.public_key().public_numbers()
        key_id = "apple-test-key"
        apple_jwk = {
            "kty": "RSA",
            "kid": key_id,
            "use": "sig",
            "alg": "RS256",
            "n": _base64url_uint(public_numbers.n),
            "e": _base64url_uint(public_numbers.e),
        }
        now = datetime.now(timezone.utc)
        identity_token = jwt.encode(
            {
                "iss": apple_auth_service.APPLE_ISSUER,
                "aud": settings.APPLE_CLIENT_ID,
                "sub": "apple-user-id",
                "email": "relay@privaterelay.appleid.com",
                "iat": now,
                "exp": now + timedelta(minutes=5),
            },
            private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption(),
            ),
            algorithm="RS256",
            headers={"kid": key_id},
        )

        with patch.object(
            apple_auth_service,
            "_get_apple_jwks",
            new=AsyncMock(return_value={"keys": [apple_jwk]}),
        ):
            provider_user_id, provider_email = asyncio.run(
                apple_auth_service.verify_apple_identity(identity_token)
            )

        self.assertEqual(provider_user_id, "apple-user-id")
        self.assertEqual(provider_email, "relay@privaterelay.appleid.com")

    def test_exchanged_identity_token_verifies_access_token_hash(self) -> None:
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        public_numbers = private_key.public_key().public_numbers()
        key_id = "apple-exchange-key"
        apple_jwk = {
            "kty": "RSA",
            "kid": key_id,
            "use": "sig",
            "alg": "RS256",
            "n": _base64url_uint(public_numbers.n),
            "e": _base64url_uint(public_numbers.e),
        }
        access_token = "apple-access-token"
        access_token_hash = base64.urlsafe_b64encode(
            hashlib.sha256(access_token.encode("ascii")).digest()[:16]
        ).rstrip(b"=").decode("ascii")
        now = datetime.now(timezone.utc)
        identity_token = jwt.encode(
            {
                "iss": apple_auth_service.APPLE_ISSUER,
                "aud": settings.APPLE_CLIENT_ID,
                "sub": "apple-user-id",
                "iat": now,
                "exp": now + timedelta(minutes=5),
                "at_hash": access_token_hash,
            },
            private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption(),
            ),
            algorithm="RS256",
            headers={"kid": key_id},
        )

        with patch.object(
            apple_auth_service,
            "_get_apple_jwks",
            new=AsyncMock(return_value={"keys": [apple_jwk]}),
        ):
            provider_user_id, provider_email = asyncio.run(
                apple_auth_service.verify_apple_identity(
                    identity_token,
                    access_token=access_token,
                )
            )

        self.assertEqual(provider_user_id, "apple-user-id")
        self.assertIsNone(provider_email)

    def test_client_secret_uses_apple_identifiers(self) -> None:
        private_key = ec.generate_private_key(ec.SECP256R1())
        settings.APPLE_TEAM_ID = "APPLETEAMID"
        settings.APPLE_KEY_ID = "APPLEKEYID"
        settings.APPLE_PRIVATE_KEY = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode("utf-8")

        client_secret = apple_auth_service.create_apple_client_secret()
        header = jwt.get_unverified_header(client_secret)
        claims = jwt.get_unverified_claims(client_secret)

        self.assertEqual(header["alg"], "ES256")
        self.assertEqual(header["kid"], settings.APPLE_KEY_ID)
        self.assertEqual(claims["iss"], settings.APPLE_TEAM_ID)
        self.assertEqual(claims["sub"], settings.APPLE_CLIENT_ID)
        self.assertEqual(claims["aud"], apple_auth_service.APPLE_ISSUER)


if __name__ == "__main__":
    unittest.main()
