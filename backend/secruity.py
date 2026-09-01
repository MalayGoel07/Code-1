from datetime import datetime, timedelta, timezone
import os
from typing import Annotated

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from pwdlib import PasswordHash

from db import users_collection

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me-please-use-env")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
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


def authenticate_user(identifier: str, password: str, role: str | None = None) -> User | None:
    query = {
        "$or": [
            {"username": identifier},
            {"email": identifier},
        ]
    }
    if role:
        query["role"] = role

    user = users_collection.find_one(query)
    if not user or not verify_password(password, user["hashed_password"]):
        return None

    return User(
        username=user["username"],
        email=user.get("email"),
        full_name=user.get("full_name"),
        role=user.get("role", "patient"),
        disabled=user.get("disabled", False),
    )


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=30))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError as exc:
        raise credentials_exception from exc

    user = users_collection.find_one({"username": username})
    if user is None:
        raise credentials_exception

    return User(
        username=user["username"],
        email=user.get("email"),
        full_name=user.get("full_name"),
        role=user.get("role", "patient"),
        disabled=user.get("disabled", False),
    )


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")

    return current_user
