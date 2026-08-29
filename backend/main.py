import io
import json
import os

import pandas as pd
from fastapi import FastAPI, Depends, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
import uvicorn
import uuid
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


@app.get("/caretaker/report")
async def caretaker_report(current_user: Annotated[User, Depends(get_current_active_user)]):
    if (current_user.role or "patient").lower() != "caretaker":
        raise HTTPException(status_code=403, detail="Only caretakers can view reports")

    patients = list(users_collection.find({"caregiver_email": current_user.email}))
    report = []
    for patient in patients:
        report.append({
            "username": patient.get("username"),
            "full_name": patient.get("full_name", ""),
            "email": patient.get("email"),
            "current_mood": patient.get("current_mood"),
            "mood_history": patient.get("mood_history", []),
            "games_played": patient.get("games_played", []),
        })

    return {"patients": report, "count": len(report)}


class CaretakerReminderRequest(BaseModel):
    patient_email: str
    title: str
    description: str = ""
    time: str
    type: str = "Medicine"


@app.post("/caretaker/reminders")
async def add_reminder_for_patient(
    reminder: CaretakerReminderRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    if (current_user.role or "patient").lower() != "caretaker":
        raise HTTPException(status_code=403, detail="Only caretakers can add reminders")

    patient = users_collection.find_one({"email": reminder.patient_email})
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found for that email")

    reminder_item = {
        "id": uuid.uuid4().hex,
        "title": reminder.title,
        "description": reminder.description,
        "time": reminder.time,
        "type": reminder.type,
        "completed": False,
    }

    reminders = list(patient.get("reminders", []))
    reminders.append(reminder_item)
    users_collection.update_one({"email": reminder.patient_email}, {"$set": {"reminders": reminders}})
    return {"message": "Reminder sent to patient", "reminder": reminder_item}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
