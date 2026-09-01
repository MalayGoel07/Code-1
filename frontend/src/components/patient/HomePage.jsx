import { useEffect, useState } from "react";
import {
  Gamepad2,
  MessageCircle,
  BookOpen,
  Smile,
  Meh,
  Frown,
  PhoneCall,
} from "lucide-react";

import { api } from "../../api";
import PatientNavigation from "./PatientNavigation";

const PRIMARY_ACTIVITIES = [
  {
    icon: MessageCircle,
    label: "Talk",
    sub: "Talk with your companion.",
    tint: "#2F6F62",
    path: "/elder-ai",
  },
  {
    icon: Gamepad2,
    label: "Game",
    sub: "Play a memory game.",
    tint: "#8A6D3B",
    path: "/game",
  },
  {
    icon: BookOpen,
    label: "Story",
    sub: "Listen to a familiar story.",
    tint: "#2F6F62",
    path: "/story",
  },
];

function getGreeting(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function PatientHome({ onNavigate, onLogout }) {
  const navigate =
    onNavigate ??
    ((nextPath) => {
      window.location.href = nextPath;
    });

  const [mood, setMood] = useState(null);
  const [savingMood, setSavingMood] = useState(false);
  const [reminderDone, setReminderDone] = useState(false);
  const [todayReminder, setTodayReminder] = useState(null);
  const [userName, setUserName] = useState(
    typeof window !== "undefined"
      ? window.localStorage.getItem("user_full_name") || window.localStorage.getItem("full_name") || "there"
      : "there"
  );

  useEffect(() => {
    const token = window.localStorage.getItem("access_token");
    if (!token) return;

    api
      .get("/patient/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => {
        const nextName = data?.full_name || data?.username || "there";
        setUserName(nextName);
        window.localStorage.setItem("user_full_name", nextName);
        window.localStorage.setItem("full_name", nextName);
      })
      .catch(() => {});

    api.get("/patient/mood-history", { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => {
        if (data && data.current_mood) {
          setMood(data.current_mood);
          window.localStorage.setItem("current_mood", data.current_mood);
        }
      })
      .catch(() => {});

    api.get("/patient/reminders", { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => {
        const reminders = Array.isArray(data?.reminders) ? data.reminders : [];
        const nextReminder = reminders[0] || null;
        setTodayReminder(nextReminder);
        setReminderDone(!nextReminder && (Number(data?.done_count) || 0) > 0);
      })
      .catch(() => {
        setReminderDone(false);
        setTodayReminder(null);
      });
  }, []);

  const saveMoodSelection = async (nextMood) => {
    const token = window.localStorage.getItem("access_token");
    if (!token) return;

    setMood(nextMood);
    window.localStorage.setItem("current_mood", nextMood);
    setSavingMood(true);

    try {
      await api.post("/patient/mood", { mood: nextMood }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      console.error(error);
    } finally {
      setSavingMood(false);
    }
  };

  const handleReminderComplete = async () => {
    const token = window.localStorage.getItem("access_token");
    if (!token || !todayReminder) return;

    try {
      await api.post(
        "/patient/reminders/complete",
        { reminder_id: todayReminder.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReminderDone(true);
      setTodayReminder(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleHelpCall = () => {
    window.location.href = "tel:+112";
  };

  const hour = new Date().getHours();
  const moodLabel = mood === "good" ? "Happy" : mood === "okay" ? "Okay" : mood === "low" ? "Not good" : "Not set";
  const reminderStatus = reminderDone ? "All clear" : todayReminder ? "1 reminder" : "No pending reminder";

  return (
    <div className="min-h-screen bg-[#FBF8F2] text-[#20261F]" style={{ fontFamily: "'Atkinson Hyperlegible', 'Segoe UI', sans-serif" }}>
      <PatientNavigation onNavigate={navigate} onLogout={onLogout} activePage="home" />

      <header className="mx-auto max-w-5xl px-5 pb-4 pt-8 sm:px-6">
        <div className="rounded-[30px] border border-[#E4DCC8] bg-[#F7F3EC] p-6 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2F6F62]">Welcome</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">{getGreeting(hour)}, {userName}!</h1>
          <p className="mt-3 text-xl leading-relaxed text-[#5B6459]">What would you like to do today?</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-16 sm:px-6">
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[24px] border-2 border-[#E4DCC8] bg-[#EFEEE6] p-4">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#5B6459]">Mood</p>
            <p className="mt-2 text-2xl font-bold text-[#20261F]">{moodLabel}</p>
          </div>
          <div className="rounded-[24px] border-2 border-[#E4DCC8] bg-[#F3E7D0] p-4">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#8A4E12]">Today</p>
            <p className="mt-2 text-2xl font-bold text-[#20261F]">{reminderStatus}</p>
          </div>
          <div className="rounded-[24px] border-2 border-[#E4DCC8] bg-[#E4F0EC] p-4">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#2F6F62]">Support</p>
            <p className="mt-2 text-2xl font-bold text-[#20261F]">Ready</p>
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[28px] border-[3px] border-[#C97A2B] bg-[#F3E7D0] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-[#8A4E12]">Today's reminder</p>
                <p className="mt-3 text-3xl font-bold leading-tight text-[#20261F]">
                  {reminderDone ? (todayReminder ? "Reminder marked as done" : "Medicine marked as done") : (todayReminder?.title || "Take your medicine")}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/60 text-[#8A4E12]">
                <PhoneCall className="h-7 w-7" aria-hidden="true" />
              </div>
            </div>

            <p className="mt-4 text-xl text-[#6B4A1E]">
              {reminderDone ? "No pending reminder left for today." : (todayReminder?.time || "Due at 8:00 AM")}
            </p>

            <button
              type="button"
              onClick={handleReminderComplete}
              disabled={reminderDone || !todayReminder}
              className={[
                "mt-5 w-full rounded-2xl py-4 text-xl font-bold text-white transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C97A2B] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
                reminderDone || !todayReminder ? "bg-[#5B6459]" : "bg-[#C97A2B]",
              ].join(" ")}
            >
              {reminderDone ? "Done for now" : (!todayReminder ? "No reminder left" : "Mark as Done")}
            </button>
          </section>

          <button
            type="button"
            onClick={handleHelpCall}
            className="flex w-full items-center justify-center gap-4 rounded-[28px] bg-[#B23A3A] px-6 py-6 text-left text-white shadow-[0_18px_30px_rgba(178,58,58,0.18)] transition hover:bg-[#9d2e2e] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B23A3A] focus-visible:ring-offset-2"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <PhoneCall className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold">Call for Help</div>
              <div className="text-base text-white/80">Need support now?</div>
            </div>
          </button>
        </div>

        <section className="mt-8 rounded-[28px] border-2 border-[#E4DCC8] bg-[#EFEEE6] p-6 shadow-sm" aria-labelledby="activities-heading">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 id="activities-heading" className="text-3xl font-bold text-[#20261F]">What would you like to do?</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PRIMARY_ACTIVITIES.map(({ icon: Icon, label, sub, tint, path }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(path)}
                className="flex h-full flex-col items-start gap-4 rounded-[24px] border-2 border-[#E4DCC8] bg-white p-5 text-left shadow-sm transition hover:border-[#2F6F62] hover:shadow-md active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: tint }}>
                  <Icon className="h-8 w-8 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#20261F]">{label}</p>
                  <p className="mt-1 text-lg leading-relaxed text-[#5B6459]">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border-2 border-[#E4DCC8] bg-[#EFEEE6] p-6 shadow-sm">
          <p className="text-2xl font-bold text-[#20261F]">How are you feeling today?</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              { key: "good", label: "Happy", icon: Smile, activeClass: "bg-[#2F6F62] text-white", inactiveClass: "bg-white text-[#2F6F62]" },
              { key: "okay", label: "Okay", icon: Meh, activeClass: "bg-[#C97A2B] text-white", inactiveClass: "bg-white text-[#C97A2B]" },
              { key: "low", label: "Not good", icon: Frown, activeClass: "bg-[#B23A3A] text-white", inactiveClass: "bg-white text-[#B23A3A]" },
            ].map(({ key, label, icon: Icon, activeClass, inactiveClass }) => (
              <button
                key={key}
                type="button"
                onClick={() => saveMoodSelection(key)}
                disabled={savingMood}
                className="flex flex-col items-center gap-3 rounded-[24px] border-2 border-[#E4DCC8] bg-white p-4 text-center transition hover:border-[#2F6F62] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className={[
                  "flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#D9D0C2] transition",
                  mood === key ? `border-[3px] ${activeClass}` : inactiveClass,
                ].join(" ")}>
                  <Icon className="h-10 w-10" aria-hidden="true" />
                </span>
                <span className="text-xl font-bold text-[#20261F]">{label}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
