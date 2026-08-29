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

load_dotenv()
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

app = FastAPI(title="ML_WorkSHop API", version="0.0.1")
app.add_middleware( CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],)

@app.get("/")
async def root():
    return {"message": "Running!"}


#--------------------authentication endpoints--------------------------------------------------------------------------------------------

@app.post("/auth/login")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token( data={"sub": user.username}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return Token(access_token=access_token, token_type="bearer")


@app.post("/auth/signup")
async def signup(user: UserSignup) -> Token:
    existing = users_collection.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed = get_password_hash(user.password)
    users_collection.insert_one({
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "hashed_password": hashed,
        "disabled": False
    })
    access_token = create_access_token(data={"sub": user.username})
    return Token(access_token=access_token, token_type="bearer")

class ProfileUpdate(BaseModel):
    full_name: str | None = None
    nickname: str | None = None
    instructions: str | None = None

@app.put("/me")
async def update_me(
    data: ProfileUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    users_collection.update_one(
        {"username": current_user.username},
        {
            "$set": {
                "full_name": data.full_name,
                "nickname": data.nickname,
                "instructions": data.instructions
            }
        }
    )

    return {"message": "Profile updated"}

@app.get("/me")
async def get_me(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    user = users_collection.find_one(
        {"username": current_user.username}
    )

    return {
        "username": user.get("full_name", user["username"]),
        "email": user.get("email", ""),
        "nickname": user.get("nickname", ""),
        "instructions": user.get("instructions", "")
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
