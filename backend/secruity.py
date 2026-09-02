from datetime import datetime, timedelta, timezone
import os
from typing import Annotated

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from pwdlib import PasswordHash

try:
    from .db import users_collection
    from .supabase_config import verify_supabase_token
except ImportError:
    from db import users_collection
    from supabase_config import verify_supabase_token

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me-please-use-env")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)
password_hash = PasswordHash.recommended()


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str | None = None


class User(BaseModel):
    username: str
    email: str | None = None
    full_name: str | None = None
    role: str | None = None
    disabled: bool = False


class UserSignup(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str = "patient"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=30))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_user_by_email(email: str) -> User | None:
    """Look up a user in the in-memory store by email."""
    user = users_collection.find_one({"email": email})
    if not user:
        return None
    return User(
        username=user.get("username", user.get("email", "")),
        email=user.get("email"),
        full_name=user.get("full_name"),
        role=user.get("role", "patient"),
        disabled=user.get("disabled", False),
    )


async def get_current_user(token: Annotated[str | None, Depends(oauth2_scheme)]) -> User:
    """Authenticate requests using a Supabase JWT access token.

    The frontend now uses Supabase Auth directly and sends the Supabase
    access_token in the Authorization: Bearer <token> header.  We verify
    that token, then look up (or lazily create) the matching profile in
    the in-memory store so the rest of the application continues to work
    unchanged.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    payload = verify_supabase_token(token)
    if payload is None or not payload.is_authenticated:
        raise credentials_exception

    # Look up the user profile by email (email is the stable Supabase identifier).
    profile = users_collection.find_one({"email": payload.email})

    if profile is None:
        # First login — create a profile in the in-memory store.
        normalized_role = (payload.app_role or "patient").strip().lower()
        if normalized_role not in {"patient", "caretaker"}:
            normalized_role = "patient"

        profile_doc = {
            "username": payload.email,
            "email": payload.email,
            "full_name": payload.full_name or payload.email.split("@")[0],
            "role": normalized_role,
            "disabled": False,
            "supabase_id": payload.sub,
            "medications": [],
            "reminders": [],
            "mood_history": [],
            "games_played": [],
            "caregiver_email": "",
            "pending_caregiver_email": "",
            "pending_caregiver_name": "",
        }
        users_collection.insert_one(profile_doc)
        profile = profile_doc

    return User(
        username=profile.get("username", payload.email),
        email=profile.get("email", payload.email),
        full_name=profile.get("full_name", payload.full_name),
        role=profile.get("role", payload.app_role),
        disabled=profile.get("disabled", False),
    )


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")

    return current_user
