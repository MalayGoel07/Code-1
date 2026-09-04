"""Patient-facing endpoints, backed by the Supabase database (PostgREST).

Replaces the former in-memory implementation. Data lives in the existing
tables: profiles, tasks, task_completions, medications, games and
game_sessions. Mood check-ins are stored as tasks rows with
task_type = 'Mood'; caregiver link requests as task_type = 'LinkRequest'
(see supabase_db.py).
"""

from typing import Annotated

import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

try:
    from . import supabase_db
    from . import activities as activities_lib
    from .secruity import User, get_current_active_user, oauth2_scheme
except ImportError:  # running as a plain script (uvicorn main:app)
    import supabase_db
    import activities as activities_lib
    from secruity import User, get_current_active_user, oauth2_scheme

router = APIRouter(prefix="/patient", tags=["patient"])

MOOD_LABELS = {"good": "Good", "okay": "Okay", "low": "Not good"}
MOOD_KEYS = {label: key for key, label in MOOD_LABELS.items()}
SPECIAL_TASK_TYPES = supabase_db.SPECIAL_TASK_TYPES
MOOD_TASK_TYPE = supabase_db.MOOD_TASK_TYPE


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    age: int | None = None
    preferred_language: str | None = None
    caregiver_email: str | None = None


class MoodSelection(BaseModel):
    mood: str
    note: str | None = None


class GameCompletionEntry(BaseModel):
    game_id: str
    game_name: str | None = None
    completed_at: str | None = None
    score: int | None = None
    duration_seconds: int | None = None


class ReminderComplete(BaseModel):
    reminder_id: str


class LinkRequestResponse(BaseModel):
    accept: bool


def _require_patient(current_user: User) -> None:
    """Role check against the DATABASE-backed role (never the token)."""
    if (current_user.role or "patient").strip().lower() != "patient":
        raise HTTPException(
            status_code=403, detail="Only patient accounts can access this resource"
        )


def _completed_task_ids(patient_id: str, token: str | None) -> set[str]:
    params = {"patient_id": f"eq.{patient_id}", "select": "task_id,status"}
    rows = supabase_db.select("task_completions", params, token=token)
    return {
        row.get("task_id")
        for row in rows
        if row.get("task_id") and (row.get("status") or "completed") == "completed"
    }


def _mood_rows_to_history(rows: list[dict]) -> list[dict]:
    """Decode 'Mood' task rows into the mood_history shape the UI expects."""
    history: list[dict] = []
    for row in rows:
        title = row.get("title") or ""
        label = title.split("Mood:", 1)[1].strip() if "Mood:" in title else ""
        mood_key = MOOD_KEYS.get(label, (row.get("description") or "").strip().lower())
        if mood_key not in MOOD_LABELS:
            continue
        entry = {
            "mood": mood_key,
            "label": MOOD_LABELS[mood_key],
            "selected_at": row.get("created_at") or "",
        }
        description = (row.get("description") or "").strip()
        if description and description != MOOD_LABELS[mood_key]:
            entry["note"] = description
        history.append(entry)
    return history


def _mood_payload(patient_id: str, token: str | None) -> tuple[str | None, list[dict]]:
    rows = supabase_db.list_tasks(
        patient_id, token=token, task_type=MOOD_TASK_TYPE, active_only=False, order_desc=True
    )
    history = _mood_rows_to_history(rows)
    current_mood = history[0]["mood"] if history else None
    return current_mood, list(reversed(history))


def _pending_link_request(patient_id: str, token: str | None) -> tuple[str, str]:
    """Newest active caregiver link request targeting this patient."""
    rows = supabase_db.list_tasks(
        patient_id,
        token=token,
        task_type=supabase_db.LINK_REQUEST_TASK_TYPE,
        active_only=True,
        order_desc=True,
        limit=1,
    )
    if not rows:
        return "", ""
    data = supabase_db.decode_link_request_description(rows[0].get("description"))
    return (data.get("caretaker_email") or "", data.get("caretaker_name") or "")


def _games_payload(patient_id: str, token: str | None) -> list[dict]:
    sessions = supabase_db.list_game_sessions(patient_id, token=token)
    names = supabase_db.game_names_by_ids(
        [session.get("game_id") for session in sessions], token=token
    )
    return [
        {
            "game_id": session.get("game_id"),
            "game_name": names.get(session.get("game_id")) or "Unknown Game",
            "completed_at": session.get("completed_at") or session.get("created_at"),
        }
        for session in sessions
    ]


def _medication_to_dict(med: dict) -> dict:
    return {
        "id": med.get("id"),
        "name": med.get("name") or "",
        "dosage": med.get("dosage") or "",
        "time": str(med.get("scheduled_time") or ""),
        "frequency": med.get("frequency") or "Daily",
        "instructions": med.get("instructions") or "",
    }


def _task_to_reminder(task: dict) -> dict:
    reminder = {
        "id": task.get("id"),
        "title": task.get("title") or "Reminder",
        "description": task.get("description") or "",
        "time": str(task.get("scheduled_time") or ""),
        "type": task.get("task_type") or "Routine",
        "frequency": task.get("frequency") or "Daily",
        "day": task.get("day") or "",
        "completed": False,
    }
    if task.get("medication_id"):
        reminder["medication_id"] = task["medication_id"]
    return reminder


# --------------------------------------------------------------------------- #
# Profile
# --------------------------------------------------------------------------- #

@router.get("/me")
async def get_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)
    try:
        profile = supabase_db.get_profile_by_id(current_user.id, token=token) or {}
        current_mood, mood_history = _mood_payload(current_user.id, token)
        games_played = _games_payload(current_user.id, token)
        pending_email, pending_name = _pending_link_request(current_user.id, token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load profile: {exc.message}")

    return {
        "username": current_user.email,
        "email": profile.get("email") or current_user.email,
        "full_name": profile.get("full_name") or current_user.full_name,
        "role": current_user.role,
        "current_mood": current_mood,
        "mood_history": mood_history,
        "age": profile.get("age"),
        "preferred_language": profile.get("preferred_language", "English"),
        "caregiver_email": profile.get("caregiver_email", ""),
        "pending_caregiver_email": pending_email,
        "pending_caregiver_name": pending_name,
        "games_played": games_played,
    }


@router.put("/me")
async def update_me(
    data: ProfileUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)

    updates: dict = {}
    if data.full_name is not None:
        updates["full_name"] = data.full_name.strip()
    if data.age is not None:
        updates["age"] = data.age
    if data.preferred_language:
        updates["preferred_language"] = data.preferred_language
    if data.caregiver_email is not None:
        updates["caregiver_email"] = data.caregiver_email.strip()

    try:
        supabase_db.update_profile(current_user.id, updates, token=token)
        profile = supabase_db.get_profile_by_id(current_user.id, token=token) or {}
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not save profile: {exc.message}")

    return {
        "message": "Profile updated",
        "profile": {
            "username": current_user.email,
            "email": profile.get("email") or current_user.email,
            "full_name": profile.get("full_name") or current_user.full_name,
            "age": profile.get("age"),
            "preferred_language": profile.get("preferred_language", "English"),
            "caregiver_email": profile.get("caregiver_email", ""),
        },
    }


# --------------------------------------------------------------------------- #
# Moods
# --------------------------------------------------------------------------- #

@router.post("/mood")
async def save_mood(
    data: MoodSelection,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)

    mood = (data.mood or "").strip().lower()
    if mood not in MOOD_LABELS:
        raise HTTPException(status_code=400, detail="Mood must be good, okay, or low")

    label = MOOD_LABELS[mood]
    note = (data.note or "").strip()

    try:
        supabase_db.insert_task(
            patient_id=current_user.id,
            title=f"Mood: {label}",
            description=note or label,
            task_type=MOOD_TASK_TYPE,
            is_active=False,
            token=token,
        )
        current_mood, mood_history = _mood_payload(current_user.id, token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not save mood: {exc.message}")

    return {"message": "Mood saved", "current_mood": current_mood, "mood_history": mood_history}


@router.get("/mood-history")
async def get_mood_history(
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)
    try:
        current_mood, mood_history = _mood_payload(current_user.id, token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load moods: {exc.message}")

    return {"current_mood": current_mood, "mood_history": mood_history}


# --------------------------------------------------------------------------- #
# Games
# --------------------------------------------------------------------------- #

@router.post("/game-complete")
async def record_game_completed(
    data: GameCompletionEntry,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)

    game_id = (data.game_id or "").strip()
    game_name = (data.game_name or game_id or "Unknown Game").strip()
    if not game_id:
        raise HTTPException(status_code=400, detail="Game ID is required")

    try:
        # game_sessions.game_id references the games catalog row; ensure the
        # catalog entry exists and use its uuid id.
        catalog_entry = supabase_db.find_or_create_game(game_name, token=token)
        supabase_db.insert_game_session(
            patient_id=current_user.id,
            game_id=catalog_entry.get("id") or game_id,
            score=data.score or 0,
            completed_at=data.completed_at,
            duration_seconds=data.duration_seconds,
            token=token,
        )
        games_played = _games_payload(current_user.id, token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not save game result: {exc.message}")

    return {
        "message": "Game completion recorded",
        "games_played": games_played,
        "count": len(games_played),
    }


# --------------------------------------------------------------------------- #
# Reminders
# --------------------------------------------------------------------------- #

@router.get("/reminders")
async def get_patient_reminders(
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)

    try:
        tasks = supabase_db.list_tasks(
            current_user.id, token=token, exclude_types=True, active_only=True
        )
        completed_ids = _completed_task_ids(current_user.id, token)
        done_count = supabase_db.count_completions(current_user.id, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load reminders: {exc.message}")

    reminders = [_task_to_reminder(task) for task in tasks if task.get("id") not in completed_ids]

    return {"reminders": reminders, "done_count": done_count}


@router.post("/reminders/complete")
async def complete_reminder(
    data: ReminderComplete,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)

    reminder_id = (data.reminder_id or "").strip()
    if not reminder_id:
        raise HTTPException(status_code=400, detail="reminder_id is required")

    try:
        task = supabase_db.get_task(reminder_id, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load reminder: {exc.message}")

    if task is None or task.get("patient_id") != current_user.id:
        raise HTTPException(status_code=404, detail="Reminder not found")
    if task.get("task_type") in SPECIAL_TASK_TYPES:
        raise HTTPException(status_code=400, detail="That item is not a completable reminder")

    try:
        supabase_db.insert_completion(
            patient_id=current_user.id, task_id=reminder_id, token=token
        )
        done_count = supabase_db.count_completions(current_user.id, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not complete reminder: {exc.message}")

    return {"message": "Reminder completed", "done_count": done_count}




# --------------------------------------------------------------------------- #
# Medications (patient view is read-only)
# --------------------------------------------------------------------------- #

@router.get("/medications")
async def get_patient_medications(
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)

    try:
        meds = supabase_db.list_medications(current_user.id, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load medications: {exc.message}")

    medications = [
        {
            "id": med.get("id"),
            "name": med.get("name") or "",
            "dosage": med.get("dosage") or "",
            "time": str(med.get("scheduled_time") or ""),
            "frequency": med.get("frequency") or "Daily",
            "instructions": med.get("instructions") or "",
        }
        for med in meds
    ]

    return {"medications": medications, "count": len(medications)}

# --------------------------------------------------------------------------- #
# Caregiver link requests (patient side)
# --------------------------------------------------------------------------- #

@router.get("/link-request")
async def get_patient_link_request(
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)

    try:
        requests = supabase_db.list_tasks(
            current_user.id,
            token=token,
            task_type=supabase_db.LINK_REQUEST_TASK_TYPE,
            active_only=True,
            order_desc=True,
            limit=1,
        )
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load link requests: {exc.message}")

    if not requests:
        return {"pending_caregiver_email": None}

    payload = supabase_db.decode_link_request_description(requests[0].get("description") or "")
    return {
        "pending_caregiver_email": payload.get("caretaker_email") or "",
        "pending_caregiver_name": payload.get("caretaker_name") or "",
    }


class LinkRequestResponse(BaseModel):
    accept: bool


@router.post("/link-request/respond")
async def respond_to_link_request(
    data: LinkRequestResponse,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)

    try:
        requests = supabase_db.list_tasks(
            current_user.id,
            token=token,
            task_type=supabase_db.LINK_REQUEST_TASK_TYPE,
            active_only=True,
            order_desc=True,
            limit=1,
        )
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load link requests: {exc.message}")

    if not requests:
        raise HTTPException(status_code=404, detail="No pending caregiver request")

    request_task = requests[0]
    payload = supabase_db.decode_link_request_description(request_task.get("description") or "")
    caretaker_id = payload.get("caretaker_id") or ""
    caretaker_email = payload.get("caretaker_email") or ""

    try:
        if data.accept and caretaker_id:
            if not supabase_db.link_exists(caretaker_id, current_user.id, token=token):
                supabase_db.insert_link(
                    caretaker_id=caretaker_id, patient_id=current_user.id, token=token
                )
        supabase_db.deactivate_task(request_task.get("id"), token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not respond to request: {exc.message}")

    if data.accept:
        return {
            "message": "Caregiver linked",
            "caregiver_email": caretaker_email,
            "caregiver_name": payload.get("caretaker_name") or "",
        }
# --------------------------------------------------------------------------- #
# Patient: personalized activities (Phase 1)
# --------------------------------------------------------------------------- #

def _patient_activity_view(activity_row: dict) -> dict:
    meta = activities_lib.activity_metadata(activity_row.get("description") or "")
    return {
        "id": activity_row.get("id"),
        "title": activity_row.get("title") or "",
        "activity_type": meta.get("activity_type") or "",
        "activity_type_label": activities_lib.ACTIVITY_TYPES.get(meta.get("activity_type") or "", ""),
        "notes": meta.get("notes") or "",
    }


def _patient_activity_questions(patient_id: str, activity_id: str, token: str | None) -> list[dict]:
    try:
        questions = supabase_db.list_questions(patient_id, token=token, active_only=True)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load questions: {exc.message}")

    result = []
    for q in questions:
        cfg = activities_lib.question_config(q.get("description") or "")
        if str(cfg.get("activity_id") or "") != str(activity_id):
            continue
        result.append(activities_lib.patient_question_payload(q, cfg))
    return result


def _get_patient_activity(patient_id: str, activity_id: str, token: str | None) -> dict:
    try:
        activity = supabase_db.get_task(activity_id, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load activity: {exc.message}")

    if activity is None or activity.get("task_type") != supabase_db.ACTIVITY_TASK_TYPE:
        raise HTTPException(status_code=404, detail="Activity not found")
    if str(activity.get("patient_id")) != str(patient_id):
        raise HTTPException(status_code=403, detail="This activity belongs to another patient")
    if (activity.get("is_active", True) is False):
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


def _get_patient_session(patient_id: str, session_id: str, token: str | None) -> tuple[dict, dict]:
    try:
        session_row = supabase_db.get_task(session_id, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load session: {exc.message}")

    if session_row is None or session_row.get("task_type") != supabase_db.SESSION_TASK_TYPE:
        raise HTTPException(status_code=404, detail="Session not found")
    if str(session_row.get("patient_id")) != str(patient_id):
        raise HTTPException(status_code=403, detail="This session belongs to another patient")
    return session_row, activities_lib.session_data(session_row.get("description") or "")


def _load_question(question_id: str, token: str | None) -> tuple[dict, dict]:
    try:
        question = supabase_db.get_task(question_id, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load question: {exc.message}")

    if question is None or question.get("task_type") != supabase_db.QUESTION_TASK_TYPE:
        raise HTTPException(status_code=404, detail="Question not found")
    return question, activities_lib.question_config(question.get("description") or "")


@router.get("/activities")
async def list_patient_activities(
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)

    try:
        activities = supabase_db.list_activities(current_user.id, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load activities: {exc.message}")

    return {
        "activities": [_patient_activity_view(a) for a in activities],
        "count": len(activities),
    }


@router.get("/activities/{activity_id}")
async def get_patient_activity_detail(
    activity_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)
    activity = _get_patient_activity(current_user.id, activity_id, token)
    questions = _patient_activity_questions(current_user.id, activity_id, token)
    return {
        "activity": _patient_activity_view(activity),
        "questions": questions,
        "question_count": len(questions),
    }
    return {"message": "Caregiver request declined"}

@router.post("/activities/{activity_id}/start")
async def start_patient_activity(
    activity_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)
    activity = _get_patient_activity(current_user.id, activity_id, token)

    # Randomly select up to 5 eligible questions, server-side.
    questions = []
    try:
        all_questions = supabase_db.list_questions(current_user.id, token=token, active_only=True)
        for q in all_questions:
            cfg = activities_lib.question_config(q.get("description") or "")
            if str(cfg.get("activity_id") or "") == str(activity_id):
                questions.append(q)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load questions: {exc.message}")

    if not questions:
        raise HTTPException(status_code=400, detail="This activity has no questions yet")

    selected = activities_lib.select_questions_for_session(questions)
    question_ids = [str(q.get("id")) for q in selected if q.get("id")]

    started_at = supabase_db._now_iso()
    try:
        session_row = supabase_db.insert_session(
            patient_id=current_user.id,
            title=f"Session: {activity.get('title') or 'Activity'}",
            description=activities_lib.encode_session(
                activity_id=activity_id, question_ids=question_ids, started_at=started_at
            ),
            token=token,
        )
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not start session: {exc.message}")

    # Return the selected questions WITHOUT the correct answers.
    session_id = session_row.get("id")
    selected_payloads = [
        activities_lib.patient_question_payload(q) for q in selected
    ]

    return {
        "session": {
            "id": session_id,
            "activity_id": activity_id,
            "question_ids": question_ids,
            "total_questions": len(question_ids),
            "started_at": started_at,
        },
        "questions": selected_payloads,
    }


@router.get("/activity-sessions/{session_id}")
async def get_patient_session(
    session_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)
    session_row, data = _get_patient_session(current_user.id, session_id, token)

    activity_id = str(data.get("activity_id") or "")
    activity_title = ""
    if activity_id:
        activity = supabase_db.get_task(activity_id, token=token)
        if activity:
            activity_title = activity.get("title") or ""

    # A session result can show the score; it must never expose answers.
    return {
        "session": {
            "id": session_row.get("id"),
            "activity_id": activity_id,
            "activity_title": activity_title,
            "question_ids": data.get("question_ids") or [],
            "total_questions": data.get("total_questions") or 0,
            "correct_count": data.get("correct_count") or 0,
            "score": data.get("score"),
            "status": data.get("status"),
            "started_at": data.get("started_at") or "",
            "completed_at": data.get("completed_at") or "",
            "duration_seconds": data.get("duration_seconds"),
        }
    }
@router.post("/activity-sessions/{session_id}/answer")
async def submit_patient_answer(
    session_id: str,
    data: activities_lib.SessionSubmitAnswer,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)
    session_row, sdata = _get_patient_session(current_user.id, session_id, token)

    if sdata.get("status") == "completed":
        raise HTTPException(status_code=400, detail="This session is already completed")

    question_id = (data.question_id or "").strip()
    if not question_id:
        raise HTTPException(status_code=400, detail="question_id is required")
    if question_id not in (sdata.get("question_ids") or []):
        raise HTTPException(status_code=400, detail="That question is not part of this session")

    question, qcfg = _load_question(question_id, token)
    if str(question.get("patient_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="That question belongs to another patient")

    answers = dict((sdata.get("answers") or {}))
    if question_id in answers:
        raise HTTPException(status_code=400, detail="This question has already been answered")

    correct = activities_lib.check_answer(
        {
            "question_type": qcfg.get("question_type"),
            "correct_answer": qcfg.get("correct_answer"),
            "metadata": qcfg.get("metadata") or {},
        },
        data.answer,
    )
    answers[question_id] = {"answer": data.answer, "correct": correct}

    sdata["answers"] = answers
    sdata["correct_count"] = sum(1 for v in answers.values() if v.get("correct"))
    sdata["status"] = "in_progress"

    try:
        supabase_db.update_task(
            session_id,
            {"description": json.dumps(sdata, separators=(",", ":"))},
            token=token,
        )
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not save answer: {exc.message}")

    return {
        "message": "Answer recorded",
        "correct": correct,
        "answered_count": len(answers),
        "total_questions": sdata.get("total_questions") or 0,
    }


@router.post("/activity-sessions/{session_id}/complete")
async def complete_patient_session(
    session_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_patient(current_user)
    session_row, sdata = _get_patient_session(current_user.id, session_id, token)

    if sdata.get("status") == "completed":
        # Idempotent — a completed session can be fetched again.
        return _session_result_response(session_row, sdata, current_user.id, token)

    answers = dict((sdata.get("answers") or {}))
    total = sdata.get("total_questions") or 0
    # Allow completion even if the patient didn't answer every question:
    # unanswered questions count as incorrect.
    correct_count = sum(1 for v in answers.values() if v.get("correct"))
    score = round((correct_count / total) * 100) if total else 0

    started_at = sdata.get("started_at") or session_row.get("created_at") or ""
    completed_at = supabase_db._now_iso()
    duration_seconds = None
    try:
        from datetime import datetime
        base = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
        end = datetime.fromisoformat(completed_at.replace("Z", "+00:00"))
        duration_seconds = max(0, int((end - base).total_seconds()))
    except (ValueError, TypeError):
        duration_seconds = None

    sdata["correct_count"] = correct_count
    sdata["score"] = score
    sdata["status"] = "completed"
    sdata["completed_at"] = completed_at
    sdata["duration_seconds"] = duration_seconds

    try:
        supabase_db.update_task(
            session_id,
            {"description": json.dumps(sdata, separators=(",", ":"))},
            token=token,
        )
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not complete session: {exc.message}")

    return _session_result_response(session_row, sdata, current_user.id, token)


def _session_result_response(session_row: dict, sdata: dict, patient_id: str, token: str | None) -> dict:
    activity_id = str(sdata.get("activity_id") or "")
    activity_title = ""
    if activity_id:
        activity = supabase_db.get_task(activity_id, token=token)
        if activity:
            activity_title = activity.get("title") or ""
    return {
        "message": "Session completed",
        "result": {
            "session_id": session_row.get("id"),
            "activity_id": activity_id,
            "activity_title": activity_title,
            "correct_count": sdata.get("correct_count") or 0,
            "total_questions": sdata.get("total_questions") or 0,
            "score": sdata.get("score"),
            "status": sdata.get("status"),
            "started_at": sdata.get("started_at") or "",
            "completed_at": sdata.get("completed_at") or "",
            "duration_seconds": sdata.get("duration_seconds"),
        },
    }
