from datetime import datetime, timezone
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from db import users_collection
from secruity import User, get_current_active_user

router = APIRouter(prefix="/patient", tags=["patient"])


class PatientProfileUpdate(BaseModel):
    full_name: str | None = None
    age: int | None = None
    preferred_language: str | None = None
    caregiver_email: str | None = None


class ReminderItem(BaseModel):
    id: str
    title: str
    description: str = ""
    time: str
    type: str = "Medicine"
    completed: bool = False


class ReminderSubmission(BaseModel):
    title: str
    description: str = ""
    time: str
    type: str = "Medicine"


class ReminderCompletion(BaseModel):
    reminder_id: str


class GameCompletionEntry(BaseModel):
    game_id: str
    game_name: str
    completed_at: str | None = None


class MoodSelection(BaseModel):
    mood: str
    note: str | None = None


def _sanitize_reminders(reminders):
    cleaned = []
    for reminder in reminders:
        title = str(reminder.get("title", "")).strip()
        normalized = title.lower()
        if normalized.startswith("trial") or normalized.startswith("trail"):
            continue
        cleaned.append(reminder)
    return cleaned


@router.get("/me")
async def get_patient_profile( current_user: Annotated[User, Depends(get_current_active_user)]):
    user = users_collection.find_one({"username": current_user.username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    games_played = user.get("games_played", [])
    return {
        "username": user.get("username", current_user.username),
        "email": user.get("email", ""),
        "full_name": user.get("full_name", current_user.full_name or ""),
        "age": user.get("age"),
        "preferred_language": user.get("preferred_language", "English"),
        "caregiver_email": user.get("caregiver_email", ""),
        "current_mood": user.get("current_mood"),
        "mood_history": user.get("mood_history", []),
        "games_played": games_played,
        "games_completed_count": len(games_played),
    }


@router.put("/me")
async def update_patient_profile( data: PatientProfileUpdate,current_user: Annotated[User, Depends(get_current_active_user)],):
    updates = {}
    if data.full_name is not None:
        updates["full_name"] = data.full_name
    if data.age is not None:
        updates["age"] = data.age
    if data.preferred_language is not None:
        updates["preferred_language"] = data.preferred_language
    if data.caregiver_email is not None:
        updates["caregiver_email"] = data.caregiver_email
    if not updates:
        raise HTTPException(status_code=400, detail="No profile fields provided")
    users_collection.update_one({"username": current_user.username}, {"$set": updates})
    updated_user = users_collection.find_one({"username": current_user.username})
    return {
        "message": "Profile updated",
        "profile": {
            "full_name": updated_user.get("full_name", ""),
            "age": updated_user.get("age"),
            "preferred_language": updated_user.get("preferred_language", "English"),
            "caregiver_email": updated_user.get("caregiver_email", ""),
            "games_played": updated_user.get("games_played", []),
        },
    }


@router.post("/mood")
async def save_mood(data: MoodSelection, current_user: Annotated[User, Depends(get_current_active_user)]):
    mood = (data.mood or "").strip().lower()
    if mood not in {"good", "okay", "low"}:
        raise HTTPException(status_code=400, detail="Mood must be good, okay, or low")

    user = users_collection.find_one({"username": current_user.username})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    history = list(user.get("mood_history", []))
    entry = {
        "mood": mood,
        "label": {"good": "Good", "okay": "Okay", "low": "Not good"}[mood],
        "selected_at": datetime.now(timezone.utc).isoformat(),
    }
    if data.note:
        entry["note"] = data.note
    history.append(entry)

    users_collection.update_one(
        {"username": current_user.username},
        {"$set": {"current_mood": mood, "mood_history": history}},
    )
    return {"message": "Mood saved", "current_mood": mood, "mood_history": history}


@router.get("/mood-history")
async def get_mood_history(current_user: Annotated[User, Depends(get_current_active_user)]):
    user = users_collection.find_one({"username": current_user.username})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "current_mood": user.get("current_mood"),
        "mood_history": user.get("mood_history", []),
    }


@router.post("/game-complete")
async def record_game_completed(data: GameCompletionEntry, current_user: Annotated[User, Depends(get_current_active_user)]):
    game_id = (data.game_id or "").strip()
    game_name = (data.game_name or game_id or "Unknown Game").strip()
    if not game_id:
        raise HTTPException(status_code=400, detail="Game ID is required")

    user = users_collection.find_one({"username": current_user.username})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    games_played = list(user.get("games_played", []))
    games_played.append({
        "game_id": game_id,
        "game_name": game_name,
        "completed_at": data.completed_at or datetime.now(timezone.utc).isoformat(),
    })

    users_collection.update_one({"username": current_user.username}, {"$set": {"games_played": games_played}})
    return {
        "message": "Game completion recorded",
        "games_played": games_played,
        "count": len(games_played),
    }


@router.get("/reminders")
async def get_patient_reminders(current_user: Annotated[User, Depends(get_current_active_user)]):
    user = users_collection.find_one({"username": current_user.username})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    raw_reminders = list(user.get("reminders", []))
    reminders = _sanitize_reminders(raw_reminders)

    if len(reminders) != len(raw_reminders):
        users_collection.update_one(
            {"username": current_user.username},
            {"$set": {"reminders": reminders}},
        )

    return {
        "reminders": reminders,
        "done_count": user.get("completed_reminders_count", 0),
    }


@router.post("/reminders")
async def add_patient_reminder(data: ReminderSubmission, current_user: Annotated[User, Depends(get_current_active_user)]):
    user = users_collection.find_one({"username": current_user.username})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    reminder = {
        "id": uuid.uuid4().hex,
        "title": data.title,
        "description": data.description,
        "time": data.time,
        "type": data.type,
        "completed": False,
    }
    reminders = list(user.get("reminders", []))
    reminders.append(reminder)
    users_collection.update_one({"username": current_user.username}, {"$set": {"reminders": reminders}})
    return {"message": "Reminder added", "reminder": reminder}


@router.post("/reminders/complete")
async def complete_patient_reminder(data: ReminderCompletion, current_user: Annotated[User, Depends(get_current_active_user)]):
    user = users_collection.find_one({"username": current_user.username})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    reminders = list(user.get("reminders", []))
    remaining = [item for item in reminders if item.get("id") != data.reminder_id]
    if len(remaining) == len(reminders):
        raise HTTPException(status_code=404, detail="Reminder not found")

    done_count = int(user.get("completed_reminders_count", 0)) + 1
    users_collection.update_one(
        {"username": current_user.username},
        {"$set": {"reminders": remaining, "completed_reminders_count": done_count}},
    )
    return {"message": "Reminder completed", "done_count": done_count, "reminders": remaining}


@router.get("/medications")
async def get_patient_medications(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    user = users_collection.find_one({"username": current_user.username})

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "medications": user.get("medications", [])
    }


class CaretakerLinkResponse(BaseModel):
    accept: bool


@router.get("/link-request")
async def get_link_request(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    user = users_collection.find_one({"username": current_user.username})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    pending_email = (user.get("pending_caregiver_email") or "").strip() or None
    return {
        "pending_caregiver_email": pending_email,
        "pending_caregiver_name": (
            (user.get("pending_caregiver_name") or "").strip() or None
        ),
    }


@router.post("/link-request/respond")
async def respond_link_request(
    data: CaretakerLinkResponse,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    user = users_collection.find_one({"username": current_user.username})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    pending_email = (user.get("pending_caregiver_email") or "").strip()
    if not pending_email:
        raise HTTPException(status_code=400, detail="No pending caregiver request")

    if data.accept:
        users_collection.update_one(
            {"username": current_user.username},
            {"$set": {
                "caregiver_email": pending_email,
                "pending_caregiver_email": "",
                "pending_caregiver_name": "",
            }},
        )
        return {"message": "Caregiver approved", "caregiver_email": pending_email}

    users_collection.update_one(
        {"username": current_user.username},
        {"$set": {"pending_caregiver_email": "", "pending_caregiver_name": ""}},
    )
    return {"message": "Caregiver request declined"}
