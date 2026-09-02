"""End-to-end verification of the activity flow against the live backend.

Run from the repo root with the backend venv python:
    backend/.venv/Scripts/python e2e_check.py

Covers: signup (caretaker+patient) -> profile setup -> link request -> accept ->
create activity -> upload image (real Supabase Storage) -> create 6 questions ->
patient lists activities -> start session (exactly 5 random questions, no
correct answers exposed) -> answer (1 wrong, 4 right) -> complete -> score ->
caretaker views results.
"""

import json
import pathlib
import sys
import time

import httpx

ROOT = pathlib.Path(__file__).resolve().parent
BASE = "http://localhost:8000"

env = {}
for line in (ROOT / "backend" / ".env").read_text(encoding="utf-8-sig").splitlines():
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")

SUPABASE_URL = env["SUPABASE_URL"].rstrip("/")
PUB = env.get("SUPABASE_PUBLISHABLE_KEY", "")

fails = []


def check(name, cond, extra=""):
    print(f"[{'PASS' if cond else 'FAIL'}] {name}" + (f" -- {extra}" if extra else ""))
    if not cond:
        fails.append(name)


stamp = str(int(time.time()))
C_EMAIL = f"ctk.e2e.{stamp}@maitritest.com"
P_EMAIL = f"pt.e2e.{stamp}@maitritest.com"
PW = "MaitriE2E!2026"


def signup(email):
    r = httpx.post(
        f"{SUPABASE_URL}/auth/v1/signup",
        headers={"apikey": PUB, "Content-Type": "application/json"},
        json={"email": email, "password": PW},
        timeout=30,
    )
    try:
        body = r.json()
    except Exception:
        body = {}
    token = (body.get("session") or {}).get("access_token")
    if not token:
        print(f"  signup raw ({r.status_code}): {str(body)[:300]}")
        try:
            r2 = httpx.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                headers={"apikey": PUB, "Content-Type": "application/json"},
                json={"email": email, "password": PW},
                timeout=30,
            )
            token = (r2.json() or {}).get("access_token")
        except Exception:
            token = None
    return token


def bh(tok):
    return {"Authorization": f"Bearer {tok}"}


print("=== 1. Signup + profiles ===")
ctk_tok = signup(C_EMAIL)
p_tok = signup(P_EMAIL)
check("caretaker signup returns a session", bool(ctk_tok), C_EMAIL)
check("patient signup returns a session", bool(p_tok), P_EMAIL)
if not (ctk_tok and p_tok):
    print("ABORT: cannot continue without tokens")
    sys.exit(1)

for tok, role, name in ((ctk_tok, "caretaker", "E2E Caretaker"), (p_tok, "patient", "E2E Patient")):
    r = httpx.post(f"{BASE}/auth/setup-profile", headers=bh(tok), json={"role": role, "full_name": name}, timeout=20)
    check(f"setup-profile {role}", r.status_code == 200, r.text[:160])

print("=== 2. Caretaker <-> patient link ===")
r = httpx.post(f"{BASE}/caretaker/link-request", headers=bh(ctk_tok), json={"patient_email": P_EMAIL}, timeout=20)
check("caretaker sends link request", r.status_code == 200, r.text[:160])
r = httpx.get(f"{BASE}/patient/link-request", headers=bh(p_tok), timeout=20)
check("patient sees pending request", r.status_code == 200 and r.json().get("pending_caregiver_email"), r.text[:160])
r = httpx.post(f"{BASE}/patient/link-request/respond", headers=bh(p_tok), json={"accept": True}, timeout=20)
check("patient accepts link", r.status_code == 200, r.text[:160])

print("=== 3. Activity + image upload + questions ===")
r = httpx.post(
    f"{BASE}/caretaker/activities",
    headers=bh(ctk_tok),
    json={"patient_email": P_EMAIL, "activity_type": "family_memory", "title": "E2E Memory Activity"},
    timeout=20,
)
check("create activity", r.status_code == 200, r.text[:160])
activity_id = (r.json() or {}).get("activity", {}).get("id")

# 1x1 transparent PNG
png = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000a49444154789c6360000002000154a24f5f0000000049454e44ae426082"
)
r = httpx.post(
    f"{BASE}/caretaker/uploads/image",
    headers=bh(ctk_tok),
    files={"file": ("photo.png", png, "image/png")},
    timeout=60,
)
check("upload image to Supabase Storage", r.status_code == 200, r.text[:200])
img_url = (r.json() or {}).get("url", "") if r.status_code == 200 else ""
img_ok = False
if img_url:
    try:
        ir = httpx.get(img_url, timeout=30)
        img_ok = ir.status_code == 200 and ir.content[:4] == b"\x89PNG"
    except Exception:
        img_ok = False
check("uploaded image is publicly readable", img_ok, img_url[:110])

q_ok = 0
for i in range(1, 7):
    question = {
        "question_type": "mcq",
        "question_text": f"What is {i} + {i}?",
        "options": [str(i + i), str(i + i + 1), str(i + i + 2), str(i + 10)],
        "correct_answer": str(i + i),
    }
    if i == 1 and img_url:
        question["image_url"] = img_url
    r = httpx.post(
        f"{BASE}/caretaker/activities/{activity_id}/questions",
        headers=bh(ctk_tok),
        json={"questions": [question]},
        timeout=20,
    )
    if r.status_code == 200:
        q_ok += 1
    else:
        print(f"  question error ({r.status_code}): {r.text[:160]}")
check("create 6 questions", q_ok == 6, f"{q_ok}/6")

print("=== 4. Patient plays ===")
r = httpx.get(f"{BASE}/patient/activities", headers=bh(p_tok), timeout=20)
acts = (r.json() or {}).get("activities", []) if r.status_code == 200 else []
check("patient sees the activity listed", any(a.get("id") == activity_id for a in acts), f"{len(acts)} activities")
check("activity list leaks no correct answers", "correct_answer" not in r.text)

r = httpx.post(f"{BASE}/patient/activities/{activity_id}/start", headers=bh(p_tok), timeout=20)
check("start session", r.status_code == 200, r.text[:200])
body = r.json() if r.status_code == 200 else {}
qs = body.get("questions", [])
sid = (body.get("session") or {}).get("id")
check("exactly 5 random questions served", len(qs) == 5, f"{len(qs)} questions")
check("questions expose no correct answers", not any("correct_answer" in json.dumps(q) for q in qs))
check("image question includes image_url", len([q for q in qs if q.get("image_url")]) == 1)

for idx, q in enumerate(qs):
    options = q.get("options") or []
    answer = "Totally Wrong Answer" if idx == 0 else (str(options[0]) if options else "x")
    r = httpx.post(
        f"{BASE}/patient/activity-sessions/{sid}/answer",
        headers=bh(p_tok),
        json={"question_id": q.get("id"), "answer": answer},
        timeout=20,
    )
    if r.status_code != 200:
        print(f"  answer error ({r.status_code}): {r.text[:160]}")

r = httpx.post(f"{BASE}/patient/activity-sessions/{sid}/complete", headers=bh(p_tok), timeout=20)
check("complete session", r.status_code == 200, r.text[:200])
res = r.json() if r.status_code == 200 else {}
check("score is 4 of 5", res.get("correct_count") == 4, f"correct={res.get('correct_count')} score={res.get('score')}")
check("duration recorded", res.get("duration_seconds") is not None, str(res.get("duration_seconds")))

print("=== 5. Caretaker verifies result ===")
r = httpx.get(
    f"{BASE}/caretaker/activities/{activity_id}/results",
    params={"patient_email": P_EMAIL},
    headers=bh(ctk_tok),
    timeout=20,
)
check("caretaker can view results", r.status_code == 200, r.text[:300])
rj = r.json() if r.status_code == 200 else {}
first = (rj.get("results") or [{}])[0]
check("caretaker sees correct_count 4", first.get("correct_count") == 4, str(first.get("correct_count")))

print()
if fails:
    print(f"RESULT: {len(fails)} check(s) FAILED: {fails}")
    sys.exit(1)
print("RESULT: ALL CHECKS PASSED")
