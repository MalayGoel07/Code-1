"""Shared business logic for the personalized cognitive-activity system (Phase 1).

Data is persisted in the EXISTING `tasks` table using the same task_type
encoding convention already used for Mood check-ins and caregiver link
requests (see supabase_db.py):

  * Activity  -> task_type='Activity'  (title + JSON metadata)
  * Question  -> task_type='Question'  (title + JSON question configuration)
  * Session   -> task_type='Session'   (JSON session record, is_active=false)

A session SELECTS 5 questions randomly (server-side) and stores the selected
question ids and the patient's answers. The correct answer is NEVER included
in a patient question payload — only the ids, text, media and options/steps
needed to render. Scoring always happens on the backend.
"""

from __future__ import annotations

import json
import random
import re
from typing import Any

from fastapi import HTTPException
from pydantic import BaseModel, Field

# --------------------------------------------------------------------------- #
# Activity types
# --------------------------------------------------------------------------- #

ACTIVITY_TYPES: dict[str, str] = {
    "family_tree": "Family Tree",
    "family_memory": "Family & People",
    "places": "Places",
    "objects": "Objects",
    "routine": "Daily Routine",
    "personal_info": "My Details",
}

QUESTION_TYPES = {"mcq", "text", "routine"}

SESSION_QUESTION_COUNT = 5
MAX_OPTIONS = 4
MIN_ROUTINE_STEPS = 2
# --------------------------------------------------------------------------- #
# Pydantic models (used by caretaker routes in main.py)
# --------------------------------------------------------------------------- #

class ActivityCreate(BaseModel):
    patient_email: str
    activity_type: str
    title: str
    notes: str = ""


class ActivityUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    is_active: bool | None = None


class QuestionPayload(BaseModel):
    """One question inside POST /caretaker/activities/{id}/questions.

    `options` is flexible on purpose: for MCQ it is a list of option strings;
    for routine questions it is a list of step dicts {id, text, image_url,
    audio_url}.
    """

    question_type: str = Field(default="mcq")
    question_text: str = ""
    options: list[Any] = Field(default_factory=list)
    correct_answer: Any = None
    image_url: str = ""
    audio_url: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)


class QuestionUpdate(BaseModel):
    question_type: str | None = None
    question_text: str | None = None
    options: list[str] | None = None
    correct_answer: Any = None
    image_url: str | None = None
    audio_url: str | None = None
    metadata: dict[str, Any] | None = None
    is_active: bool | None = None


class SessionSubmitAnswer(BaseModel):
    question_id: str
    answer: Any = None
# --------------------------------------------------------------------------- #
# Encoding / decoding helpers
# --------------------------------------------------------------------------- #

def encode_activity_metadata(activity_type: str, caretaker_id: str, caretaker_email: str, notes: str = "") -> str:
    return json.dumps(
        {
            "activity_type": (activity_type or "").strip(),
            "caretaker_id": caretaker_id,
            "caretaker_email": caretaker_email,
            "notes": (notes or "").strip(),
        },
        separators=(",", ":"),
    )


def encode_question_config(
    *,
    activity_id: str,
    question_type: str,
    question_text: str,
    options: list[str] | None = None,
    correct_answer: Any = None,
    image_url: str = "",
    audio_url: str = "",
    metadata: dict[str, Any] | None = None,
) -> str:
    return json.dumps(
        {
            "activity_id": activity_id,
            "question_type": (question_type or "").strip(),
            "options": options or [],
            "correct_answer": correct_answer,
            "image_url": (image_url or "").strip(),
            "audio_url": (audio_url or "").strip(),
            "metadata": metadata or {},
        },
        separators=(",", ":"),
    )


def encode_session(
    *,
    activity_id: str,
    question_ids: list[str],
    started_at: str,
) -> str:
    return json.dumps(
        {
            "activity_id": activity_id,
            "question_ids": question_ids,
            "answers": {},          # {question_id: {answer, correct}}
            "correct_count": 0,
            "total_questions": len(question_ids),
            "score": None,
            "started_at": started_at,
            "completed_at": None,
            "duration_seconds": None,
            "status": "in_progress",
        },
        separators=(",", ":"),
    )


def activity_metadata(description: str) -> dict:
    import supabase_db
    return supabase_db.decode_description(description)


def question_config(description: str) -> dict:
    import supabase_db
    return supabase_db.decode_description(description)


def session_data(description: str) -> dict:
    import supabase_db
    return supabase_db.decode_description(description)
# --------------------------------------------------------------------------- #
# Validation (backend always validates; never trusts the frontend)
# --------------------------------------------------------------------------- #

def validate_activity_type(activity_type: str) -> str:
    at = (activity_type or "").strip().lower()
    if at not in ACTIVITY_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown activity type: {activity_type}")
    return at


def validate_and_normalize_question(
    data,
    *,
    require_answer: bool,
) -> dict:
    """Validate a question and return the normalized fields for storage.

    * MCQ: exactly 4 non-empty options, correct_answer must match one option.
    * text: question_text + correct_answer required.
    * routine: at least 2 steps, each step has an id + text; correct_answer
      must be the ordered list of step ids.
    """
    qtype = (data.question_type or "").strip().lower()
    if qtype not in QUESTION_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown question type: {data.question_type}")

    text = (data.question_text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Question text is required")

    image_url = (data.image_url or "").strip()
    audio_url = (data.audio_url or "").strip()
    metadata = data.metadata or {}
    options: list[str] = [str(o).strip() for o in (data.options or []) if str(o).strip()]
    correct_answer = data.correct_answer
    steps: list[dict] = []

    if qtype == "mcq":
        if len(options) != MAX_OPTIONS:
            raise HTTPException(
                status_code=400, detail=f"MCQ questions need exactly {MAX_OPTIONS} options"
            )
        if len(set(options)) != MAX_OPTIONS:
            raise HTTPException(status_code=400, detail="MCQ options must all be different")
        if require_answer and str(correct_answer) not in options:
            raise HTTPException(status_code=400, detail="The correct answer must match one of the options")
    elif qtype == "text":
        if require_answer and not str(correct_answer or "").strip():
            raise HTTPException(status_code=400, detail="A correct answer is required for text questions")
        if correct_answer is not None:
            correct_answer = str(correct_answer).strip()
    elif qtype == "routine":
        steps = [s for s in (data.options or []) if isinstance(s, dict)]
        if len(steps) < MIN_ROUTINE_STEPS:
            raise HTTPException(
                status_code=400, detail=f"Routine questions need at least {MIN_ROUTINE_STEPS} steps"
            )
        for step in steps:
            sid = str(step.get("id") or "").strip()
            stext = str(step.get("text") or "").strip()
            if not sid or not stext:
                raise HTTPException(
                    status_code=400, detail="Every routine step needs an id and a label"
                )
        if require_answer:
            ordered = [str(x).strip() for x in (correct_answer or [])]
            ids = [s["id"] for s in steps]
            if len(ordered) != len(ids) or set(ordered) != set(ids):
                raise HTTPException(
                    status_code=400,
                    detail="The routine's correct order must include exactly the step ids",
                )

    return {
        "question_type": qtype,
        "question_text": text,
        "options": steps if qtype == "routine" else options,
        "correct_answer": correct_answer,
        "image_url": image_url,
        "audio_url": audio_url,
        "metadata": metadata,
    }
# --------------------------------------------------------------------------- #
# Answer normalization + scoring (server-side only)
# --------------------------------------------------------------------------- #

def _strip_all(value: str) -> str:
    return re.sub(r"[\s\-().]", "", value.lower())


def normalize_text_answer(value: Any, mode: str = "text") -> str:
    """Modest normalization — not aggressive fuzzy matching."""
    s = str(value or "").strip()
    mode = (mode or "text").lower()
    if mode == "phone":
        s = _strip_all(s)
        if s.startswith("+91") and len(s) > 10:
            s = s[3:]
        return s
    # default "text": collapse whitespace, lower-case.
    return " ".join(s.lower().split())


def normalize_mcq_answer(value: Any) -> str:
    return normalize_text_answer(value, mode="text")


def check_answer(question: dict, submitted: Any) -> bool:
    """Return True when the submitted answer matches the stored correct answer."""
    qtype = question.get("question_type")
    correct = question.get("correct_answer")
    if qtype == "routine":
        try:
            expected = [str(x).strip() for x in (correct or [])]
            given = [str(x).strip() for x in (submitted or [])]
        except (TypeError, ValueError):
            return False
        return given == expected
    if qtype == "mcq":
        return normalize_mcq_answer(correct) == normalize_mcq_answer(submitted)
    # text
    mode = (question.get("metadata") or {}).get("normalize", "text")
    return normalize_text_answer(correct, mode) == normalize_text_answer(submitted, mode)


# --------------------------------------------------------------------------- #
# Random selection (server-side; never client-side)
# --------------------------------------------------------------------------- #

def select_questions_for_session(
    questions: list[dict], count: int = SESSION_QUESTION_COUNT
) -> list[dict]:
    """Randomly select up to `count` eligible questions.

    If fewer than `count` exist, all available questions are returned (never a
    crash). Callers are responsible for passing only eligible questions.
    """
    if not questions:
        return []
    pool = list(questions)
    random.shuffle(pool)
    return pool[:count]


# --------------------------------------------------------------------------- #
# Patient-safe payloads (never expose correct_answer)
# --------------------------------------------------------------------------- #

def patient_question_payload(question_row: dict, config: dict | None = None) -> dict:
    cfg = config if config is not None else question_config(question_row.get("description") or "")
    payload: dict[str, Any] = {
        "id": question_row.get("id"),
        "question_type": cfg.get("question_type", "mcq"),
        "question_text": question_row.get("title") or cfg.get("question_text", ""),
        "image_url": cfg.get("image_url") or "",
        "audio_url": cfg.get("audio_url") or "",
        "options": [],
        "metadata": cfg.get("metadata") or {},
    }
    # The correct answer and activity internals deliberately are NOT included.
    if cfg.get("question_type") == "routine":
        payload["steps"] = cfg.get("options") or []
    else:
        shuffled = list(cfg.get("options") or [])
        random.shuffle(shuffled)
        payload["options"] = shuffled
    return payload


def caretaker_question_view(question_row: dict, config: dict | None = None) -> dict:
    cfg = config if config is not None else question_config(question_row.get("description") or "")
    return {
        "id": question_row.get("id"),
        "activity_id": cfg.get("activity_id"),
        "question_type": cfg.get("question_type", "mcq"),
        "question_text": question_row.get("title") or cfg.get("question_text", ""),
        "options": cfg.get("options") or [],
        "correct_answer": cfg.get("correct_answer"),
        "image_url": cfg.get("image_url") or "",
        "audio_url": cfg.get("audio_url") or "",
        "metadata": cfg.get("metadata") or {},
        "is_active": question_row.get("is_active", True) is not False,
    }