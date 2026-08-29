from datetime import datetime, timezone
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


class GameCompletionEntry(BaseModel):
    game_id: str
    game_name: str
    completed_at: str | None = None


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
