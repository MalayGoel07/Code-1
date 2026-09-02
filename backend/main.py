import io
import os

import pandas as pd
from fastapi import FastAPI, Depends, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import uuid
from datetime import timedelta
from typing import Annotated
from dotenv import load_dotenv
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

try:
    from .db import users_collection
    from .secruity import Token, get_current_active_user, User
    from .patient import router as patient_router
except ImportError:
    from db import users_collection
    from secruity import Token, get_current_active_user, User
    from patient import router as patient_router

load_dotenv()

app = FastAPI(title="ML_WorkSHop API", version="0.0.1")
app.add_middleware( CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],)
app.include_router(patient_router)

@app.get("/")
async def root():
    return {"message": "Running!"}


#--------------------authentication endpoints--------------------------------------------------------------------------------------------
#
# Auth is now handled by Supabase on the frontend.  These endpoints let the
# React app confirm that the FastAPI backend can verify the Supabase JWT and
# that the user profile exists (or has been lazily created).
#

@app.get("/auth/me")
async def auth_me(current_user: Annotated[User, Depends(get_current_active_user)]):
    """Return the authenticated user's profile from the in-memory store."""
    profile = users_collection.find_one({"email": current_user.email})
    return {
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "profile": profile,
    }


@app.post("/auth/setup-profile")
async def setup_profile(
    data: dict,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Let a newly-signed-up user set their role and full name on the backend profile.

    The frontend calls this immediately after Supabase signup so the
    in-memory store has the correct role before the user navigates.
    """
    updates = {}
    if "full_name" in data:
        updates["full_name"] = data["full_name"]
    if "role" in data:
        role = data["role"].strip().lower()
        if role not in {"patient", "caretaker"}:
            raise HTTPException(status_code=400, detail="Role must be patient or caretaker")
        updates["role"] = role
    if "age" in data:
        updates["age"] = data["age"]
    if "preferred_language" in data:
        updates["preferred_language"] = data["preferred_language"]
    if "caregiver_email" in data:
        updates["caregiver_email"] = data["caregiver_email"]

    if not updates:
        raise HTTPException(status_code=400, detail="No profile fields provided")

    users_collection.update_one({"email": current_user.email}, {"$set": updates})
    updated = users_collection.find_one({"email": current_user.email})
    return {"message": "Profile updated", "profile": updated}


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
    time: str = ""
    type: str = "Medicine"
    # Scheduling support (P1.4): Daily / Twice daily / Weekly
    frequency: str = "Daily"
    times: list[str] = []
    day: str = ""
    # Type-specific details
    dosage: str = ""
    duration: str = ""


WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _normalize_reminder_frequency(frequency: str) -> str:
    f = (frequency or "").strip().lower()
    if f in {"twice daily", "twice a day", "twice", "2 times daily", "2x daily"}:
        return "Twice daily"
    if f in {"weekly", "once a week"}:
        return "Weekly"
    return "Daily"


class CaretakerMedicationCreate(BaseModel):
    patient_email: str
    name: str
    dosage: str
    time: str
    frequency: str = "Daily"
    instructions: str = ""


class CaretakerMedicationUpdate(BaseModel):
    patient_email: str
    name: str | None = None
    dosage: str | None = None
    time: str | None = None
    frequency: str | None = None
    instructions: str | None = None


def _require_caretaker(current_user):
    if (current_user.role or "patient").strip().lower() != "caretaker":
        raise HTTPException(status_code=403, detail="Only caretakers can manage medications")


def _find_linked_patient(current_user, patient_email):
    patient = users_collection.find_one({"email": (patient_email or "").strip()})
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found for that email")
    if (patient.get("caregiver_email", "") or "").strip().lower() != (current_user.email or "").strip().lower():
        raise HTTPException(status_code=403, detail="That patient is not linked to your caretaker account")
    return patient


def _normalize_medication_fields(name, dosage, time, frequency, instructions):
    name = (name or "").strip()
    dosage = (dosage or "").strip()
    time = (time or "").strip()

    if not name:
        raise HTTPException(status_code=400, detail="Medicine name is required")
    if not dosage:
        raise HTTPException(status_code=400, detail="Dosage is required")
    if not time:
        raise HTTPException(status_code=400, detail="Time is required")

    return name, dosage, time, (frequency or "").strip() or "Daily", (instructions or "").strip()


def _medication_reminder_description(medication):
    parts = [f"Dosage: {medication['dosage']}"]
    if medication.get("instructions"):
        parts.append(f"Instructions: {medication['instructions']}")
    return " — ".join(parts)


@app.post("/caretaker/reminders")
async def add_reminder_for_patient(
    reminder: CaretakerReminderRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    if (current_user.role or "patient").lower() != "caretaker":
        raise HTTPException(status_code=403, detail="Only caretakers can add reminders")

    patient = _find_linked_patient(current_user, reminder.patient_email)

    title = (reminder.title or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Reminder title is required")

    frequency = _normalize_reminder_frequency(reminder.frequency)

    times = [(t or "").strip() for t in (reminder.times or []) if (t or "").strip()]
    if not times and (reminder.time or "").strip():
        times = [reminder.time.strip()]
    if not times:
        raise HTTPException(status_code=400, detail="At least one reminder time is required")
    if frequency == "Twice daily" and len(times) < 2:
        raise HTTPException(status_code=400, detail="Twice daily reminders need two times")

    day = (reminder.day or "").strip()
    if frequency == "Weekly" and not day:
        raise HTTPException(status_code=400, detail="Weekly reminders need a day of the week")

    reminder_type = (reminder.type or "Medicine").strip() or "Medicine"
    schedule_id = uuid.uuid4().hex
    created_reminders = []

    for slot in times[:2]:
        created_reminders.append({
            "id": uuid.uuid4().hex,
            "schedule_id": schedule_id,
            "title": title,
            "description": (reminder.description or "").strip(),
            "time": slot,
            "type": reminder_type,
            "frequency": frequency,
            "day": day,
            "dosage": (reminder.dosage or "").strip(),
            "duration": (reminder.duration or "").strip(),
            "completed": False,
        })

    reminders = list(patient.get("reminders", []))
    reminders.extend(created_reminders)
    users_collection.update_one({"email": reminder.patient_email}, {"$set": {"reminders": reminders}})
    return {
        "message": "Reminder sent to patient",
        "reminders": created_reminders,
        "reminder": created_reminders[0],
    }


#--------------------caretaker -> patient link requests-----------------------------------------------------------------------------

class CaretakerLinkRequest(BaseModel):
    patient_email: str


@app.post("/caretaker/link-request")
async def send_caretaker_link_request(
    data: CaretakerLinkRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    _require_caretaker(current_user)

    patient_email = (data.patient_email or "").strip()
    if not patient_email:
        raise HTTPException(status_code=400, detail="Patient email is required")

    patient = users_collection.find_one({"email": patient_email})
    if patient is None:
        raise HTTPException(status_code=404, detail="No patient found with that email")

    me = (current_user.email or "").strip()
    existing = (patient.get("caregiver_email") or "").strip()
    pending = (patient.get("pending_caregiver_email") or "").strip()

    if existing and existing.lower() == me.lower():
        return {"message": "Patient is already linked to you", "status": "already_linked"}
    if existing:
        raise HTTPException(status_code=400, detail="That patient already has a caregiver")
    if pending and pending.lower() == me.lower():
        return {"message": "Request already sent — waiting for the patient to approve", "status": "pending"}
    if pending:
        raise HTTPException(status_code=409, detail="That patient already has a pending request from another caregiver")

    users_collection.update_one(
        {"email": patient_email},
        {"$set": {
            "pending_caregiver_email": me,
            "pending_caregiver_name": (current_user.full_name or "").strip(),
        }},
    )
    return {"message": "Link request sent to patient", "status": "pending"}


@app.get("/caretaker/link-requests")
async def list_caretaker_link_requests(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    _require_caretaker(current_user)

    me = (current_user.email or "").strip()
    pending_patients = users_collection.find({"pending_caregiver_email": me})
    requests = [
        {
            "patient_email": patient.get("email"),
            "patient_name": patient.get("full_name", "") or "",
            "status": "pending",
        }
        for patient in pending_patients
    ]
    return {"requests": requests, "count": len(requests)}


@app.delete("/caretaker/link-request/{patient_email}")
async def cancel_caretaker_link_request(
    patient_email: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    _require_caretaker(current_user)

    patient = users_collection.find_one({"email": patient_email.strip()})
    if patient is None:
        raise HTTPException(status_code=404, detail="No patient found with that email")
    if (patient.get("pending_caregiver_email") or "").strip().lower() != (
        current_user.email or ""
    ).strip().lower():
        raise HTTPException(status_code=404, detail="No pending request from you for that patient")

    users_collection.update_one(
        {"email": patient_email.strip()},
        {"$set": {"pending_caregiver_email": "", "pending_caregiver_name": ""}},
    )
    return {"message": "Link request cancelled"}


#--------------------caretaker medication management--------------------------------------------------------------------------------------------

@app.get("/caretaker/medications")
async def get_caretaker_medications(
    patient_email: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    _require_caretaker(current_user)
    patient = _find_linked_patient(current_user, patient_email)
    return {
        "patient_email": patient.get("email"),
        "medications": patient.get("medications", []),
    }


@app.post("/caretaker/medications")
async def add_caretaker_medication(
    data: CaretakerMedicationCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    _require_caretaker(current_user)
    patient = _find_linked_patient(current_user, data.patient_email)

    name, dosage, time, frequency, instructions = _normalize_medication_fields(
        data.name, data.dosage, data.time, data.frequency, data.instructions
    )

    medication = {
        "id": uuid.uuid4().hex,
        "name": name,
        "dosage": dosage,
        "time": time,
        "frequency": frequency,
        "instructions": instructions,
    }

    medications = list(patient.get("medications", []))
    medications.append(medication)

    # The medication also appears in the patient's existing reminder list so the
    # patient can complete it through the normal reminder completion flow.
    reminder_item = {
        "id": uuid.uuid4().hex,
        "title": name,
        "description": _medication_reminder_description(medication),
        "time": time,
        "type": "Medicine",
        "completed": False,
        "medication_id": medication["id"],
    }
    reminders = list(patient.get("reminders", []))
    reminders.append(reminder_item)

    users_collection.update_one(
        {"username": patient["username"]},
        {"$set": {"medications": medications, "reminders": reminders}},
    )

    return {"message": "Medication added", "medication": medication}


@app.put("/caretaker/medications/{medication_id}")
async def update_caretaker_medication(
    medication_id: str,
    data: CaretakerMedicationUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    _require_caretaker(current_user)
    patient = _find_linked_patient(current_user, data.patient_email)

    medications = list(patient.get("medications", []))
    medication = next((item for item in medications if item.get("id") == medication_id), None)
    if medication is None:
        raise HTTPException(status_code=404, detail="Medication not found")

    if data.name is not None:
        medication["name"] = data.name.strip()
    if data.dosage is not None:
        medication["dosage"] = data.dosage.strip()
    if data.time is not None:
        medication["time"] = data.time.strip()
    if data.frequency is not None:
        medication["frequency"] = data.frequency.strip() or "Daily"
    if data.instructions is not None:
        medication["instructions"] = data.instructions.strip()

    if not medication.get("name") or not medication.get("dosage") or not medication.get("time"):
        raise HTTPException(status_code=400, detail="Medicine name, dosage and time are required")

    # Keep the linked reminder in sync so the patient still sees the latest details.
    reminders = list(patient.get("reminders", []))
    for reminder in reminders:
        if reminder.get("medication_id") == medication_id:
            reminder["title"] = medication["name"]
            reminder["time"] = medication["time"]
            reminder["description"] = _medication_reminder_description(medication)

    users_collection.update_one(
        {"username": patient["username"]},
        {"$set": {"medications": medications, "reminders": reminders}},
    )

    return {"message": "Medication updated", "medication": medication}


@app.delete("/caretaker/medications/{medication_id}")
async def delete_caretaker_medication(
    medication_id: str,
    patient_email: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    _require_caretaker(current_user)
    patient = _find_linked_patient(current_user, patient_email)

    medications = list(patient.get("medications", []))
    updated_medications = [
        medication for medication in medications if medication.get("id") != medication_id
    ]
    if len(updated_medications) == len(medications):
        raise HTTPException(status_code=404, detail="Medication not found")

    # Remove the linked reminder too, so the patient's reminder list stays in sync.
    reminders = list(patient.get("reminders", []))
    updated_reminders = [
        reminder for reminder in reminders if reminder.get("medication_id") != medication_id
    ]

    users_collection.update_one(
        {"username": patient["username"]},
        {"$set": {"medications": updated_medications, "reminders": updated_reminders}},
    )

    return {
        "message": "Medication deleted",
        "medications": updated_medications,
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
