import { useEffect, useMemo, useState } from "react";
import {UserRound,Pencil,CalendarDays,Languages,Heart,Gamepad2,BookOpen,Bell,ShieldCheck,UsersRound,Check,X,} from "lucide-react";

import { api } from "../../api";
import PatientNavigation from "./PatientNavigation";

export default function Profile({ onNavigate }) {
  const navigate = useMemo(
    () =>
      onNavigate ??
      ((nextPath) => {
        window.location.href = nextPath;
      }),
    [onNavigate]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingRequest, setPendingRequest] = useState(null);
  const [responding, setResponding] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    language: "English",
    caregiver_email: "",
    games_played: [],
  });

  const userName = profile.name?.trim() || "there";

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/logsign");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await api.get("/patient/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const nextProfile = {
          name: data.full_name || data.username || "",
          age:
            data.age === null || data.age === undefined || data.age === ""
              ? ""
              : String(data.age),
          language: data.preferred_language || "English",
          caregiver_email: data.caregiver_email || "",
          games_played: Array.isArray(data.games_played) ? data.games_played : [],
        };

        setProfile(nextProfile);

        if (nextProfile.name) {
          localStorage.setItem("full_name", nextProfile.name);
        } else {
          localStorage.removeItem("full_name");
        }
      } catch (err) {
        setError(err.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    api
      .get("/patient/link-request", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((data) => {
        if (data?.pending_caregiver_email) {
          setPendingRequest({
            caregiver_email: data.pending_caregiver_email,
            caregiver_name: data.pending_caregiver_name || "",
          });
        } else {
          setPendingRequest(null);
        }
      })
      .catch(() => setPendingRequest(null));
  }, [navigate]);

  const handleProfileChange = (field, value) => {
    setProfile((currentProfile) => ({ ...currentProfile, [field]: value }));
    setError("");
    setSuccessMessage("");
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const token = localStorage.getItem("access_token");
      const nextName = (profile.name ?? "").trim();
      const nextAgeValue =
        profile.age === "" || profile.age === null || profile.age === undefined
          ? null
          : Number(profile.age);

      if (
        profile.age !== "" &&
        profile.age !== null &&
        profile.age !== undefined &&
        (!Number.isFinite(nextAgeValue) || Number.isNaN(nextAgeValue))
      ) {
        setError("Please enter a valid age.");
        return;
      }

      await api.put(
        "/patient/me",
        {
          full_name: nextName || "",
          age: nextAgeValue,
          preferred_language: profile.language || "English",
          caregiver_email: (profile.caregiver_email ?? "").trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const savedName = nextName || "there";
      setProfile((currentProfile) => ({
        ...currentProfile,
        name: savedName,
      }));
      localStorage.setItem("full_name", savedName);
      setSuccessMessage("Profile saved.");
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const respondToLinkRequest = async (accept) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/logsign");
      return;
    }

    setResponding(true);
    setError("");
    setSuccessMessage("");

    try {
      const data = await api.post(
        "/patient/link-request/respond",
        { accept },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (accept && data?.caregiver_email) {
        setProfile((currentProfile) => ({
          ...currentProfile,
          caregiver_email: data.caregiver_email,
        }));
        setSuccessMessage("Caregiver approved.");
      } else {
        setSuccessMessage("Caregiver request declined.");
      }
      setPendingRequest(null);
    } catch (err) {
      setError(err.message || "We couldn't process that request.");
    } finally {
      setResponding(false);
    }
  };

  return (
    <div  className="theme-page min-h-screen pb-16"  style={{ background: "#FBF8F2", color: "#20261F", fontFamily: "Verdana, Tahoma, 'Segoe UI', system-ui, sans-serif",}}>
      <PatientNavigation onNavigate={navigate} activePage="profile"/>

      <main className="mx-auto mt-10 max-w-5xl px-6">
        <section className="text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">My Profile </h1>
          <p className="mx-auto mt-3 max-w-2xl text-xl" style={{ color: "#5B6459" }}> Your personal information and activity.</p>
        </section>


        <section className="mx-auto mt-8 max-w-3xl rounded-3xl p-6 sm:p-8" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8", }} >
          <div className="flex flex-col items-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-full" style={{ background: "#F3E7D0", border: "4px solid #2F6F62", color: "#2F6F62", }}>
              <UserRound className="h-16 w-16" aria-hidden="true" />
            </div> 
            <h2 className="mt-5 text-3xl font-bold">{userName}</h2>
            <p className="mt-1 text-lg" style={{ color: "#5B6459" }}>Patient</p>
          </div>

          <button type="button" onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true)) } className="mx-auto mt-6 flex items-center justify-center gap-2 rounded-full px-7 py-3 text-lg font-bold active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70" style={{ background: isEditing ? "#FFFFFF" : "#2F6F62", color: isEditing   ? "#2F6F62"   : "#FFFFFF", border: isEditing   ? "2px solid #2F6F62"   : "2px solid #2F6F62", }} disabled={saving || loading}>
            {saving ? (
              <>Saving...</>
            ) : isEditing ? (
              <><Check className="h-5 w-5" aria-hidden="true"/>Done Editing</>
            ) : (
              <> <Pencil className="h-5 w-5" aria-hidden="true"/>Edit Profile</>
            )}
          </button>
          {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
          {!error && successMessage && <p className="mt-4 text-center text-sm text-green-700">{successMessage}</p>}
          {loading && !error && <p className="mt-4 text-center text-sm text-[#5B6459]">Loading your profile...</p>}
        </section>

        {pendingRequest && (
          <section
            className="mx-auto mt-8 max-w-3xl rounded-3xl p-6 sm:p-8"
            style={{ background: "#F3E7D0", border: "2px solid #C97A2B" }}
            aria-label="Caregiver request"
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
                style={{ background: "#FFFFFF", color: "#C97A2B" }}
              >
                <UsersRound className="h-7 w-7" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold" style={{ color: "#8A4E12" }}>
                  Caregiver Request
                </p>
                <p className="mt-1 text-lg font-semibold" style={{ color: "#20261F" }}>
                  {pendingRequest.caregiver_name || pendingRequest.caregiver_email}{" "}
                  wants to be your caregiver.
                </p>
                <p className="mt-1 text-base" style={{ color: "#5B6459" }}>
                  {pendingRequest.caregiver_email} will be able to add reminders and
                  medicines for you once you approve.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => respondToLinkRequest(true)}
                disabled={responding}
                className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-lg font-bold active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ background: "#2F6F62", color: "#FFFFFF", border: "2px solid #2F6F62" }}
              >
                <Check className="h-5 w-5" aria-hidden="true" />
                {responding ? "Approving..." : "Approve"}
              </button>
              <button
                type="button"
                onClick={() => respondToLinkRequest(false)}
                disabled={responding}
                className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-lg font-bold active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#B23A3A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ background: "#FFFFFF", color: "#B23A3A", border: "2px solid #B23A3A" }}
              >
                <X className="h-5 w-5" aria-hidden="true" />
                Decline
              </button>
            </div>
          </section>
        )}

        <section className="mx-auto mt-8 max-w-3xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Personal Information</h2>
            <span className="rounded-full border border-[#2F6F62] bg-[#E4F0EC] px-3 py-1 text-sm font-bold text-[#2F6F62]">
              Care plan
            </span>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-3xl p-5" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8", }} >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: "#F3E7D0", color: "#8A4E12", }}>
                  <UserRound className="h-7 w-7" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold" style={{ color: "#5B6459" }}>  Name</p>
                  {isEditing ? (
                    <input type="text" value={profile.name} onChange={(event) => handleProfileChange( "name", event.target.value ) } className="mt-1 w-full rounded-xl border-2 bg-white px-3 py-2 text-lg font-bold outline-none focus:ring-4 focus:ring-[#2F6F62]/20" style={{   borderColor: "#C9C2B2", }}/>
                  ) : (
                    <p className="mt-1 text-xl font-bold">{profile.name || userName}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-5" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8", }}>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: "#E4F0EC", color: "#2F6F62", }}>
                  <CalendarDays className="h-7 w-7" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold" style={{ color: "#5B6459" }} >Age</p>
                  {isEditing ? (
                    <input type="number" value={profile.age} onChange={(event) => handleProfileChange( "age", event.target.value ) } className="mt-1 w-full rounded-xl border-2 bg-white px-3 py-2 text-lg font-bold outline-none focus:ring-4 focus:ring-[#2F6F62]/20" style={{   borderColor: "#C9C2B2", }}/>
                  ) : (
                    <p className="mt-1 text-xl font-bold">{profile.age ? `${profile.age} years` : "Not provided"}</p>
                  )}
                </div>

              </div>
            </div>

            <div className="rounded-3xl p-5" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8", }}>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{background: "#F3E7D0",color: "#8A4E12", }}>
                  <Languages className="h-7 w-7" aria-hidden="true"/>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold" style={{ color: "#5B6459" }}>Preferred Language</p>
                  {isEditing ? (
                    <select value={profile.language} onChange={(event) => handleProfileChange( "language", event.target.value ) } className="mt-1 w-full rounded-xl border-2 bg-white px-3 py-2 text-lg font-bold outline-none focus:ring-4 focus:ring-[#2F6F62]/20" style={{   borderColor: "#C9C2B2", }}>
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Assamese</option>
                      <option>Bengali</option>
                      <option>Manipuri</option>
                      <option>Mizo</option>
                      <option>Khasi</option>
                      <option>Garo</option>
                      <option>Tripuri</option>
                      <option>Nepali</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-xl font-bold">{profile.language}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-5" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8", }}>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: "#F7E2DF", color: "#B23A3A", }}>
                  <UsersRound className="h-7 w-7" aria-hidden="true"/>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold" style={{ color: "#5B6459" }}>Caregiver's Email</p>
                  {isEditing ? (
                    <input type="text" value={profile.caregiver_email} onChange={(event) => handleProfileChange( "caregiver_email",  event.target.value ) } className="mt-1 w-full rounded-xl border-2 bg-white px-3 py-2 text-lg font-bold outline-none focus:ring-4 focus:ring-[#2F6F62]/20" style={{   borderColor: "#C9C2B2", }}/>
                  ) : (<p className="mt-1 text-xl font-bold">{profile.caregiver_email || "Not provided"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-3xl">
          <h2 className="mb-5 text-2xl font-bold"> My Activity</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-3xl p-6 text-center" style={{background: "#E4F0EC", border: "2px solid #2F6F62",}} >
              <Gamepad2 className="mx-auto h-10 w-10" style={{ color: "#2F6F62" }} aria-hidden="true"/>
              <p className="mt-3 text-3xl font-bold">{profile.games_played.length}</p>
              <p className="mt-1 text-lg font-bold" style={{ color: "#5B6459" }}>Games Completed</p>
            </div>
            <div className="rounded-3xl p-6 text-center" style={{ background: "#F3E7D0", border: "2px solid #C97A2B", }}>
              <BookOpen className="mx-auto h-10 w-10" style={{ color: "#C97A2B" }} aria-hidden="true"/>
              <p className="mt-3 text-3xl font-bold">0</p>
              <p className="mt-1 text-lg font-bold" style={{ color: "#5B6459" }} > Stories Listened </p>
            </div>

            <div className="rounded-3xl p-6 text-center" style={{ background: "#F7E2DF", border: "2px solid #B23A3A", }}>
              <Bell className="mx-auto h-10 w-10" style={{ color: "#B23A3A" }} aria-hidden="true" />
              <p className="mt-3 text-3xl font-bold">0</p>
              <p className="mt-1 text-lg font-bold" style={{ color: "#5B6459" }}>Tasks Completed</p>
            </div>
          </div>

          {profile.games_played.length > 0 && (
            <div className="mt-6 rounded-3xl p-5" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8" }}>
              <p className="mb-3 text-xl font-bold">Completed Games</p>
              <ul className="space-y-2">
                {profile.games_played.map((game, index) => (
                  <li key={`${game.game_id || game.game_name || "game"}-${index}`} className="rounded-2xl border border-[#C9C2B2] bg-white px-4 py-3 text-base font-semibold" style={{ color: "#20261F" }}>
                    {game.game_name || game.game_id || "Game"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>


        <section className="mx-auto mt-10 max-w-3xl rounded-3xl p-6 sm:p-8" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8", }}>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: "#E4F0EC", color: "#2F6F62", }}>
              <ShieldCheck className="h-7 w-7" aria-hidden="true"/>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Your Information</h2>
              <p className="mt-2 text-lg leading-relaxed" style={{ color: "#5B6459" }} >
                Your personal information and activity
                data are kept private and are used to
                support your care.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-3xl rounded-3xl p-6 text-center" style={{ background: "#F3E7D0", border: "2px solid #E4DCC8", }}>
          <Heart className="mx-auto h-10 w-10" style={{ color: "#B23A3A" }} aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-bold">Keep taking care of yourself</h2>
          <p className="mt-2 text-lg" style={{ color: "#5B6459" }} >
            Every small activity is a step towards a
            happier and healthier day.
          </p>
        </section>
      </main>
    </div>
  );
}