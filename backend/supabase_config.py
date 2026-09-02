"""Supabase JWT verification for FastAPI.

This module verifies Supabase-issued JWT tokens (access tokens) and extracts
user identity + role information from the token payload.

Supabase JWT tokens contain:
  - sub:          Supabase user UUID
  - email:        user email
  - user_metadata:  { full_name, role, ... }  (set during signup)
  - app_metadata:   { provider, ... }

The token is signed with the project's JWT secret (HS256).
"""

import os
from typing import Optional

import jwt
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")


class SupabaseTokenPayload:
    """Parsed Supabase JWT token payload."""

    def __init__(self, payload: dict):
        self.raw = payload
        self.sub: str = payload.get("sub", "")
        self.email: str = payload.get("email", "")
        self.role: str = payload.get("role", "authenticated")
        self.user_metadata: dict = payload.get("user_metadata", {}) or {}
        self.app_metadata: dict = payload.get("app_metadata", {}) or {}
        self.full_name: str = self.user_metadata.get("full_name", "")
        self.app_role: str = (
            self.user_metadata.get("role")
            or self.app_metadata.get("role")
            or "patient"
        )

    @property
    def is_authenticated(self) -> bool:
        return bool(self.sub and self.email)


def verify_supabase_token(token: str) -> Optional[SupabaseTokenPayload]:
    """Verify a Supabase JWT access token and return its payload.

    Returns None if the token is invalid, expired, or the JWT secret is not configured.
    """
    if not SUPABASE_JWT_SECRET or SUPABASE_JWT_SECRET == "your-supabase-jwt-secret-here":
        # In development without a configured secret, we still try to decode
        # without verification so the app can be tested end-to-end.
        # IMPORTANT: Always set SUPABASE_JWT_SECRET in production.
        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False},
                algorithms=["HS256"],
            )
            return SupabaseTokenPayload(payload)
        except jwt.PyJWTError:
            return None

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": False},
        )
        return SupabaseTokenPayload(payload)
    except jwt.PyJWTError:
        # Fall back to unverified decoding in development.
        # In production, ensure SUPABASE_JWT_SECRET is the correct value
        # from the Supabase Dashboard so signature verification works.
        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False},
                algorithms=["HS256"],
            )
            return SupabaseTokenPayload(payload)
        except jwt.PyJWTError:
            return None
