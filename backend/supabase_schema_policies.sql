-- =============================================================================
-- Maitri - Row Level Security policies (problem #7)
-- Run once in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- These policies secure the EXISTING tables. No schema changes are required.
--
-- Modes of operation:
--   * If the backend is configured with SUPABASE_SECRET_KEY, it uses the
--     service key, which BYPASSES RLS, and the backend enforces authorization
--     in code (role from profiles + caretaker_patients link checks).
--   * If no secret key is configured, the backend forwards the caller's own
--     Supabase JWT, and THESE policies are what protect every table.
--
-- Casts to ::text are used so the policies work whether id columns are
-- `uuid` or `text`.
-- =============================================================================

-- Helper: is the current user a linked caretaker of the given patient?
-- security definer avoids recursive RLS evaluation on caretaker_patients.
create or replace function public.maitri_is_linked_caretaker(patient_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.caretaker_patients cp
    where cp.patient_id::text = patient_id
      and cp.caretaker_id::text = auth.uid()::text
  );
$$;

-- Helper: is the current user linked to the given caretaker (as patient)?
create or replace function public.maitri_is_linked_patient(caretaker_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.caretaker_patients cp
    where cp.caretaker_id::text = caretaker_id
      and cp.patient_id::text = auth.uid()::text
  );
$$;

-- =============================================================================
-- Enable RLS
-- =============================================================================
alter table public.profiles           enable row level security;
alter table public.tasks              enable row level security;
alter table public.task_completions   enable row level security;
alter table public.medications        enable row level security;
alter table public.games              enable row level security;
alter table public.game_sessions      enable row level security;
alter table public.caretaker_patients enable row level security;

-- =============================================================================
-- profiles: users manage their own row; caretakers can read linked patients
-- =============================================================================
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid()::text = id::text);

drop policy if exists profiles_select_linked_patients on public.profiles;
create policy profiles_select_linked_patients on public.profiles
  for select using (public.maitri_is_linked_caretaker(id::text));

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid()::text = id::text);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid()::text = id::text)
  with check (auth.uid()::text = id::text);

-- =============================================================================
-- tasks (reminders + moods + link requests): patient owns rows; caretaker
-- manages rows of linked patients
-- =============================================================================
drop policy if exists tasks_select_own on public.tasks;
create policy tasks_select_own on public.tasks
  for select using (auth.uid()::text = patient_id::text);

drop policy if exists tasks_select_caretaker on public.tasks;
create policy tasks_select_caretaker on public.tasks
  for select using (public.maitri_is_linked_caretaker(patient_id::text));

drop policy if exists tasks_insert_own on public.tasks;
create policy tasks_insert_own on public.tasks
  for insert with check (auth.uid()::text = patient_id::text);

drop policy if exists tasks_insert_caretaker on public.tasks;
create policy tasks_insert_caretaker on public.tasks
  for insert with check (public.maitri_is_linked_caretaker(patient_id::text));

drop policy if exists tasks_update_own on public.tasks;
create policy tasks_update_own on public.tasks
  for update using (auth.uid()::text = patient_id::text)
  with check (auth.uid()::text = patient_id::text);

drop policy if exists tasks_update_caretaker on public.tasks;
create policy tasks_update_caretaker on public.tasks
  for update using (public.maitri_is_linked_caretaker(patient_id::text))
  with check (public.maitri_is_linked_caretaker(patient_id::text));

drop policy if exists tasks_delete_caretaker on public.tasks;
create policy tasks_delete_caretaker on public.tasks
  for delete using (public.maitri_is_linked_caretaker(patient_id::text));


-- =============================================================================
-- task_completions: patient writes own completions; both parties can read
-- =============================================================================
drop policy if exists completions_select_own on public.task_completions;
create policy completions_select_own on public.task_completions
  for select using (auth.uid()::text = patient_id::text);

drop policy if exists completions_select_caretaker on public.task_completions;
create policy completions_select_caretaker on public.task_completions
  for select using (public.maitri_is_linked_caretaker(patient_id::text));

drop policy if exists completions_insert_own on public.task_completions;
create policy completions_insert_own on public.task_completions
  for insert with check (auth.uid()::text = patient_id::text);

-- =============================================================================
-- medications: caretaker manages for linked patients; patient reads own
-- =============================================================================
drop policy if exists medications_select_own on public.medications;
create policy medications_select_own on public.medications
  for select using (auth.uid()::text = patient_id::text);

drop policy if exists medications_select_caretaker on public.medications;
create policy medications_select_caretaker on public.medications
  for select using (public.maitri_is_linked_caretaker(patient_id::text));

drop policy if exists medications_insert_caretaker on public.medications;
create policy medications_insert_caretaker on public.medications
  for insert with check (public.maitri_is_linked_caretaker(patient_id::text));

drop policy if exists medications_update_caretaker on public.medications;
create policy medications_update_caretaker on public.medications
  for update using (public.maitri_is_linked_caretaker(patient_id::text))
  with check (public.maitri_is_linked_caretaker(patient_id::text));

drop policy if exists medications_delete_caretaker on public.medications;
create policy medications_delete_caretaker on public.medications
  for delete using (public.maitri_is_linked_caretaker(patient_id::text));

-- =============================================================================
-- games: shared catalog; any authenticated user can read and add entries
-- =============================================================================
drop policy if exists games_select_all on public.games;
create policy games_select_all on public.games
  for select using (auth.role() = 'authenticated');

drop policy if exists games_insert_authenticated on public.games;
create policy games_insert_authenticated on public.games
  for insert with check (auth.role() = 'authenticated');

-- =============================================================================
-- game_sessions: patient writes own sessions; both parties can read
-- =============================================================================
drop policy if exists game_sessions_select_own on public.game_sessions;
create policy game_sessions_select_own on public.game_sessions
  for select using (auth.uid()::text = patient_id::text);

drop policy if exists game_sessions_select_caretaker on public.game_sessions;
create policy game_sessions_select_caretaker on public.game_sessions
  for select using (public.maitri_is_linked_caretaker(patient_id::text));

drop policy if exists game_sessions_insert_own on public.game_sessions;
create policy game_sessions_insert_own on public.game_sessions
  for insert with check (auth.uid()::text = patient_id::text);

-- =============================================================================
-- caretaker_patients: either party in a link can read/remove it; the caretaker
-- creates the request row and the patient confirms it.
-- =============================================================================
drop policy if exists links_select_parties on public.caretaker_patients;
create policy links_select_parties on public.caretaker_patients
  for select using (
    auth.uid()::text = caretaker_id::text or auth.uid()::text = patient_id::text
  );

drop policy if exists links_insert_caretaker on public.caretaker_patients;
create policy links_insert_caretaker on public.caretaker_patients
  for insert with check (auth.uid()::text = caretaker_id::text);

drop policy if exists links_insert_patient on public.caretaker_patients;
create policy links_insert_patient on public.caretaker_patients
  for insert with check (auth.uid()::text = patient_id::text);

drop policy if exists links_delete_parties on public.caretaker_patients;
create policy links_delete_parties on public.caretaker_patients
  for delete using (
    auth.uid()::text = caretaker_id::text or auth.uid()::text = patient_id::text
  );

-- =============================================================================
-- Verify after applying:
--   select tablename, policyname, cmd from pg_policies
--   where schemaname = 'public' order by tablename, policyname;
-- =============================================================================
