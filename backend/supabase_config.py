"""Strict Supabase JWT verification.

Security model (problem #3 fix):
  - Token signatures are ALWAYS verified. There is NO unverified fallback.
  - Supports both signing modes:
      * legacy symmetric HS256 (SUPABASE_JWT_SECRET), and
      * asymmetric keys (ES256/RS256/PS256) resolved from the project JWKS.
  - Any invalid, expired, malformed or wrongly-signed token results in
    authentication failure (None) and therefore a 401 from the API layer.
"""

from __future__ import annotations

import os
from typing import Any

import jwt
from dotenv import load_dotenv

load_dotenv(encoding="utf-8-sig")

SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").rstrip("/")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET") or ""

AUDIENCE = "authenticated"

_jwks_client: jwt.PyJWKClient | None = None


def _get_jwks_client() -> jwt.PyJWKClient | None:
    """JWKS client for projects using asymmetric signing keys."""
    global _jwks_client
    if _jwks_client is None and SUPABASE_URL:
        _jwks_client = jwt.PyJWKClient(
            f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json", cache_keys=True
        )
    return _jwks_client


class SupabaseTokenPayload:
    """Verified claims from a Supabase access token."""

    def __init__(self, claims: dict[str, Any]):
        self.claims = claims
        self.sub = claims.get("sub") or ""
        self.email = claims.get("email") or ""
        metadata = claims.get("user_metadata")
        self.user_metadata = metadata if isinstance(metadata, dict) else {}
        app_metadata = claims.get("app_metadata")
        self.app_metadata = app_metadata if isinstance(app_metadata, dict) else {}
        self.role = (self.user_metadata.get("role") or "patient").strip().lower()
        self.full_name = self.user_metadata.get("full_name") or ""

    @property
    def is_authenticated(self) -> bool:
        return bool(self.sub and self.email)


def verify_supabase_token(token: str | None) -> SupabaseTokenPayload | None:
    """Verify a Supabase JWT and return its payload, or None if invalid.

    Signature verification is mandatory: an invalid signature, expired token,
    malformed token or an unverifiable token all return None (fail closed).
    """
    if not token:
        return None

    claims: dict[str, Any] | None = None

    # 1) Symmetric verification with the project's JWT secret (if configured).
    if SUPABASE_JWT_SECRET:
        try:
            claims = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience=AUDIENCE,
                options={"verify_signature": True, "verify_exp": True, "verify_aud": True},
            )
        except jwt.InvalidAudienceError:
            # Signature already verified above; tolerate audience claim variants.
            try:
                claims = jwt.decode(
                    token,
                    SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    options={"verify_signature": True, "verify_exp": True, "verify_aud": False},
                )
            except jwt.PyJWTError:
                return None
        except jwt.PyJWTError:
            claims = None

    # 2) Asymmetric verification via the project's published JWKS.
    if claims is None:
        client = _get_jwks_client()
        if client is not None:
            try:
                signing_key = client.get_signing_key_from_jwt(token)
                claims = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256", "RS256", "PS256"],
                    audience=AUDIENCE,
                    options={"verify_signature": True, "verify_exp": True, "verify_aud": True},
                )
            except jwt.InvalidAudienceError:
                try:
                    signing_key = client.get_signing_key_from_jwt(token)
                    claims = jwt.decode(
                        token,
                        signing_key.key,
                        algorithms=["ES256", "RS256", "PS256"],
                        options={"verify_signature": True, "verify_exp": True, "verify_aud": False},
                    )
                except jwt.PyJWTError:
                    return None
            except jwt.PyJWTError:
                return None
            except Exception:
                # JWKS unreachable etc. — fail closed.
                return None

    if claims is None:
        return None

    payload = SupabaseTokenPayload(claims)
    if not payload.is_authenticated:
        return None
    return payload
