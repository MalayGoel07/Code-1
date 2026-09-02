"""Supabase PostgREST persistence layer.

All application data (profiles, medications, reminders/tasks, task
completions, games, game sessions and caretaker<->patient links) is read and
written from the EXISTING Supabase project tables:

    profiles, medications, tasks, task_completions, games, game_sessions,
    caretaker_patients

Encoding conventions (no schema changes required):
  - Mood check-ins are `tasks` rows with task_type = 'Mood'
    (title "Mood: <label>", is_active = false).
  - Caregiver link requests are `tasks` rows with task_type = 'LinkRequest'
    and a JSON description payload identifying the caretaker.
  - Reminder list endpoints exclude task_type in ('Mood', 'LinkRequest').

Authentication to PostgREST:
  - With SUPABASE_SECRET_KEY set, it is used directly (bypasses RLS) and the
    backend enforces authorization in code (DB-backed roles + link checks).
  - Otherwise the caller's Supabase JWT is forwarded so RLS policies apply.
"""

from __future__ import annotations

import json
import threading
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from dotenv import load_dotenv
import os

load_dotenv(encoding="utf-8-sig")

SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").rstrip("/")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY") or ""
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY") or ""

REST_TIMEOUT_SECONDS = 20.0

MOOD_TASK_TYPE = "Mood"
LINK_REQUEST_TASK_TYPE = "LinkRequest"
MEDICATION_TASK_TYPE = "Medicine"
ACTIVITY_TASK_TYPE = "Activity"
QUESTION_TASK_TYPE = "Question"
SESSION_TASK_TYPE = "Session"
SPECIAL_TASK_TYPES = {
    MOOD_TASK_TYPE,
    LINK_REQUEST_TASK_TYPE,
    ACTIVITY_TASK_TYPE,
    QUESTION_TASK_TYPE,
    SESSION_TASK_TYPE,
}


class SupabaseRestError(Exception):
    """Raised when a PostgREST request fails."""

    def __init__(self, status_code: int, message: str, code: str | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.code = code


_client_lock = threading.Lock()
_client: httpx.Client | None = None


def get_client() -> httpx.Client:
    global _client
    with _client_lock:
        if _client is None or _client.is_closed:
            _client = httpx.Client(timeout=REST_TIMEOUT_SECONDS)
        return _client


def close_client() -> None:
    global _client
    with _client_lock:
        if _client is not None and not _client.is_closed:
            _client.close()
        _client = None


def using_secret_key() -> bool:
    return bool(SUPABASE_SECRET_KEY)


def _rest_request(
    method: str,
    path: str,
    *,
    token: str | None = None,
    params: dict | None = None,
    json_body: Any = None,
    prefer: list[str] | None = None,
) -> Any:
    """Perform a PostgREST request and return decoded JSON (None for 204)."""
    if not SUPABASE_URL:
        raise SupabaseRestError(500, "SUPABASE_URL is not configured on the backend")

    if SUPABASE_SECRET_KEY:
        api_key = SUPABASE_SECRET_KEY
        auth_value = f"Bearer {SUPABASE_SECRET_KEY}"
    elif token:
        api_key = SUPABASE_PUBLISHABLE_KEY or token
        auth_value = f"Bearer {token}"
    else:
        raise SupabaseRestError(
            500,
            "No Supabase credentials available: set SUPABASE_SECRET_KEY or forward a user token",
        )

    headers = {"apikey": api_key, "Authorization": auth_value}
    if prefer:
        headers["Prefer"] = ",".join(prefer)

    url = f"{SUPABASE_URL}/rest/v1/{path.lstrip('/')}"
    try:
        response = get_client().request(
            method, url, params=params, json=json_body, headers=headers
        )
    except httpx.HTTPError as exc:
        raise SupabaseRestError(503, f"Supabase is unreachable: {exc}") from exc

    if response.status_code >= 400:
        try:
            body = response.json()
            message = body.get("message") or str(body)
            code = body.get("code")
        except Exception:
            message = response.text[:300]
            code = None
        raise SupabaseRestError(response.status_code, message, code)

    if response.status_code == 204 or not response.content:
        return None
    return response.json()


def _filters_to_params(filters: dict) -> dict:
    return {key: f"eq.{value}" for key, value in filters.items()}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _now_time_only() -> str:
    # tasks.scheduled_time is a time column; rows whose real timestamp lives
    # in created_at (moods, link requests) store the current time-of-day.
    return datetime.now(timezone.utc).strftime("%H:%M:%S")


def select(table: str, params: dict | None = None, token: str | None = None) -> list[dict]:
    rows = _rest_request("GET", table, token=token, params=dict(params or {}))
    return rows if isinstance(rows, list) else []


def select_one(table: str, params: dict | None = None, token: str | None = None) -> dict | None:
    params = dict(params or {})
    params.setdefault("limit", 1)
    rows = select(table, params, token=token)
    return rows[0] if rows else None


def insert_row(
    table: str,
    row: dict,
    token: str | None = None,
    *,
    with_uuid_fallback: bool = True,
) -> dict:
    """Insert a row and return the stored representation.

    Tables without a database default on `id` are retried with a generated
    UUID so callers never need to care.
    """
    try:
        rows = _rest_request(
            "POST", table, token=token, json_body=row, prefer=["return=representation"]
        )
        return rows[0] if isinstance(rows, list) and rows else row
    except SupabaseRestError as exc:
        if with_uuid_fallback and exc.status_code in (400, 404) and "id" in (exc.message or "").lower():
            retry = dict(row)
            retry.setdefault("id", str(uuid.uuid4()))
            return insert_row(table, retry, token=token, with_uuid_fallback=False)
        raise


def update_rows(table: str, filters: dict, updates: dict, token: str | None = None) -> list[dict]:
    rows = _rest_request(
        "PATCH",
        table,
        token=token,
        params=_filters_to_params(filters),
        json_body=updates,
        prefer=["return=representation"],
    )
    return rows if isinstance(rows, list) else []


def delete_rows(table: str, filters: dict, token: str | None = None) -> None:
    _rest_request("DELETE", table, token=token, params=_filters_to_params(filters))


# --------------------------------------------------------------------------- #
# Profiles
# --------------------------------------------------------------------------- #

def get_profile_by_id(user_id: str, token: str | None = None) -> dict | None:
    return select_one("profiles", {"id": f"eq.{user_id}", "select": "*"}, token=token)


def get_profile_by_email(email: str, token: str | None = None) -> dict | None:
    email = (email or "").strip()
    if not email:
        return None
    return select_one("profiles", {"email": f"ilike.{email}", "select": "*"}, token=token)


def create_profile(
    *,
    user_id: str,
    email: str,
    full_name: str = "",
    role: str = "patient",
    age: int | None = None,
    preferred_language: str | None = None,
    token: str | None = None,
) -> dict:
    row = {
        "id": user_id,
        "email": email,
        "full_name": full_name or "",
        "role": role or "patient",
    }
    if age is not None:
        row["age"] = age
    if preferred_language:
        row["preferred_language"] = preferred_language

    try:
        return insert_row("profiles", row, token=token, with_uuid_fallback=False)
    except SupabaseRestError as exc:
        # Optional columns (age / preferred_language) may not exist yet; retry
        # with the guaranteed core columns only.
        if exc.status_code in (400, 404):
            minimal = {
                k: v for k, v in row.items() if k in ("id", "email", "full_name", "role")
            }
            if minimal != row:
                return insert_row("profiles", minimal, token=token, with_uuid_fallback=False)
        raise


def update_profile(user_id: str, updates: dict, token: str | None = None) -> dict | None:
    updates = {k: v for k, v in (updates or {}).items() if v is not None}
    if not updates:
        return get_profile_by_id(user_id, token=token)
    try:
        rows = update_rows("profiles", {"id": user_id}, updates, token=token)
    except SupabaseRestError as exc:
        if exc.status_code in (400, 404):
            # Retry with only the columns the base schema guarantees.
            allowed = {
                k: v
                for k, v in updates.items()
                if k in ("full_name", "avatar_url", "phone", "role")
            }
            if allowed and allowed != updates:
                rows = update_rows("profiles", {"id": user_id}, allowed, token=token)
            else:
                raise
        else:
            raise
    if rows:
        return rows[0]
    return get_profile_by_id(user_id, token=token)


# --------------------------------------------------------------------------- #
# Tasks (reminders + moods + link requests)
# --------------------------------------------------------------------------- #

def list_tasks(
    patient_id: str,
    token: str | None = None,
    *,
    task_type: str | None = None,
    active_only: bool = True,
    exclude_types: bool = False,
    order_desc: bool = False,
    limit: int | None = None,
) -> list[dict]:
    params: dict[str, Any] = {"patient_id": f"eq.{patient_id}", "select": "*"}
    if task_type:
        params["task_type"] = f"eq.{task_type}"
    elif exclude_types:
        quoted = ",".join(f'"{t}"' for t in sorted(SPECIAL_TASK_TYPES))
        params["task_type"] = f"not.in.({quoted})"
    if active_only:
        params["is_active"] = "eq.true"
    if order_desc:
        params["order"] = "created_at.desc"
    if limit:
        params["limit"] = limit
    return select("tasks", params, token=token)


def get_task(task_id: str, token: str | None = None) -> dict | None:
    return select_one("tasks", {"id": f"eq.{task_id}", "select": "*"}, token=token)


def insert_task(
    *,
    patient_id: str,
    title: str,
    description: str = "",
    task_type: str,
    scheduled_time: str | None = None,
    is_active: bool = True,
    frequency: str | None = None,
    day: str | None = None,
    medication_id: str | None = None,
    token: str | None = None,
) -> dict:
    row = {
        "patient_id": patient_id,
        "title": title,
        "description": description or "",
        "task_type": task_type,
        "scheduled_time": scheduled_time or _now_time_only(),
        "is_active": is_active,
    }
    for key, value in (("frequency", frequency), ("day", day), ("medication_id", medication_id)):
        if value:
            row[key] = value

    try:
        return insert_row("tasks", row, token=token)
    except SupabaseRestError as exc:
        # Optional columns (frequency/day/medication_id) may not exist in the
        # base schema; retry with the guaranteed core columns.
        if exc.status_code in (400, 404) and len(row) > 6:
            core = {
                k: row[k]
                for k in ("patient_id", "title", "description", "task_type", "scheduled_time", "is_active")
            }
            return insert_row("tasks", core, token=token)
        raise


def update_task(task_id: str, updates: dict, token: str | None = None) -> list[dict]:
    return update_rows("tasks", {"id": task_id}, updates or {}, token=token)


def deactivate_task(task_id: str, token: str | None = None) -> None:
    update_rows("tasks", {"id": task_id}, {"is_active": False}, token=token)


def delete_task(task_id: str, token: str | None = None) -> None:
    delete_rows("task_completions", {"task_id": task_id}, token=token)
    delete_rows("tasks", {"id": task_id}, token=token)


# --------------------------------------------------------------------------- #
# Task completions
# --------------------------------------------------------------------------- #

def insert_completion(*, patient_id: str, task_id: str, token: str | None = None) -> dict:
    row = {
        "patient_id": patient_id,
        "task_id": task_id,
        "status": "completed",
        "completed_at": _now_iso(),
    }
    return insert_row("task_completions", row, token=token)


def count_completions(patient_id: str, token: str | None = None) -> int:
    rows = select(
        "task_completions",
        {"patient_id": f"eq.{patient_id}", "select": "id,status"},
        token=token,
    )
    return sum(
        1
        for row in rows
        if (row.get("status") or "completed") == "completed"
    )


# --------------------------------------------------------------------------- #
# Medications
# --------------------------------------------------------------------------- #

def list_medications(patient_id: str, token: str | None = None) -> list[dict]:
    return select(
        "medications",
        {
            "patient_id": f"eq.{patient_id}",
            "is_active": "eq.true",
            "select": "*",
            "order": "created_at.asc",
        },
        token=token,
    )


def get_medication(medication_id: str, token: str | None = None) -> dict | None:
    return select_one("medications", {"id": f"eq.{medication_id}", "select": "*"}, token=token)


def insert_medication(
    *,
    patient_id: str,
    name: str,
    dosage: str,
    scheduled_time: str,
    frequency: str,
    instructions: str,
    token: str | None = None,
) -> dict:
    row = {
        "patient_id": patient_id,
        "name": name,
        "dosage": dosage,
        "scheduled_time": scheduled_time,
        "frequency": frequency,
        "instructions": instructions,
        "is_active": True,
    }
    return insert_row("medications", row, token=token)


def update_medication(medication_id: str, updates: dict, token: str | None = None) -> list[dict]:
    return update_rows("medications", {"id": medication_id}, updates, token=token)


def deactivate_medication(medication_id: str, token: str | None = None) -> None:
    update_rows("medications", {"id": medication_id}, {"is_active": False}, token=token)


# --------------------------------------------------------------------------- #
# Games
# --------------------------------------------------------------------------- #

def find_game(name: str, token: str | None = None) -> dict | None:
    return select_one("games", {"name": f"ilike.{name}", "select": "*"}, token=token)


def find_or_create_game(name: str, token: str | None = None) -> dict:
    game = find_game(name, token=token)
    if game:
        return game
    try:
        return insert_row("games", {"name": name, "description": ""}, token=token)
    except SupabaseRestError:
        # Either a unique-constraint race or a missing-default id issue.
        game = find_game(name, token=token)
        if game:
            return game
        return insert_row(
            "games", {"id": str(uuid.uuid4()), "name": name, "description": ""},
            token=token,
        )


def insert_game_session(
    *,
    patient_id: str,
    game_id: str,
    score: int = 0,
    completed_at: str | None = None,
    duration_seconds: int | None = None,
    token: str | None = None,
) -> dict:
    row = {
        "patient_id": patient_id,
        "game_id": game_id,
        "score": score,
        "completed_at": completed_at or _now_iso(),
    }
    if duration_seconds is not None:
        row["duration_seconds"] = duration_seconds
    return insert_row("game_sessions", row, token=token)


def list_game_sessions(patient_id: str, token: str | None = None) -> list[dict]:
    return select(
        "game_sessions",
        {"patient_id": f"eq.{patient_id}", "select": "*", "order": "completed_at.desc"},
        token=token,
    )


def game_names_by_ids(game_ids: list, token: str | None = None) -> dict:
    ids = sorted({gid for gid in (game_ids or []) if gid})
    if not ids:
        return {}
    rows = select("games", {"id": f"in.({','.join(ids)})", "select": "id,name"}, token=token)
    return {row.get("id"): (row.get("name") or "") for row in rows}


# --------------------------------------------------------------------------- #
# Caretaker <-> patient links
# --------------------------------------------------------------------------- #

def link_exists(caretaker_id: str, patient_id: str, token: str | None = None) -> bool:
    row = select_one(
        "caretaker_patients",
        {
            "caretaker_id": f"eq.{caretaker_id}",
            "patient_id": f"eq.{patient_id}",
            "select": "id",
        },
        token=token,
    )
    return row is not None


def insert_link(*, caretaker_id: str, patient_id: str, token: str | None = None) -> dict:
    return insert_row(
        "caretaker_patients",
        {"caretaker_id": caretaker_id, "patient_id": patient_id},
        token=token,
    )


def list_links_by_caretaker(caretaker_id: str, token: str | None = None) -> list[dict]:
    return select(
        "caretaker_patients",
        {"caretaker_id": f"eq.{caretaker_id}", "select": "*", "order": "created_at.asc"},
        token=token,
    )


def list_links_by_patient(patient_id: str, token: str | None = None) -> list[dict]:
    return select(
        "caretaker_patients",
        {"patient_id": f"eq.{patient_id}", "select": "*", "order": "created_at.asc"},
        token=token,
    )


def profiles_by_ids(ids: list, token: str | None = None) -> list[dict]:
    unique = sorted({pid for pid in (ids or []) if pid})
    if not unique:
        return []
    return select("profiles", {"id": f"in.({','.join(unique)})", "select": "*"}, token=token)


def encode_link_request_description(payload: dict) -> str:
    return json.dumps(payload, separators=(",", ":"))


def decode_link_request_description(description: str) -> dict:
    try:
        data = json.loads(description or "{}")
        return data if isinstance(data, dict) else {}
    except (ValueError, TypeError):
        return {}


# --------------------------------------------------------------------------- #
# Personalized activities (Phase 1) — reuses the tasks table via task_type.
#   * Activity   -> task_type='Activity'   (title + JSON metadata)
#   * Question   -> task_type='Question'   (title + JSON question config)
#   * Session    -> task_type='Session'    (JSON session record, is_active=false)
# --------------------------------------------------------------------------- #

def decode_description(description: str) -> dict:
    """Decode a JSON task description into a dict (empty dict on failure)."""
    return decode_link_request_description(description)


def list_activities(patient_id: str, token: str | None = None, *, active_only: bool = True) -> list[dict]:
    return list_tasks(
        patient_id,
        token=token,
        task_type=ACTIVITY_TASK_TYPE,
        active_only=active_only,
        order_desc=False,
    )


def list_questions(
    patient_id: str,
    token: str | None = None,
    *,
    active_only: bool = True,
    order_desc: bool = False,
) -> list[dict]:
    return list_tasks(
        patient_id,
        token=token,
        task_type=QUESTION_TASK_TYPE,
        active_only=active_only,
        order_desc=order_desc,
    )


def list_sessions(patient_id: str, token: str | None = None) -> list[dict]:
    return list_tasks(
        patient_id,
        token=token,
        task_type=SESSION_TASK_TYPE,
        active_only=False,
        order_desc=True,
    )


def insert_activity(
    *,
    patient_id: str,
    title: str,
    description: str,
    token: str | None = None,
) -> dict:
    return insert_task(
        patient_id=patient_id,
        title=title,
        description=description,
        task_type=ACTIVITY_TASK_TYPE,
        is_active=True,
        token=token,
    )


def insert_question(
    *,
    patient_id: str,
    question_text: str,
    description: str,
    token: str | None = None,
) -> dict:
    return insert_task(
        patient_id=patient_id,
        title=question_text,
        description=description,
        task_type=QUESTION_TASK_TYPE,
        is_active=True,
        token=token,
    )


def insert_session(
    *,
    patient_id: str,
    title: str,
    description: str,
    token: str | None = None,
) -> dict:
    return insert_task(
        patient_id=patient_id,
        title=title,
        description=description,
        task_type=SESSION_TASK_TYPE,
        is_active=False,
        token=token,
    )


# --------------------------------------------------------------------------- #
# Storage (Supabase Storage) — activity image uploads
# --------------------------------------------------------------------------- #

ACTIVITY_IMAGE_BUCKET = "activity-images"
MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}
STORAGE_TIMEOUT_SECONDS = 30.0


class SupabaseStorageError(Exception):
    """Raised when a Supabase Storage request fails."""

    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def _storage_headers(extra: dict | None = None) -> dict:
    if not SUPABASE_URL:
        raise SupabaseStorageError(500, "SUPABASE_URL is not configured on the backend")
    if not SUPABASE_SECRET_KEY:
        raise SupabaseStorageError(
            500, "SUPABASE_SECRET_KEY is required for storage uploads"
        )
    headers = {
        "apikey": SUPABASE_SECRET_KEY,
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
    }
    if extra:
        headers.update(extra)
    return headers


def _create_activity_image_bucket() -> None:
    """Create the public activity-images bucket (no-op when it already exists)."""
    try:
        response = get_client().request(
            "POST",
            f"{SUPABASE_URL}/storage/v1/bucket",
            headers=_storage_headers({"Content-Type": "application/json"}),
            json={"name": ACTIVITY_IMAGE_BUCKET, "public": True},
            timeout=STORAGE_TIMEOUT_SECONDS,
        )
    except httpx.HTTPError as exc:
        raise SupabaseStorageError(
            503, f"Supabase Storage is unreachable: {exc}"
        ) from exc
    if response.status_code in (200, 201):
        return
    # A duplicate create means the bucket already exists — fine.
    if response.status_code == 400 and "already" in (response.text or "").lower():
        return
    raise SupabaseStorageError(
        response.status_code,
        f"Could not create the {ACTIVITY_IMAGE_BUCKET} bucket: {(response.text or '')[:200]}",
    )


def upload_activity_image(*, caretaker_id: str, content: bytes, content_type: str) -> dict:
    """Upload an image to the public activity-images bucket.

    Returns {"path": "<bucket>/<object path>", "url": "<public URL>"}.
    The bucket is created automatically on the first upload of a project.
    """
    ext = ALLOWED_IMAGE_CONTENT_TYPES.get((content_type or "").lower())
    if not ext:
        raise SupabaseStorageError(400, "Only JPEG, PNG, WebP or GIF images are supported")
    if not SUPABASE_URL:
        raise SupabaseStorageError(500, "SUPABASE_URL is not configured on the backend")

    object_path = f"activities/{caretaker_id}/{uuid.uuid4().hex}.{ext}"
    object_url = f"{SUPABASE_URL}/storage/v1/object/{ACTIVITY_IMAGE_BUCKET}/{object_path}"

    def _send() -> "httpx.Response":
        return get_client().request(
            "POST",
            object_url,
            headers=_storage_headers({"Content-Type": content_type}),
            content=content,
            timeout=STORAGE_TIMEOUT_SECONDS,
        )

    try:
        response = _send()
        body_text = (response.text or "").lower()
        bucket_missing = response.status_code == 404 or (
            response.status_code == 400 and "bucket" in body_text and "not found" in body_text
        )
        if bucket_missing:
            # First upload on a fresh project — create the bucket and retry once.
            _create_activity_image_bucket()
            response = _send()
    except httpx.HTTPError as exc:
        raise SupabaseStorageError(503, f"Supabase Storage is unreachable: {exc}") from exc

    if response.status_code not in (200, 201):
        raise SupabaseStorageError(
            response.status_code, f"Image upload failed: {(response.text or '')[:200]}"
        )

    return {
        "path": f"{ACTIVITY_IMAGE_BUCKET}/{object_path}",
        "url": f"{SUPABASE_URL}/storage/v1/object/public/{ACTIVITY_IMAGE_BUCKET}/{object_path}",
    }





