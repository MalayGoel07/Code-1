"""Maitri FastAPI application.

All data is persisted in the existing Supabase tables (see supabase_db.py).
Authentication is Supabase Auth only; roles are resolved from the profiles
table and caretaker access is validated against caretaker_patients links.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from . import supabase_db
    from . import activities as activities_lib
    from .patient import router as patient_router
    from .secruity import (
    User,
    get_current_active_user,
    get_current_user_no_provision,
    oauth2_scheme,
    require_role,
)
except ImportError:  # running as `uvicorn main:app`
    import supabase_db
    import activities as activities_lib
    from patient import router as patient_router
    from secruity import (
        User,
        get_current_active_user,
        get_current_user_no_provision,
        oauth2_scheme,
        require_role,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    supabase_db.close_client()


app = FastAPI(title="Maitri API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patient_router)


# --------------------------------------------------------------------------- #
# Health + auth
# --------------------------------------------------------------------------- #

@app.get("/")
async def root():
    return {"message": "Running!"}


class SetupProfileRequest(BaseModel):
    full_name: str = ""
    role: str = "patient"


@app.post("/auth/setup-profile")
async def auth_setup_profile(
    data: SetupProfileRequest,
    current_user: Annotated[User, Depends(get_current_user_no_provision)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    """Called by the frontend after Supabase signup to store role + name.

    Uses get_current_user_no_provision so the profile is created HERE with the
    role chosen at signup. (The generic auto-provision pins 'patient', and the
    profiles table trigger blocks UPDATEs that change the role afterwards.)
    """
    role = (data.role or "patient").strip().lower()
    if role not in ("patient", "caretaker"):
        raise HTTPException(status_code=400, detail="Role must be patient or caretaker")

    full_name = (data.full_name or "").strip()

    try:
        existing = supabase_db.get_profile_by_id(current_user.id, token=token)
        if existing is None:
            supabase_db.create_profile(
                user_id=current_user.id,
                email=current_user.email,
                full_name=full_name or current_user.full_name,
                role=role,
                token=token,
            )
        elif (existing.get("role") or "patient").strip().lower() == role:
            supabase_db.update_profile(
                current_user.id,
                {"full_name": full_name or existing.get("full_name") or ""},
                token=token,
            )
        else:
            # Role change on an existing row (e.g. auto-provisioned 'patient').
            # The DB trigger rejects role-changing UPDATEs, so replace the row:
            # a fresh onboarding user has no dependent rows. If the delete
            # fails (links/tasks already exist) fall back to a plain update
            # attempt and surface its error.
            name = full_name or existing.get("full_name") or ""
            try:
                supabase_db.delete_rows("profiles", {"id": current_user.id}, token=token)
            except supabase_db.SupabaseRestError:
                supabase_db.update_profile(current_user.id, {"full_name": name, "role": role}, token=token)
            else:
                try:
                    supabase_db.create_profile(
                        user_id=current_user.id,
                        email=current_user.email,
                        full_name=name,
                        role=role,
                        token=token,
                    )
                except supabase_db.SupabaseRestError:
                    # Lost a race — the row exists again; update instead.
                    supabase_db.update_profile(current_user.id, {"full_name": name, "role": role}, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not save profile: {exc.message}")

    return {
        "message": "Profile configured",
        "role": role,
        "full_name": full_name,
        "email": current_user.email,
    }


@app.get("/auth/me")
async def auth_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    """Return the authenticated user's profile from the database."""
    try:
        profile = supabase_db.get_profile_by_id(current_user.id, token=token) or {}
        medications = [
            {
                "id": med.get("id"),
                "name": med.get("name"),
                "dosage": med.get("dosage"),
                "time": str(med.get("scheduled_time") or ""),
                "frequency": med.get("frequency"),
                "instructions": med.get("instructions"),
            }
            for med in supabase_db.list_medications(current_user.id, token=token)
        ]
        tasks = supabase_db.list_tasks(
            current_user.id, token=token, exclude_types=True, active_only=True
        )
        reminders = [
            {
                "id": task.get("id"),
                "title": task.get("title"),
                "description": task.get("description"),
                "time": str(task.get("scheduled_time") or ""),
                "type": task.get("task_type"),
            }
            for task in tasks
        ]
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load profile: {exc.message}")

    return {
        "username": current_user.email,
        "email": current_user.email,
        "full_name": profile.get("full_name") or current_user.full_name,
        "role": current_user.role,
        "profile": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": profile.get("full_name") or current_user.full_name,
            "role": current_user.role,
            "medications": medications,
            "reminders": reminders,
        },
    }


# --------------------------------------------------------------------------- #
# Caretaker helpers — authorization enforced against the database
# --------------------------------------------------------------------------- #

WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _normalize_reminder_frequency(frequency: str) -> str:
    f = (frequency or "").strip().lower()
    if f in {"twice daily", "twice a day", "twice", "2 times daily", "2x daily"}:
        return "Twice daily"
    if f in {"weekly", "once a week"}:
        return "Weekly"
    return "Daily"


class CaretakerReminderRequest(BaseModel):
    patient_email: str
    title: str
    description: str = ""
    time: str = ""
    type: str = "Medicine"
    frequency: str = "Daily"
    times: list[str] = []
    day: str = ""
    dosage: str = ""
    duration: str = ""


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


def _require_caretaker(current_user: User) -> None:
    require_role(current_user, "caretaker")


def _find_linked_patient(current_user: User, patient_email: str, token: str | None) -> dict:
    """Locate the patient and verify an ACTIVE caretaker_patients link exists.

    Role and link are both validated against the database — token metadata is
    never trusted for authorization (security fix #4).
    """
    patient_email = (patient_email or "").strip()
    if not patient_email:
        raise HTTPException(status_code=400, detail="Patient email is required")

    patient = supabase_db.get_profile_by_email(patient_email, token=token)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found for that email")

    patient_id = patient.get("id")
    if not patient_id or not supabase_db.link_exists(current_user.id, patient_id, token=token):
        raise HTTPException(
            status_code=403, detail="That patient is not linked to your caretaker account"
        )
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


def _medication_reminder_description(medication: dict) -> str:
    parts = [f"Dosage: {medication['dosage']}"]
    if medication.get("instructions"):
        parts.append(f"Instructions: {medication['instructions']}")
    return " — ".join(parts)


def _sync_medication_reminders(
    patient_id: str, old_name: str, medication: dict, token: str | None
) -> None:
    """Keep the patient's linked Medicine task in sync with the medication."""
    tasks = supabase_db.list_tasks(
        patient_id, token=token, task_type=supabase_db.MEDICATION_TASK_TYPE, active_only=True
    )
    for task in tasks:
        if (task.get("title") or "").strip() == old_name.strip():
            supabase_db.update_task(
                task["id"],
                {
                    "title": medication["name"],
                    "scheduled_time": medication["scheduled_time"],
                    "description": _medication_reminder_description(medication),
                },
                token=token,
            )


# --------------------------------------------------------------------------- #
# Caretaker: report
# --------------------------------------------------------------------------- #

@app.get("/caretaker/report")
async def caretaker_report(
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_caretaker(current_user)

    try:
        links = supabase_db.list_links_by_caretaker(current_user.id, token=token)
        patient_ids = [link.get("patient_id") for link in links if link.get("patient_id")]
        patients = supabase_db.profiles_by_ids(patient_ids, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load report: {exc.message}")

    report = []
    for patient in patients:
        patient_id = patient.get("id")
        current_mood, mood_history = _mood_payload_for(patient_id, token)
        report.append(
            {
                "username": patient.get("email"),
                "full_name": patient.get("full_name") or "",
                "email": patient.get("email"),
                "current_mood": current_mood,
                "mood_history": mood_history,
                "games_played": _games_payload_for(patient_id, token),
            }
        )

    return {"patients": report, "count": len(report)}


def _mood_payload_for(patient_id: str, token: str | None):
    from patient import _mood_payload  # reuse the shared decoder

    try:
        return _mood_payload(patient_id, token)
    except supabase_db.SupabaseRestError:
        return None, []


def _games_payload_for(patient_id: str, token: str | None):
    from patient import _games_payload  # reuse the shared decoder

    try:
        return _games_payload(patient_id, token)
    except supabase_db.SupabaseRestError:
        return []


# --------------------------------------------------------------------------- #
# Caretaker: reminders
# --------------------------------------------------------------------------- #

@app.post("/caretaker/reminders")
async def create_caretaker_reminders(
    data: CaretakerReminderRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_caretaker(current_user)
    patient = _find_linked_patient(current_user, data.patient_email, token)

    title = (data.title or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Reminder title is required")

    task_type = (data.type or "Routine").strip() or "Routine"
    times = [t for t in (data.times or ([data.time] if data.time else [])) if (t or "").strip()]
    if not times:
        raise HTTPException(status_code=400, detail="At least one reminder time is required")

    description = (data.description or "").strip()
    if task_type == "Medicine" and data.dosage.strip():
        description = f"Dosage: {data.dosage.strip()}" + (f" — {description}" if description else "")
    if task_type == "Activity" and data.duration.strip():
        description = f"Duration: {data.duration.strip()}" + (f" — {description}" if description else "")

    created = []
    try:
        for time_value in times:
            task = supabase_db.insert_task(
                patient_id=patient["id"],
                title=title,
                description=description,
                task_type=task_type,
                scheduled_time=time_value.strip(),
                token=token,
            )
            created.append(
                {
                    "id": task.get("id"),
                    "title": task.get("title"),
                    "description": task.get("description"),
                    "time": str(task.get("scheduled_time") or ""),
                    "type": task.get("task_type"),
                }
            )
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not create reminder: {exc.message}")

    return {
        "message": f"{len(created)} reminder(s) created",
        "reminders": created,
    }


# --------------------------------------------------------------------------- #
# Caretaker: medications
# --------------------------------------------------------------------------- #

def _medication_response(med: dict) -> dict:
    return {
        "id": med.get("id"),
        "name": med.get("name") or "",
        "dosage": med.get("dosage") or "",
        "time": str(med.get("scheduled_time") or ""),
        "frequency": med.get("frequency") or "Daily",
        "instructions": med.get("instructions") or "",
    }


@app.get("/caretaker/medications")
async def list_caretaker_medications(
    patient_email: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_caretaker(current_user)
    patient = _find_linked_patient(current_user, patient_email, token)

    try:
        meds = supabase_db.list_medications(patient["id"], token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load medications: {exc.message}")

    return {"medications": [_medication_response(med) for med in meds]}


@app.post("/caretaker/medications")
async def create_caretaker_medication(
    data: CaretakerMedicationCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_caretaker(current_user)
    patient = _find_linked_patient(current_user, data.patient_email, token)

    name, dosage, time, frequency, instructions = _normalize_medication_fields(
        data.name, data.dosage, data.time, data.frequency, data.instructions
    )

    try:
        medication = supabase_db.insert_medication(
            patient_id=patient["id"],
            name=name,
            dosage=dosage,
            scheduled_time=time,
            frequency=frequency,
            instructions=instructions,
            token=token,
        )
        # Keep the patient's reminder list in sync (Medicine task).
        supabase_db.insert_task(
            patient_id=patient["id"],
            title=name,
            description=_medication_reminder_description(
                {"dosage": dosage, "instructions": instructions}
            ),
            task_type=supabase_db.MEDICATION_TASK_TYPE,
            scheduled_time=time,
            token=token,
        )
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not save medication: {exc.message}")

    return {"message": "Medication added", "medication": _medication_response(medication)}


@app.put("/caretaker/medications/{medication_id}")
async def update_caretaker_medication(
    medication_id: str,
    data: CaretakerMedicationUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_caretaker(current_user)
    patient = _find_linked_patient(current_user, data.patient_email, token)

    try:
        existing = supabase_db.get_medication(medication_id, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load medication: {exc.message}")

    if existing is None or existing.get("patient_id") != patient.get("id"):
        raise HTTPException(status_code=404, detail="Medication not found for that patient")

    updates = {}
    if data.name is not None and data.name.strip():
        updates["name"] = data.name.strip()
    if data.dosage is not None and data.dosage.strip():
        updates["dosage"] = data.dosage.strip()
    if data.time is not None and data.time.strip():
        updates["scheduled_time"] = data.time.strip()
    if data.frequency is not None and data.frequency.strip():
        updates["frequency"] = data.frequency.strip()
    if data.instructions is not None:
        updates["instructions"] = data.instructions.strip()

    merged = {
        "name": updates.get("name", existing.get("name")),
        "dosage": updates.get("dosage", existing.get("dosage")),
        "scheduled_time": updates.get("scheduled_time", existing.get("scheduled_time")),
        "frequency": updates.get("frequency", existing.get("frequency")),
        "instructions": updates.get("instructions", existing.get("instructions")),
    }

    try:
        if updates:
            supabase_db.update_medication(medication_id, updates, token=token)
            _sync_medication_reminders(
                patient["id"], existing.get("name") or "", merged, token=token
            )
        refreshed = supabase_db.get_medication(medication_id, token=token) or merged
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not update medication: {exc.message}")

    return {"message": "Medication updated", "medication": _medication_response(refreshed)}


@app.delete("/caretaker/medications/{medication_id}")
async def delete_caretaker_medication(
    medication_id: str,
    patient_email: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_caretaker(current_user)
    patient = _find_linked_patient(current_user, patient_email, token)

    try:
        existing = supabase_db.get_medication(medication_id, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load medication: {exc.message}")

    if existing is None or existing.get("patient_id") != patient.get("id"):
        raise HTTPException(status_code=404, detail="Medication not found for that patient")

    try:
        supabase_db.deactivate_medication(medication_id, token=token)
        # Deactivate the matching Medicine reminder task as well.
        tasks = supabase_db.list_tasks(
            patient["id"],
            token=token,
            task_type=supabase_db.MEDICATION_TASK_TYPE,
            active_only=True,
        )
        for task in tasks:
            if (task.get("title") or "").strip() == (existing.get("name") or "").strip():
                supabase_db.deactivate_task(task["id"], token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not remove medication: {exc.message}")

    return {"message": "Medication removed"}


# --------------------------------------------------------------------------- #
# Caretaker: link requests
# --------------------------------------------------------------------------- #

class CaretakerLinkRequest(BaseModel):
    patient_email: str


def _caretaker_name(current_user: User) -> str:
    return (current_user.full_name or "").strip()


def _request_info(task: dict) -> dict:
    return supabase_db.decode_link_request_description(task.get("description") or "")


@app.post("/caretaker/link-request")
async def send_caretaker_link_request(
    data: CaretakerLinkRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_caretaker(current_user)

    patient_email = (data.patient_email or "").strip()
    if not patient_email:
        raise HTTPException(status_code=400, detail="Patient email is required")
    if patient_email.lower() == (current_user.email or "").lower():
        raise HTTPException(status_code=400, detail="You cannot link to yourself")

    try:
        patient = supabase_db.get_profile_by_email(patient_email, token=token)
        if patient is None:
            raise HTTPException(status_code=404, detail="No patient found with that email")

        patient_id = patient.get("id")
        if patient_id and supabase_db.link_exists(current_user.id, patient_id, token=token):
            raise HTTPException(status_code=409, detail="That patient is already linked to you")

        # Remove any of this caretaker's previous pending requests for the patient.
        existing = supabase_db.list_tasks(
            patient_id,
            token=token,
            task_type=supabase_db.LINK_REQUEST_TASK_TYPE,
            active_only=True,
        )
        for task in existing:
            if _request_info(task).get("caretaker_id") == current_user.id:
                supabase_db.deactivate_task(task["id"], token=token)

        payload = {
            "caretaker_id": current_user.id,
            "caretaker_email": current_user.email,
            "caretaker_name": _caretaker_name(current_user),
            "patient_email": patient.get("email") or patient_email,
            "patient_name": patient.get("full_name") or "",
        }
        supabase_db.insert_task(
            patient_id=patient_id,
            title=f"Link request from {_caretaker_name(current_user) or current_user.email}",
            description=supabase_db.encode_link_request_description(payload),
            task_type=supabase_db.LINK_REQUEST_TASK_TYPE,
            is_active=True,
            token=token,
        )
    except HTTPException:
        raise
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not send link request: {exc.message}")

    return {"message": "Link request sent to patient", "status": "pending"}


@app.get("/caretaker/link-requests")
async def list_caretaker_link_requests(
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_caretaker(current_user)

    try:
        tasks = supabase_db.select(
            "tasks",
            {
                "task_type": f"eq.{supabase_db.LINK_REQUEST_TASK_TYPE}",
                "is_active": "eq.true",
                "select": "*",
                "order": "created_at.desc",
            },
            token=token,
        )
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load link requests: {exc.message}")

    requests = []
    for task in tasks:
        info = _request_info(task)
        if info.get("caretaker_id") != current_user.id:
            continue
        requests.append(
            {
                "patient_email": info.get("patient_email") or "",
                "patient_name": info.get("patient_name") or "",
                "status": "pending",
            }
        )

    return {"requests": requests, "count": len(requests)}


@app.delete("/caretaker/link-request/{patient_email}")
async def cancel_caretaker_link_request(
    patient_email: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_caretaker(current_user)

    try:
        patient = supabase_db.get_profile_by_email(patient_email, token=token)
        if patient is None:
            raise HTTPException(status_code=404, detail="No patient found with that email")

        tasks = supabase_db.list_tasks(
            patient.get("id"),
            token=token,
            task_type=supabase_db.LINK_REQUEST_TASK_TYPE,
            active_only=True,
        )
        mine = [
            task
            for task in tasks
            if _request_info(task).get("caretaker_id") == current_user.id
        ]
        if not mine:
            raise HTTPException(status_code=404, detail="No pending request from you for that patient")

        for task in mine:
            supabase_db.deactivate_task(task["id"], token=token)
    except HTTPException:
        raise
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not cancel request: {exc.message}")

    return {"message": "Link request cancelled"}

# --------------------------------------------------------------------------- #
# Caretaker: personalized activities (Phase 1)
# --------------------------------------------------------------------------- #

def _get_linked_activity(current_user: User, activity_id: str, token: str | None) -> tuple[dict, dict]:
    """Load an activity row and verify the caretaker is linked to its patient."""
    try:
        activity = supabase_db.get_task(activity_id, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load activity: {exc.message}")

    if activity is None or activity.get("task_type") != supabase_db.ACTIVITY_TASK_TYPE:
        raise HTTPException(status_code=404, detail="Activity not found")

    patient_id = activity.get("patient_id")
    if not patient_id or not supabase_db.link_exists(current_user.id, patient_id, token=token):
        raise HTTPException(
            status_code=403, detail="That activity belongs to a patient not linked to your account"
        )
    return patient_id, activity


def _get_linked_question(current_user: User, question_id: str, token: str | None) -> tuple[dict, dict]:
    """Load a question row and verify the caretaker is linked to its patient."""
    try:
        question = supabase_db.get_task(question_id, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load question: {exc.message}")

    if question is None or question.get("task_type") != supabase_db.QUESTION_TASK_TYPE:
        raise HTTPException(status_code=404, detail="Question not found")

    patient_id = question.get("patient_id")
    if not patient_id or not supabase_db.link_exists(current_user.id, patient_id, token=token):
        raise HTTPException(
            status_code=403, detail="That question belongs to a patient not linked to your account"
        )
    return patient_id, question


def _activity_view(patient_id: str, activity_row: dict, token: str | None) -> dict:
    meta = activities_lib.activity_metadata(activity_row.get("description") or "")
    questions = supabase_db.list_questions(patient_id, token=token, active_only=True)
    active_questions = [
        q for q in questions
        if str(activities_lib.question_config(q.get("description") or "").get("activity_id") or "") == str(activity_row.get("id"))
    ]
    return {
        "id": activity_row.get("id"),
        "title": activity_row.get("title") or "",
        "activity_type": meta.get("activity_type") or "",
        "activity_type_label": activities_lib.ACTIVITY_TYPES.get(meta.get("activity_type") or "", ""),
        "notes": meta.get("notes") or "",
        "caretaker_name": "",
        "question_count": len(active_questions),
        "is_active": activity_row.get("is_active", True) is not False,
        "created_at": activity_row.get("created_at") or "",
    }


# --------------------------------------------------------------------------- #
# Activity image uploads (Supabase Storage)
# --------------------------------------------------------------------------- #

@app.post("/caretaker/uploads/image")
async def upload_caretaker_image(
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
    file: UploadFile = File(...),
):
    """Upload a question photo (family faces, objects, places) to Supabase Storage.

    Returns the public URL that can be stored on a question's image_url field.
    """
    _require_caretaker(current_user)

    content_type = (file.content_type or "").lower()
    if content_type not in supabase_db.ALLOWED_IMAGE_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, WebP or GIF images are supported",
        )

    content = await file.read()
    await file.close()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty")
    if len(content) > supabase_db.MAX_IMAGE_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Images must be 5 MB or smaller")

    try:
        result = supabase_db.upload_activity_image(
            caretaker_id=current_user.id, content=content, content_type=content_type
        )
    except supabase_db.SupabaseStorageError as exc:
        status = exc.status_code if 400 <= exc.status_code < 600 else 502
        raise HTTPException(status_code=status, detail=exc.message) from exc

    return {"url": result["url"], "path": result["path"]}


@app.get("/caretaker/activities")
async def list_caretaker_activities(
    patient_email: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_caretaker(current_user)
    patient = _find_linked_patient(current_user, patient_email, token)

    try:
        activities = supabase_db.list_activities(patient.get("id"), token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load activities: {exc.message}")

    return {"activities": [_activity_view(patient.get("id"), a, token) for a in activities], "count": len(activities)}


@app.post("/caretaker/activities")
async def create_caretaker_activity(
    data: activities_lib.ActivityCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_caretaker(current_user)
    patient = _find_linked_patient(current_user, data.patient_email, token)
    activity_type = activities_lib.validate_activity_type(data.activity_type)

    title = (data.title or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Activity title is required")

    try:
        row = supabase_db.insert_activity(
            patient_id=patient.get("id"),
            title=title,
            description=activities_lib.encode_activity_metadata(
                activity_type, current_user.id, current_user.email, data.notes
            ),
            token=token,
        )
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not create activity: {exc.message}")

    return {
        "message": "Activity created",
        "activity": _activity_view(patient.get("id"), row, token),
    }
@app.get("/caretaker/activities/{activity_id}")
async def get_caretaker_activity(
    activity_id: str,
    patient_email: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_caretaker(current_user)
    patient_id, activity = _get_linked_activity(current_user, activity_id, token)
    # The patient_email parameter must match too (extra belt-and-braces).
    patient = supabase_db.get_profile_by_id(patient_id, token=token) or {}
    if patient.get("email", "").strip().lower() != (patient_email or "").strip().lower():
        raise HTTPException(status_code=403, detail="Patient email does not match this activity")

    try:
        questions = supabase_db.list_questions(patient_id, token=token, active_only=True)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load questions: {exc.message}")

    configs: list[dict] = []
    for q in questions:
        cfg = activities_lib.question_config(q.get("description") or "")
        if str(cfg.get("activity_id") or "") != str(activity_id):
            continue
        configs.append(activities_lib.caretaker_question_view(q, cfg))

    return {
        "activity": _activity_view(patient_id, activity, token),
        "questions": configs,
    }


@app.put("/caretaker/activities/{activity_id}")
async def update_caretaker_activity(
    activity_id: str,
    data: activities_lib.ActivityUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_caretaker(current_user)
    _, activity = _get_linked_activity(current_user, activity_id, token)

    updates: dict = {}
    if data.title is not None:
        title = (data.title or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Activity title cannot be empty")
        updates["title"] = title
    if data.notes is not None:
        meta = activities_lib.activity_metadata(activity.get("description") or "")
        updated_notes = (data.notes or "").strip()
        updates["description"] = activities_lib.encode_activity_metadata(
            meta.get("activity_type") or "", current_user.id, current_user.email, updated_notes
        )
    if data.is_active is not None:
        updates["is_active"] = bool(data.is_active)

    try:
        if updates:
            supabase_db.update_task(activity_id, updates, token=token)
        refreshed = supabase_db.get_task(activity_id, token=token) or activity
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not update activity: {exc.message}")

    patient_id = activity.get("patient_id")
    return {"message": "Activity updated", "activity": _activity_view(patient_id, refreshed, token)}
@app.delete("/caretaker/activities/{activity_id}")
async def delete_caretaker_activity(
    activity_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    """Soft-delete an activity (historical sessions are preserved)."""
    _require_caretaker(current_user)
    _, activity = _get_linked_activity(current_user, activity_id, token)

    try:
        supabase_db.deactivate_task(activity_id, token=token)
        # Hide its questions as well so the patient stops seeing them.
        patient_id = activity.get("patient_id")
        questions = supabase_db.list_questions(patient_id, token=token, active_only=True)
        for q in questions:
            cfg = activities_lib.question_config(q.get("description") or "")
            if str(cfg.get("activity_id") or "") == str(activity_id):
                supabase_db.deactivate_task(q["id"], token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not delete activity: {exc.message}")

    return {"message": "Activity deleted"}


@app.post("/caretaker/activities/{activity_id}/questions")
async def create_caretaker_question(
    activity_id: str,
    data: activities_lib.QuestionPayload,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_caretaker(current_user)
    patient_id, activity = _get_linked_activity(current_user, activity_id, token)
    if (activity.get("is_active", True) is False):
        raise HTTPException(status_code=400, detail="Cannot add questions to a deleted activity")

    normalized = activities_lib.validate_and_normalize_question(data, require_answer=True)

    try:
        row = supabase_db.insert_question(
            patient_id=patient_id,
            question_text=normalized["question_text"],
            description=activities_lib.encode_question_config(
                activity_id=activity_id,
                question_type=normalized["question_type"],
                question_text=normalized["question_text"],
                options=normalized["options"],
                correct_answer=normalized["correct_answer"],
                image_url=normalized["image_url"],
                audio_url=normalized["audio_url"],
                metadata=normalized["metadata"],
            ),
            token=token,
        )
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not save question: {exc.message}")

    question_count = len(
        [
            q for q in supabase_db.list_questions(patient_id, token=token, active_only=True)
            if str(activities_lib.question_config(q.get("description") or "").get("activity_id") or "") == activity_id
        ]
    )
    return {
        "message": "Question saved",
        "question": activities_lib.caretaker_question_view(
            row, activities_lib.question_config(row.get("description") or "")
        ),
        "question_count": question_count,
    }
@app.put("/caretaker/activity-questions/{question_id}")
async def update_caretaker_question(
    question_id: str,
    data: activities_lib.QuestionUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    _require_caretaker(current_user)
    _, question = _get_linked_question(current_user, question_id, token)

    # Merge with the existing question so partial updates work.
    old_cfg = activities_lib.question_config(question.get("description") or "")
    merged_type = (data.question_type or old_cfg.get("question_type") or "mcq")
    updates = {
        "question_type": merged_type,
        "question_text": (data.question_text or question.get("title") or "").strip(),
        "options": old_cfg.get("options") or [] if data.options is None else data.options,
        "correct_answer": old_cfg.get("correct_answer") if data.correct_answer is None else data.correct_answer,
        "image_url": old_cfg.get("image_url") or "" if data.image_url is None else data.image_url,
        "audio_url": old_cfg.get("audio_url") or "" if data.audio_url is None else data.audio_url,
        "metadata": old_cfg.get("metadata") or {} if data.metadata is None else data.metadata,
    }

    normalized = activities_lib.validate_and_normalize_question(
        type(
            "MergedQuestion",
            (),
            {"question_type": merged_type, "question_text": updates["question_text"],
             "options": updates["options"], "correct_answer": updates["correct_answer"],
             "image_url": updates["image_url"], "audio_url": updates["audio_url"],
             "metadata": updates["metadata"]},
        )(),
        require_answer=True,
    )

    new_desc = activities_lib.encode_question_config(
        activity_id=old_cfg.get("activity_id") or "",
        question_type=normalized["question_type"],
        question_text=normalized["question_text"],
        options=normalized["options"],
        correct_answer=normalized["correct_answer"],
        image_url=normalized["image_url"],
        audio_url=normalized["audio_url"],
        metadata=normalized["metadata"],
    )
    task_updates: dict = {"title": normalized["question_text"], "description": new_desc}
    if data.is_active is not None:
        task_updates["is_active"] = bool(data.is_active)

    try:
        supabase_db.update_task(question_id, task_updates, token=token)
        refreshed = supabase_db.get_task(question_id, token=token) or question
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not update question: {exc.message}")

    return {
        "message": "Question updated",
        "question": activities_lib.caretaker_question_view(
            refreshed, activities_lib.question_config(refreshed.get("description") or "")
        ),
    }


@app.delete("/caretaker/activity-questions/{question_id}")
async def delete_caretaker_question(
    question_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    """Soft-delete a question; historical session results remain answerable."""
    _require_caretaker(current_user)
    _, _question = _get_linked_question(current_user, question_id, token)

    try:
        supabase_db.deactivate_task(question_id, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not delete question: {exc.message}")

    return {"message": "Question removed"}
@app.get("/caretaker/activities/{activity_id}/results")
async def get_caretaker_activity_results(
    activity_id: str,
    patient_email: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    """Latest completion history for a caretaker's activity (Phase 1)."""
    _require_caretaker(current_user)
    patient_id, activity = _get_linked_activity(current_user, activity_id, token)
    patient = supabase_db.get_profile_by_id(patient_id, token=token) or {}
    if patient.get("email", "").strip().lower() != (patient_email or "").strip().lower():
        raise HTTPException(status_code=403, detail="Patient email does not match this activity")

    try:
        sessions = supabase_db.list_sessions(patient_id, token=token)
    except supabase_db.SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not load results: {exc.message}")

    results = []
    for session_row in sessions:
        data = activities_lib.session_data(session_row.get("description") or "")
        if str(data.get("activity_id") or "") != str(activity_id):
            continue
        if data.get("status") != "completed":
            continue
        results.append(
            {
                "id": session_row.get("id"),
                "correct_count": data.get("correct_count") or 0,
                "total_questions": data.get("total_questions") or 0,
                "score": data.get("score"),
                "completed_at": data.get("completed_at") or session_row.get("created_at") or "",
                "duration_seconds": data.get("duration_seconds"),
                "status": data.get("status"),
            }
        )

    results.sort(key=lambda r: r["completed_at"] or "", reverse=True)
    return {"activity": _activity_view(patient_id, activity, token), "results": results, "count": len(results)}
