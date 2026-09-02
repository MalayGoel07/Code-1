"""Security layer: Supabase Auth + verified JWT, backed by the profiles table.

Legacy authentication code (pwdlib hashing, backend-issued tokens) has been
removed (problem #5). Supabase Auth is the single authentication system:

  1. The Bearer token is verified cryptographically (supabase_config.py).
  2. The user's profile and ROLE are loaded from the `profiles` table â€”
     never trusted from token metadata (problem #4).
  3. Missing profiles are auto-provisioned on first request so that users
     who signed up through the frontend still work seamlessly.
"""

from __future__ import annotations

from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

try:
    from . import supabase_db
    from .supabase_config import SupabaseTokenPayload, verify_supabase_token
except ImportError:
    import supabase_db
    from supabase_config import SupabaseTokenPayload, verify_supabase_token

load_dotenv(encoding="utf-8-sig")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

VALID_ROLES = {"patient", "caretaker"}


class User(BaseModel):
    """Authenticated user resolved from a verified JWT + the profiles table."""

    id: str
    username: str = ""
    email: str
    full_name: str = ""
    role: str = "patient"
    profile: dict | None = None


def _coerce_role(value: str | None) -> str:
    role = (value or "").strip().lower()
    return role if role in VALID_ROLES else "patient"


def _build_user(payload: SupabaseTokenPayload, profile: dict | None) -> User:
    profile = profile or {}
    return User(
        id=payload.sub,
        username=payload.email,
        email=payload.email,
        full_name=profile.get("full_name") or payload.full_name or "",
        # Role authority is the DATABASE row, not the token metadata.
        role=_coerce_role(profile.get("role")),
        profile=profile,
    )


def _provision_profile(payload: SupabaseTokenPayload, token: str | None) -> dict | None:
    """Create the profiles row for a first-time user. DB errors are not fatal
    here; the request proceeds with token-derived display data.

    Security: the initial role is ALWAYS 'patient'. Token metadata is attacker
    controlled (users choose their own user_metadata at signup), so it must
    never grant elevated roles. The declared role is stored only through the
    explicit /auth/setup-profile endpoint.
    """
    role = "patient"
    try:
        return supabase_db.create_profile(
            user_id=payload.sub,
            email=payload.email,
            full_name=payload.full_name,
            role=role,
            token=token,
        )
    except supabase_db.SupabaseRestError:
        return {
            "id": payload.sub,
            "email": payload.email,
            "full_name": payload.full_name,
            "role": role,
        }


def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> User:
    """Verify the Supabase JWT, then load (or lazily create) the profile row.

    Raises 401 for: missing token, invalid/expired token signature, or a
    token without the required subject/email claims.
    """
    if not token:
        raise CREDENTIALS_EXCEPTION

    payload = verify_supabase_token(token)
    if payload is None:
        raise CREDENTIALS_EXCEPTION

    try:
        profile = supabase_db.get_profile_by_id(payload.sub, token=token)
    except supabase_db.SupabaseRestError:
        profile = None

    if profile is None:
        profile = _provision_profile(payload, token)

    return _build_user(payload, profile)


def get_current_user_no_provision(
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> User:
    """Verify the JWT and load the profile WITHOUT auto-provisioning.

    Used by /auth/setup-profile, which must be able to create the profile
    itself with the role the user chose at signup — auto-provisioning first
    would pin the role to 'patient' before onboarding ever runs.
    """
    if not token:
        raise CREDENTIALS_EXCEPTION

    payload = verify_supabase_token(token)
    if payload is None:
        raise CREDENTIALS_EXCEPTION

    try:
        profile = supabase_db.get_profile_by_id(payload.sub, token=token)
    except supabase_db.SupabaseRestError:
        profile = None

    return _build_user(payload, profile)


def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    return current_user


def require_role(current_user: User, *allowed: str) -> User:
    """Assert the DATABASE-backed role is one of the allowed roles."""
    role = (current_user.role or "patient").strip().lower()
    if role not in {r.strip().lower() for r in allowed}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This action requires role: {' or '.join(allowed)}",
        )
    return current_user
