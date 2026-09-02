"""Automated backend tests (problem #8): authentication, authorization, CRUD,
permissions and persistence behaviour.

Run from the backend folder:
    python -m pytest tests/test_api.py -v

Strategy:
  - supabase_db._rest_request is replaced with an in-memory fake PostgREST so
    CRUD logic runs against a database-shaped store (no network).
  - secruity.verify_supabase_token is replaced with a parser of deterministic
    test tokens, EXCEPT in TestJwtSecurity which exercises the real verifier
    (signing, tampering, expiry, fail-closed).
"""

from __future__ import annotations

import itertools
import uuid
from datetime import datetime, timedelta, timezone

import jwt as pyjwt
import pytest
from fastapi.testclient import TestClient

import main  # noqa: E402  (imports app + routers)
import supabase_config as supabase_config_module
import supabase_db
import secruity
from supabase_config import SupabaseTokenPayload

TABLES = (
    "profiles",
    "tasks",
    "task_completions",
    "medications",
    "games",
    "game_sessions",
    "caretaker_patients",
)
CONTROL_KEYS = {"select", "order", "limit"}


class FakePostgREST:
    """Minimal PostgREST emulation over dict rows."""

    def __init__(self):
        self.tables: dict[str, list[dict]] = {name: [] for name in TABLES}
        self._clock = itertools.count(1)

    def request(self, method, path, *, params=None, json_body=None, **_):
        table = path.strip("/")
        if table not in self.tables:
            raise supabase_db.SupabaseRestError(404, f"unknown table {table}")
        params = dict(params or {})
        if method == "GET":
            return self._select(table, params)
        if method == "POST":
            return [self._insert(table, json_body or {})]
        if method == "PATCH":
            return self._patch(table, params, json_body or {})
        if method == "DELETE":
            return self._delete(table, params)
        raise supabase_db.SupabaseRestError(405, f"unsupported method {method}")

    def _matches(self, row: dict, params: dict) -> bool:
        for key, raw in params.items():
            if key in CONTROL_KEYS:
                continue
            value = str(raw)
            if value.startswith("eq."):
                if str(row.get(key)).lower() != value[3:].lower():
                    return False
            elif value.startswith("nin.("):
                if str(row.get(key)) in value[5:-1].split(","):
                    return False
            elif value.startswith("not.in.("):
                if str(row.get(key)) in value[8:-1].split(","):
                    return False
            elif value.startswith("in.("):
                if str(row.get(key)) not in value[4:-1].split(","):
                    return False
            elif value.startswith("ilike."):
                if str(row.get(key) or "").lower() != value[6:].lower():
                    return False
            else:
                raise supabase_db.SupabaseRestError(400, f"filter not supported: {key}={value}")
        return True

    def _select(self, table, params):
        rows = [row for row in self.tables[table] if self._matches(row, params)]
        order = params.get("order", "")
        if order:
            column, _, direction = order.partition(".")
            rows = sorted(rows, key=lambda r: str(r.get(column) or ""), reverse=direction == "desc")
        limit = params.get("limit")
        if limit is not None:
            rows = rows[: int(limit)]
        return [dict(row) for row in rows]

    def _insert(self, table, row):
        stored = dict(row)
        stored.setdefault("id", str(uuid.uuid4()))
        stored.setdefault(
            "created_at",
            (
                datetime(2026, 1, 1, tzinfo=timezone.utc) + timedelta(seconds=next(self._clock))
            ).isoformat(),
        )
        self.tables[table].append(stored)
        return dict(stored)

    def _patch(self, table, params, updates):
        matched = []
        for row in self.tables[table]:
            if self._matches(row, params):
                row.update(updates)
                matched.append(dict(row))
        return matched

    def _delete(self, table, params):
        keep, removed = [], []
        for row in self.tables[table]:
            (removed if self._matches(row, params) else keep).append(row)
        self.tables[table] = keep
        return removed


# --------------------------------------------------------------------------- #
# Fixtures
# --------------------------------------------------------------------------- #

@pytest.fixture()
def fake_db(monkeypatch):
    db = FakePostgREST()
    monkeypatch.setattr(supabase_db, "_rest_request", db.request)
    return db


@pytest.fixture()
def api(monkeypatch, fake_db):
    """TestClient whose tokens look like 'tok:<sub>:<email>[:<meta_role>:<name>]'."""

    def parse_token(token: str | None) -> SupabaseTokenPayload | None:
        if not token or not token.startswith("tok:"):
            return None
        parts = (token[4:]).split(":")
        if len(parts) < 2:
            return None
        sub, email = parts[0], parts[1]
        meta_role = parts[2] if len(parts) > 2 and parts[2] else "patient"
        full_name = parts[3] if len(parts) > 3 else ""
        return SupabaseTokenPayload(
            {
                "sub": sub,
                "email": email,
                "user_metadata": {"role": meta_role, "full_name": full_name},
            }
        )

    monkeypatch.setattr(secruity, "verify_supabase_token", parse_token)
    return TestClient(main.app)


def patient_token(db, email="p1@test.com", name="Patient One"):
    sub = str(uuid.uuid4())
    db.tables["profiles"].append(
        {"id": sub, "email": email, "full_name": name, "role": "patient"}
    )
    auth = {"Authorization": f"Bearer tok:{sub}:{email}:patient:{name}"}
    return sub, auth


def caretaker_token(db, email="c1@test.com", name="Caretaker One"):
    sub = str(uuid.uuid4())
    db.tables["profiles"].append(
        {"id": sub, "email": email, "full_name": name, "role": "caretaker"}
    )
    auth = {"Authorization": f"Bearer tok:{sub}:{email}:caretaker:{name}"}
    return sub, auth


def link(db, caretaker_id: str, patient_id: str):
    db.tables["caretaker_patients"].append(
        {"id": str(uuid.uuid4()), "caretaker_id": caretaker_id, "patient_id": patient_id}
    )


# --------------------------------------------------------------------------- #
# JWT security (problem #3) — real verifier, no mocks
# --------------------------------------------------------------------------- #

SECRET = "unit-test-jwt-secret"


def make_jwt(**overrides):
    now = datetime.now(timezone.utc)
    claims = {
        "sub": str(uuid.uuid4()),
        "email": "jwt@test.com",
        "aud": "authenticated",
        "iat": now,
        "exp": now + timedelta(minutes=10),
    }
    claims.update(overrides)
    for key in [k for k, v in claims.items() if v is None]:
        claims.pop(key)
    return pyjwt.encode(claims, SECRET, algorithm="HS256")


class TestJwtSecurity:
    @pytest.fixture(autouse=True)
    def secret_env(self, monkeypatch):
        monkeypatch.setattr(supabase_config_module, "SUPABASE_JWT_SECRET", SECRET)

    def test_valid_signature_decodes(self):
        payload = supabase_config_module.verify_supabase_token(make_jwt())
        assert payload is not None
        assert payload.email == "jwt@test.com"
        assert payload.is_authenticated

    def test_tampered_signature_rejected(self):
        token = make_jwt()
        suffix = "aaaaaa" if token[-6:] != "aaaaaa" else "bbbbbb"
        assert supabase_config_module.verify_supabase_token(token[:-6] + suffix) is None

    def test_expired_token_rejected(self):
        assert supabase_config_module.verify_supabase_token(make_jwt(exp=-10)) is None

    def test_garbage_token_rejected(self):
        assert supabase_config_module.verify_supabase_token("not.a.jwt") is None

    def test_missing_subject_rejected(self):
        assert supabase_config_module.verify_supabase_token(make_jwt(sub=None)) is None

    def test_fails_closed_without_any_key(self, monkeypatch):
        """No JWT secret and no reachable JWKS -> authentication failure."""
        monkeypatch.setattr(supabase_config_module, "SUPABASE_JWT_SECRET", "")
        monkeypatch.setattr(supabase_config_module, "SUPABASE_URL", "")
        assert supabase_config_module.verify_supabase_token(make_jwt()) is None


# --------------------------------------------------------------------------- #
# Authentication + authorization (problems #3, #4)
# --------------------------------------------------------------------------- #

class TestAuth:
    def test_root(self, api):
        assert api.get("/").status_code == 200
        assert api.get("/").json() == {"message": "Running!"}

    def test_me_requires_token(self, api):
        assert api.get("/auth/me").status_code == 401

    def test_me_rejects_invalid_token(self, api):
        response = api.get("/auth/me", headers={"Authorization": "Bearer junk"})
        assert response.status_code == 401

    def test_first_request_auto_provisions_patient_role(self, api, fake_db):
        """Token metadata claims caretaker, but DB provisioning must stay patient."""
        sub = str(uuid.uuid4())
        headers = {"Authorization": f"Bearer tok:{sub}:new@x.com:caretaker:Evil Eve"}
        response = api.get("/auth/me", headers=headers)
        assert response.status_code == 200
        assert response.json()["role"] == "patient"
        profile = fake_db.tables["profiles"][0]
        assert profile["role"] == "patient"

    def test_setup_profile_sets_role_in_db(self, api, fake_db):
        sub = str(uuid.uuid4())
        headers = {"Authorization": f"Bearer tok:{sub}:c@x.com:caretaker:Carla Cruz"}
        response = api.post(
            "/auth/setup-profile",
            json={"full_name": "Carla Cruz", "role": "caretaker"},
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["role"] == "caretaker"
        profile = fake_db.tables["profiles"][0]
        assert profile["role"] == "caretaker"
        assert profile["full_name"] == "Carla Cruz"

    def test_setup_profile_replaces_auto_provisioned_patient_role(self, api, fake_db):
        """Auto-provision pins 'patient'; onboarding must still be able to set caretaker."""
        sub = str(uuid.uuid4())
        headers = {"Authorization": f"Bearer tok:{sub}:d@x.com:caretaker:Dana Diaz"}
        assert api.get("/auth/me", headers=headers).json()["role"] == "patient"

        response = api.post(
            "/auth/setup-profile",
            json={"full_name": "Dana Diaz", "role": "caretaker"},
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["role"] == "caretaker"
        profile = next(p for p in fake_db.tables["profiles"] if p["id"] == sub)
        assert profile["role"] == "caretaker"
        assert profile["full_name"] == "Dana Diaz"

        # The caretaker-only surface must now accept this user.
        assert api.get("/caretaker/link-requests", headers=headers).status_code == 200

    def test_setup_profile_rejects_unknown_role(self, api):
        sub = str(uuid.uuid4())
        headers = {"Authorization": f"Bearer tok:{sub}:x@x.com:patient:X"}
        response = api.post(
            "/auth/setup-profile",
            json={"full_name": "X", "role": "admin"},
            headers=headers,
        )
        assert response.status_code == 400

    def test_db_role_overrides_token_role(self, api, fake_db):
        """Profile says patient, token says caretaker -> API must see patient."""
        _, auth = patient_token(fake_db, email="p@test.com")
        forged = {"Authorization": auth["Authorization"].replace(":patient:", ":caretaker:")}
        assert api.get("/patient/me", headers=forged).status_code == 200
        assert api.get("/caretaker/report", headers=forged).status_code == 403


# --------------------------------------------------------------------------- #
# Patient CRUD (problem #2) — rows must land in the fake Supabase tables
# --------------------------------------------------------------------------- #

class TestPatientCrud:
    def test_profile_update_persists(self, api, fake_db):
        _, auth = patient_token(fake_db, email="p1@test.com", name="Old Name")
        response = api.put(
            "/patient/me",
            json={
                "full_name": "Pat One",
                "age": 72,
                "preferred_language": "Hindi",
                "caregiver_email": "c1@test.com",
            },
            headers=auth,
        )
        assert response.status_code == 200
        profile = fake_db.tables["profiles"][0]
        assert profile["full_name"] == "Pat One"
        assert profile["age"] == 72
        assert profile["preferred_language"] == "Hindi"
        assert profile["caregiver_email"] == "c1@test.com"

        fetched = api.get("/patient/me", headers=auth).json()
        assert fetched["full_name"] == "Pat One"
        assert fetched["age"] == 72
        assert fetched["preferred_language"] == "Hindi"

    def test_mood_saved_as_mood_task(self, api, fake_db):
        _, auth = patient_token(fake_db, email="p1@test.com")
        response = api.post(
            "/patient/mood", json={"mood": "good", "note": "feeling great"}, headers=auth
        )
        assert response.status_code == 200
        mood_rows = [t for t in fake_db.tables["tasks"] if t["task_type"] == "Mood"]
        assert len(mood_rows) == 1
        assert mood_rows[0]["is_active"] is False
        assert mood_rows[0]["title"] == "Mood: Good"

        history = api.get("/patient/mood-history", headers=auth).json()
        assert history["current_mood"] == "good"
        assert history["mood_history"][0]["mood"] == "good"
        assert history["mood_history"][0]["note"] == "feeling great"

    def test_mood_rejects_invalid_value(self, api, fake_db):
        _, auth = patient_token(fake_db, email="p1@test.com")
        response = api.post("/patient/mood", json={"mood": "ecstatic"}, headers=auth)
        assert response.status_code == 400

    def test_mood_tasks_hidden_from_reminders(self, api, fake_db):
        _, auth = patient_token(fake_db, email="p1@test.com")
        api.post("/patient/mood", json={"mood": "okay"}, headers=auth)
        data = api.get("/patient/reminders", headers=auth).json()
        assert data["reminders"] == []
        assert data["done_count"] == 0

    def test_reminder_complete_records_completion(self, api, fake_db):
        sub, auth = patient_token(fake_db, email="p1@test.com")
        fake_db.tables["tasks"].append(
            {
                "id": "task-1",
                "patient_id": sub,
                "title": "Walk",
                "description": "Morning walk",
                "scheduled_time": "07:30:00",
                "task_type": "Routine",
                "is_active": True,
            }
        )

        listed = api.get("/patient/reminders", headers=auth).json()
        assert [r["title"] for r in listed["reminders"]] == ["Walk"]
        assert listed["reminders"][0]["time"] == "07:30:00"

        done = api.post(
            "/patient/reminders/complete", json={"reminder_id": "task-1"}, headers=auth
        )
        assert done.status_code == 200
        assert done.json()["done_count"] == 1
        assert len(fake_db.tables["task_completions"]) == 1
        assert fake_db.tables["task_completions"][0]["task_id"] == "task-1"
        assert fake_db.tables["task_completions"][0]["status"] == "completed"

        after = api.get("/patient/reminders", headers=auth).json()
        assert after["reminders"] == []
        assert after["done_count"] == 1

    def test_cannot_complete_someone_elses_reminder(self, api, fake_db):
        other_sub, _ = patient_token(fake_db, email="other@test.com")
        _, auth = patient_token(fake_db, email="p1@test.com")
        fake_db.tables["tasks"].append(
            {
                "id": "task-other",
                "patient_id": other_sub,
                "title": "Not mine",
                "scheduled_time": "08:00:00",
                "task_type": "Routine",
                "is_active": True,
            }
        )
        response = api.post(
            "/patient/reminders/complete",
            json={"reminder_id": "task-other"},
            headers=auth,
        )
        assert response.status_code == 404
        assert fake_db.tables["task_completions"] == []

    def test_medications_read_view(self, api, fake_db):
        sub, auth = patient_token(fake_db, email="p1@test.com")
        fake_db.tables["medications"].append(
            {
                "id": "med-1",
                "patient_id": sub,
                "name": "Metformin",
                "dosage": "500mg",
                "scheduled_time": "09:00:00",
                "frequency": "Daily",
                "instructions": "After breakfast",
                "is_active": True,
            }
        )
        data = api.get("/patient/medications", headers=auth).json()
        assert len(data["medications"]) == 1
        med = data["medications"][0]
        assert med["name"] == "Metformin"
        assert med["time"] == "09:00:00"

    def test_game_complete_creates_game_and_session(self, api, fake_db):
        _, auth = patient_token(fake_db, email="p1@test.com")
        response = api.post(
            "/patient/game-complete",
            json={"game_id": "pattern", "game_name": "Pattern Memory"},
            headers=auth,
        )
        assert response.status_code == 200
        assert response.json()["count"] == 1
        assert [g["name"] for g in fake_db.tables["games"]] == ["Pattern Memory"]
        assert len(fake_db.tables["game_sessions"]) == 1
        assert fake_db.tables["game_sessions"][0]["score"] == 0

        me = api.get("/patient/me", headers=auth).json()
        assert me["games_played"][0]["game_name"] == "Pattern Memory"


# --------------------------------------------------------------------------- #
# Caretaker authorization + link-scoped access (problem #4)
# --------------------------------------------------------------------------- #

class TestCaretakerPermissions:
    def test_caretaker_blocked_from_patient_routes(self, api, fake_db):
        _, auth = caretaker_token(fake_db, email="c1@test.com")
        assert api.get("/patient/me", headers=auth).status_code == 403
        assert api.post("/patient/mood", json={"mood": "good"}, headers=auth).status_code == 403

    def test_report_lists_only_linked_patients(self, api, fake_db):
        caretaker_sub, caretaker_auth = caretaker_token(fake_db, email="c1@test.com")
        linked_sub, _ = patient_token(fake_db, email="linked@test.com", name="Linked One")
        patient_token(fake_db, email="stranger@test.com", name="Stranger")
        link(fake_db, caretaker_sub, linked_sub)

        data = api.get("/caretaker/report", headers=caretaker_auth).json()
        assert data["count"] == 1
        assert data["patients"][0]["email"] == "linked@test.com"

    def test_caretaker_reminders_require_link(self, api, fake_db):
        _, caretaker_auth = caretaker_token(fake_db, email="c1@test.com")
        patient_token(fake_db, email="unlinked@test.com")

        response = api.post(
            "/caretaker/reminders",
            json={
                "patient_email": "unlinked@test.com",
                "title": "Walk",
                "time": "07:00",
                "times": ["07:00"],
                "type": "Routine",
            },
            headers=caretaker_auth,
        )
        assert response.status_code == 403
        assert fake_db.tables["tasks"] == []

    def test_caretaker_reminders_create_patient_tasks(self, api, fake_db):
        caretaker_sub, caretaker_auth = caretaker_token(fake_db, email="c1@test.com")
        patient_sub, patient_auth = patient_token(fake_db, email="p1@test.com")
        link(fake_db, caretaker_sub, patient_sub)

        response = api.post(
            "/caretaker/reminders",
            json={
                "patient_email": "p1@test.com",
                "title": "Morning walk",
                "description": "Around the block",
                "time": "07:00",
                "times": ["07:00", "18:00"],
                "type": "Activity",
            },
            headers=caretaker_auth,
        )
        assert response.status_code == 200
        titles = [t["title"] for t in fake_db.tables["tasks"]]
        assert titles.count("Morning walk") == 2

        listed = api.get("/patient/reminders", headers=patient_auth).json()
        assert len(listed["reminders"]) == 2

    def test_medication_crud_syncs_patient_view(self, api, fake_db):
        caretaker_sub, caretaker_auth = caretaker_token(fake_db, email="c1@test.com")
        patient_sub, patient_auth = patient_token(fake_db, email="p1@test.com")
        link(fake_db, caretaker_sub, patient_sub)

        created = api.post(
            "/caretaker/medications",
            json={
                "patient_email": "p1@test.com",
                "name": "Metformin",
                "dosage": "500mg",
                "time": "09:00",
                "frequency": "Daily",
                "instructions": "After breakfast",
            },
            headers=caretaker_auth,
        )
        assert created.status_code == 200
        med_id = created.json()["medication"]["id"]
        assert len(fake_db.tables["medications"]) == 1

        # Patient sees the medication and a matching Medicine reminder.
        meds = api.get("/patient/medications", headers=patient_auth).json()["medications"]
        assert [m["name"] for m in meds] == ["Metformin"]
        rems = api.get("/patient/reminders", headers=patient_auth).json()["reminders"]
        assert any(r["title"] == "Metformin" for r in rems)

        # Update syncs the linked reminder title.
        updated = api.put(
            f"/caretaker/medications/{med_id}",
            json={"patient_email": "p1@test.com", "name": "Metformin XR", "time": "09:30"},
            headers=caretaker_auth,
        )
        assert updated.status_code == 200
        rems = api.get("/patient/reminders", headers=patient_auth).json()["reminders"]
        assert any(r["title"] == "Metformin XR" for r in rems)

        # Delete deactivates both the medication row and its reminder.
        deleted = api.delete(
            f"/caretaker/medications/{med_id}",
            params={"patient_email": "p1@test.com"},
            headers=caretaker_auth,
        )
        assert deleted.status_code == 200
        assert fake_db.tables["medications"][0]["is_active"] is False
        rems = api.get("/patient/reminders", headers=patient_auth).json()["reminders"]
        assert not any("Metformin" in r["title"] for r in rems)

    def test_medication_requires_linked_patient(self, api, fake_db):
        _, caretaker_auth = caretaker_token(fake_db, email="c1@test.com")
        patient_token(fake_db, email="stranger@test.com")
        response = api.post(
            "/caretaker/medications",
            json={
                "patient_email": "stranger@test.com",
                "name": "X",
                "dosage": "1mg",
                "time": "08:00",
            },
            headers=caretaker_auth,
        )
        assert response.status_code == 403




# --------------------------------------------------------------------------- #
# Personalized activities (Phase 1) — caretaker creates, patient solves
# --------------------------------------------------------------------------- #

def _create_activity(api, caretaker_auth, patient_email, activity_type="family_memory", title="Family Quiz"):
    return api.post(
        "/caretaker/activities",
        json={"patient_email": patient_email, "activity_type": activity_type, "title": title, "notes": "reminders"},
        headers=caretaker_auth,
    )


def _create_mcq(api, caretaker_auth, activity_id, text="Who is this?", correct="Grandfather"):
    return api.post(
        f"/caretaker/activities/{activity_id}/questions",
        json={
            "question_type": "mcq",
            "question_text": text,
            "options": ["Grandfather", "Uncle", "Brother", "Neighbor"],
            "correct_answer": correct,
        },
        headers=caretaker_auth,
    )


class TestActivities:
    def test_requires_caretaker_role(self, api, fake_db):
        _, patient_auth = patient_token(fake_db, email="p1@test.com")
        response = api.post(
            "/caretaker/activities",
            json={"patient_email": "p1@test.com", "activity_type": "family_memory", "title": "X"},
            headers=patient_auth,
        )
        assert response.status_code == 403

    def test_unlinked_patient_cannot_get_activities(self, api, fake_db):
        _, caretaker_auth = caretaker_token(fake_db, email="c1@test.com")
        patient_token(fake_db, email="stranger@test.com")
        response = api.get("/caretaker/activities?patient_email=stranger@test.com", headers=caretaker_auth)
        assert response.status_code == 403

    def test_caretaker_creates_activity_for_linked_patient(self, api, fake_db):
        caretaker_sub, caretaker_auth = caretaker_token(fake_db, email="c1@test.com")
        patient_sub, _ = patient_token(fake_db, email="p1@test.com")
        link(fake_db, caretaker_sub, patient_sub)

        response = _create_activity(api, caretaker_auth, "p1@test.com")
        assert response.status_code == 200
        activity_id = response.json()["activity"]["id"]
        assert activity_id

        listed = api.get("/caretaker/activities?patient_email=p1@test.com", headers=caretaker_auth)
        assert listed.status_code == 200
        assert [a["title"] for a in listed.json()["activities"]] == ["Family Quiz"]

    def test_mcq_validation_exact_four_options(self, api, fake_db):
        caretaker_sub, caretaker_auth = caretaker_token(fake_db, email="c1@test.com")
        patient_sub, _ = patient_token(fake_db, email="p1@test.com")
        link(fake_db, caretaker_sub, patient_sub)
        activity_id = _create_activity(api, caretaker_auth, "p1@test.com").json()["activity"]["id"]

        # Three options -> rejected.
        bad = api.post(
            f"/caretaker/activities/{activity_id}/questions",
            json={"question_type": "mcq", "question_text": "Q", "options": ["a", "b", "c"], "correct_answer": "a"},
            headers=caretaker_auth,
        )
        assert bad.status_code == 400

        # correct_answer not in options -> rejected.
        bad2 = api.post(
            f"/caretaker/activities/{activity_id}/questions",
            json={"question_type": "mcq", "question_text": "Q", "options": ["a", "b", "c", "d"], "correct_answer": "z"},
            headers=caretaker_auth,
        )
        assert bad2.status_code == 400

        good = _create_mcq(api, caretaker_auth, activity_id)
        assert good.status_code == 200
        assert good.json()["question"]["correct_answer"] == "Grandfather"

    def test_caretaker_can_edit_and_delete_question(self, api, fake_db):
        caretaker_sub, caretaker_auth = caretaker_token(fake_db, email="c1@test.com")
        patient_sub, patient_auth = patient_token(fake_db, email="p1@test.com")
        link(fake_db, caretaker_sub, patient_sub)
        activity_id = _create_activity(api, caretaker_auth, "p1@test.com").json()["activity"]["id"]
        qid = _create_mcq(api, caretaker_auth, activity_id).json()["question"]["id"]

        updated = api.put(
            f"/caretaker/activity-questions/{qid}",
            json={"question_text": "Updated?", "correct_answer": "Brother", "options": ["Grandfather", "Uncle", "Brother", "Neighbor"]},
            headers=caretaker_auth,
        )
        assert updated.status_code == 200
        assert updated.json()["question"]["question_text"] == "Updated?"

        deleted = api.delete(f"/caretaker/activity-questions/{qid}", headers=caretaker_auth)
        assert deleted.status_code == 200
        # Deleted question no longer shows for the patient.
        detail = api.get(f"/patient/activities/{activity_id}", headers=patient_auth).json()
        assert detail["question_count"] == 0

    def test_patient_cannot_access_other_patients_activity(self, api, fake_db):
        caretaker_sub, caretaker_auth = caretaker_token(fake_db, email="c1@test.com")
        patient_sub, _ = patient_token(fake_db, email="p1@test.com")
        patient2_sub, patient2_auth = patient_token(fake_db, email="p2@test.com")
        link(fake_db, caretaker_sub, patient_sub)

        activity_id = _create_activity(api, caretaker_auth, "p1@test.com").json()["activity"]["id"]
        # p2 has no link to this activity -> 403.
        response = api.get(f"/patient/activities/{activity_id}", headers=patient2_auth)
        assert response.status_code == 403

    def test_patient_start_returns_five_random_questions_no_answers(self, api, fake_db):
        caretaker_sub, caretaker_auth = caretaker_token(fake_db, email="c1@test.com")
        patient_sub, patient_auth = patient_token(fake_db, email="p1@test.com")
        link(fake_db, caretaker_sub, patient_sub)
        activity_id = _create_activity(api, caretaker_auth, "p1@test.com").json()["activity"]["id"]

        for i in range(15):
            _create_mcq(api, caretaker_auth, activity_id, text=f"Q{i}")

        started = api.post(f"/patient/activities/{activity_id}/start", headers=patient_auth)
        assert started.status_code == 200
        session = started.json()["session"]
        questions = started.json()["questions"]
        assert session["total_questions"] == 5
        assert len(questions) == 5

        for q in questions:
            assert "correct_answer" not in q
            assert "options" in q
            assert len(q["options"]) == 4

        # Only the patient sees their own session.
        other_sub, other_auth = patient_token(fake_db, email="other@test.com")
        forbidden = api.get(f"/patient/activity-sessions/{session['id']}", headers=other_auth)
        assert forbidden.status_code == 403

    def test_scoring_is_server_side(self, api, fake_db):
        caretaker_sub, caretaker_auth = caretaker_token(fake_db, email="c1@test.com")
        patient_sub, patient_auth = patient_token(fake_db, email="p1@test.com")
        link(fake_db, caretaker_sub, patient_sub)
        activity_id = _create_activity(api, caretaker_auth, "p1@test.com").json()["activity"]["id"]

        _create_mcq(api, caretaker_auth, activity_id, text="Q1", correct="Brother")
        started = api.post(f"/patient/activities/{activity_id}/start", headers=patient_auth)
        session = started.json()["session"]
        q = started.json()["questions"][0]

        # Correct answer.
        ans = api.post(
            f"/patient/activity-sessions/{session['id']}/answer",
            json={"question_id": q["id"], "answer": "Brother"},
            headers=patient_auth,
        )
        assert ans.status_code == 200
        assert ans.json()["correct"] is True

        completed = api.post(f"/patient/activity-sessions/{session['id']}/complete", headers=patient_auth)
        assert completed.status_code == 200
        result = completed.json()["result"]
        assert result["correct_count"] == 1
        assert result["total_questions"] == 1
        assert result["score"] == 100

    def test_text_answer_normalization_phone(self, api, fake_db):
        caretaker_sub, caretaker_auth = caretaker_token(fake_db, email="c1@test.com")
        patient_sub, patient_auth = patient_token(fake_db, email="p1@test.com")
        link(fake_db, caretaker_sub, patient_sub)
        activity_id = _create_activity(api, caretaker_auth, "p1@test.com").json()["activity"]["id"]

        api.post(
            f"/caretaker/activities/{activity_id}/questions",
            json={
                "question_type": "text",
                "question_text": "Your phone?",
                "correct_answer": "+91 98765-43210",
                "metadata": {"normalize": "phone"},
            },
            headers=caretaker_auth,
        )
        started = api.post(f"/patient/activities/{activity_id}/start", headers=patient_auth)
        session = started.json()["session"]
        q = started.json()["questions"][0]

        ans = api.post(
            f"/patient/activity-sessions/{session['id']}/answer",
            json={"question_id": q["id"], "answer": "9876543210"},
            headers=patient_auth,
        )
        assert ans.status_code == 200
        assert ans.json()["correct"] is True

    def test_caretaker_sees_results(self, api, fake_db):
        caretaker_sub, caretaker_auth = caretaker_token(fake_db, email="c1@test.com")
        patient_sub, patient_auth = patient_token(fake_db, email="p1@test.com")
        link(fake_db, caretaker_sub, patient_sub)
        activity_id = _create_activity(api, caretaker_auth, "p1@test.com").json()["activity"]["id"]
        _create_mcq(api, caretaker_auth, activity_id)

        started = api.post(f"/patient/activities/{activity_id}/start", headers=patient_auth).json()
        q = started["questions"][0]
        api.post(
            f"/patient/activity-sessions/{started['session']['id']}/answer",
            json={"question_id": q["id"], "answer": "Grandfather"},
            headers=patient_auth,
        )
        api.post(f"/patient/activity-sessions/{started['session']['id']}/complete", headers=patient_auth)

        results = api.get(
            f"/caretaker/activities/{activity_id}/results?patient_email=p1@test.com",
            headers=caretaker_auth,
        )
        assert results.status_code == 200
        assert results.json()["count"] == 1
        assert results.json()["results"][0]["correct_count"] == 1


# --------------------------------------------------------------------------- #
# Activity image uploads (Supabase Storage)
# --------------------------------------------------------------------------- #

class TestImageUpload:
    def _upload(self, api, auth, *, filename="photo.png", content=b"\x89PNG\r\n\x1a\nfake", mime="image/png"):
        return api.post(
            "/caretaker/uploads/image",
            headers=auth,
            files={"file": (filename, content, mime)},
        )

    def test_caretaker_can_upload_image(self, api, fake_db, monkeypatch):
        captured = {}

        def fake_upload(*, caretaker_id, content, content_type):
            captured["caretaker_id"] = caretaker_id
            captured["content"] = content
            captured["content_type"] = content_type
            return {
                "path": f"activity-images/activities/{caretaker_id}/abc123.png",
                "url": f"https://supabase.example/storage/v1/object/public/activity-images/activities/{caretaker_id}/abc123.png",
            }

        monkeypatch.setattr(supabase_db, "upload_activity_image", fake_upload)
        caretaker_sub, caretaker_auth = caretaker_token(fake_db)

        response = self._upload(api, caretaker_auth)

        assert response.status_code == 200
        body = response.json()
        assert body["url"].startswith("https://supabase.example/")
        assert body["path"].startswith("activity-images/")
        assert captured["caretaker_id"] == caretaker_sub
        assert captured["content"] == b"\x89PNG\r\n\x1a\nfake"
        assert captured["content_type"] == "image/png"

    def test_patient_cannot_upload(self, api, fake_db):
        _, patient_auth = patient_token(fake_db)
        response = self._upload(api, patient_auth)
        assert response.status_code == 403

    def test_rejects_non_image(self, api, fake_db):
        _, caretaker_auth = caretaker_token(fake_db)
        response = self._upload(api, caretaker_auth, filename="notes.txt", content=b"hello", mime="text/plain")
        assert response.status_code == 400

    def test_rejects_empty_file(self, api, fake_db):
        _, caretaker_auth = caretaker_token(fake_db)
        response = self._upload(api, caretaker_auth, content=b"", mime="image/png")
        assert response.status_code == 400

    def test_rejects_oversized_file(self, api, fake_db):
        _, caretaker_auth = caretaker_token(fake_db)
        response = self._upload(
            api, caretaker_auth, content=b"x" * (supabase_db.MAX_IMAGE_UPLOAD_BYTES + 1)
        )
        assert response.status_code == 413
