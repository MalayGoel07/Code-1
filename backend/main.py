import io
import json
import os

import pandas as pd
from fastapi import FastAPI, Depends, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
import uvicorn
from db import users_collection
from secruity import Token, UserSignup, authenticate_user, create_access_token, get_password_hash, get_current_active_user, User
from datetime import timedelta
from typing import Annotated
from dotenv import load_dotenv
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from patient import router as patient_router

load_dotenv()
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

app = FastAPI(title="ML_WorkSHop API", version="0.0.1")
app.add_middleware( CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],)
app.include_router(patient_router)

@app.get("/")
async def root():
    return {"message": "Running!"}


#--------------------authentication endpoints--------------------------------------------------------------------------------------------

@app.post("/auth/login")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    normalized_role = (user.role or "patient").strip().lower()
    access_token = create_access_token(
        data={"sub": user.username, "role": normalized_role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token, token_type="bearer", role=normalized_role)


@app.post("/auth/signup")
async def signup(user: UserSignup) -> Token:
    existing = users_collection.find_one({
        "$or": [
            {"username": user.username},
            {"email": user.email},
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    normalized_role = (user.role or "patient").strip().lower()
    if normalized_role not in {"patient", "caretaker"}:
        raise HTTPException(status_code=400, detail="Role must be either patient or caretaker")

    hashed = get_password_hash(user.password)
    users_collection.insert_one({
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "hashed_password": hashed,
        "role": normalized_role,
        "disabled": False,
    })
    access_token = create_access_token(
        data={"sub": user.username, "role": normalized_role}
    )
    return Token(access_token=access_token, token_type="bearer", role=normalized_role)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
