import { useEffect, useState } from "react";
import {
  Gamepad2,
  MessageCircle,
  BookOpen,
  Smile,
  Meh,
  Frown,
  PhoneCall,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  Phone,
  Pill,
  Sprout,
} from "lucide-react";

import { api } from "../../api";
import PatientNavigation from "./PatientNavigation";

const PRIMARY_ACTIVITIES = [
  {
    icon: MessageCircle,
    label: "Talk",
    sub: "Talk with your companion.",
    chip: "#4E7D5B",
    iconColor: "#FFFFFF",
    accent: "#3D8361",
    path: "/elder-ai",
  },
  {
    icon: Gamepad2,
    label: "Game",
    sub: "Play a memory game.",
    chip: "#C9922B",
    iconColor: "#FFFFFF",
    accent: "#B98A2F",
    path: "/game",
  },
  {
    icon: BookOpen,
    label: "Story",
    sub: "Listen to a familiar story.",
    chip: "#D8E7F6",
    iconColor: "#3E6FA3",
    accent: "#3E6FA3",
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

      <header
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #FBF8F2 0%, #F7F4E6 55%, #EAF0DB 100%)" }}
      >
        <svg
          viewBox="0 0 560 230"
          preserveAspectRatio="xMaxYMax meet"
          className="pointer-events-none absolute bottom-0 right-0 hidden h-[230px] w-[58%] sm:block"
          aria-hidden="true"
        >
          <g stroke="#EFC25F" strokeWidth="5" strokeLinecap="round">
            <line x1="382" y1="26" x2="382" y2="8" />
            <line x1="337" y1="42" x2="322" y2="27" />
            <line x1="427" y1="42" x2="442" y2="27" />
            <line x1="322" y1="86" x2="303" y2="86" />
            <line x1="442" y1="86" x2="461" y2="86" />
          </g>
          <circle cx="382" cy="86" r="42" fill="#F5CB6B" />
          <ellipse cx="112" cy="42" rx="36" ry="13" fill="#FFFFFF" opacity="0.85" />
          <ellipse cx="146" cy="50" rx="26" ry="10" fill="#FFFFFF" opacity="0.7" />
          <ellipse cx="470" cy="30" rx="30" ry="11" fill="#FFFFFF" opacity="0.8" />
          <path d="M0 230 L0 168 Q150 108 310 162 T560 146 L560 230 Z" fill="#DCE8CB" />
          <path d="M0 230 L0 202 Q190 142 370 194 T560 184 L560 230 Z" fill="#C9DDB3" />
          <g>
            <rect x="512" y="152" width="11" height="58" rx="5" fill="#8B6B4A" />
            <circle cx="517" cy="128" r="40" fill="#6F9B6B" />
            <circle cx="493" cy="150" r="25" fill="#5F8A5F" />
            <circle cx="540" cy="152" r="23" fill="#7AA374" />
          </g>
          <g>
            <rect x="262" y="172" width="9" height="44" rx="4" fill="#8B6B4A" />
            <circle cx="266" cy="157" r="29" fill="#6F9B6B" />
            <circle cx="248" cy="172" r="18" fill="#5F8A5F" />
            <circle cx="284" cy="173" r="17" fill="#7AA374" />
          </g>
        </svg>

        <div className="relative mx-auto max-w-5xl px-5 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14">
          <h1 className="max-w-lg text-[44px] font-bold leading-[1.08] text-[#1B4A3A] sm:text-6xl">
            {getGreeting(hour)},
            <br />
            {userName}!
            <Sprout className="ml-3 inline h-9 w-9 text-[#4E7D5B] sm:h-12 sm:w-12" aria-hidden="true" />
          </h1>
          <p className="mt-4 text-xl text-[#6B7466]">We're happy to see you today.</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-16 sm:px-6">
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-[22px] bg-white p-5 shadow-[0_6px_24px_rgba(32,38,31,0.06)]">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E4F0E4] text-[#3D8361]">
              <Smile className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3D8361]">Mood</p>
              <p className="mt-1 text-[22px] font-bold leading-tight text-[#20261F]">{moodLabel}</p>
              <p className="mt-0.5 text-sm text-[#8A917F]">Tell us how you feel</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-[22px] bg-[#FBF3DE] p-5 shadow-[0_6px_24px_rgba(32,38,31,0.05)]">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F3E3BC] text-[#B98A2F]">
              <Bell className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B98A2F]">Today</p>
              <p className="mt-1 text-[22px] font-bold leading-tight text-[#20261F]">{reminderStatus}</p>
              <p className="mt-0.5 text-sm text-[#A08D5F]">{reminderDone || !todayReminder ? "You're all caught up!" : "Time to check in"}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-[22px] bg-[#EAF1F9] p-5 shadow-[0_6px_24px_rgba(32,38,31,0.05)]">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#D8E6F6] text-[#3B6FA0]">
              <Phone className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3B6FA0]">Support</p>
              <p className="mt-1 text-[22px] font-bold leading-tight text-[#20261F]">Ready</p>
              <p className="mt-0.5 text-sm text-[#7E93AC]">We're here when you need us.</p>
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-5">
          <section className="rounded-[28px] bg-white p-6 shadow-[0_6px_24px_rgba(32,38,31,0.06)] sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <div className="flex flex-1 items-start gap-5">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#EDE7F8] text-[#7A5CD0]">
                  <CalendarDays className="h-8 w-8" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#7A5CD0]">Today's reminder</p>
                  <p className="mt-2 text-[26px] font-bold leading-snug text-[#20261F] sm:text-3xl">
                    {reminderDone ? (todayReminder ? "Reminder marked as done" : "Medicine marked as done") : (todayReminder?.title || "Take your medicine")}
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-lg text-[#8A917F]">
                    <Clock className="h-5 w-5" aria-hidden="true" />
                    <span>{reminderDone ? "No pending reminder left for today." : (todayReminder?.time || "Due at 8:00 AM")}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 lg:border-l lg:border-[#EFECE2] lg:pl-10">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDE7F8] text-[#7A5CD0]">
                  <Pill className="h-6 w-6" aria-hidden="true" />
                </span>
                <button
                  type="button"
                  onClick={handleReminderComplete}
                  disabled={reminderDone || !todayReminder}
                  className={[
                    "flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-lg font-bold text-white transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A5CD0] focus-visible:ring-offset-2 disabled:cursor-not-allowed",
                    reminderDone || !todayReminder ? "bg-[#A99BCF]" : "bg-[#7A5CD0] hover:bg-[#6B4DC0]",
                  ].join(" ")}
                >
                  <span>{reminderDone ? "Done for now" : (!todayReminder ? "No reminder left" : "Mark as Done")}</span>
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>

          <button
            type="button"
            onClick={handleHelpCall}
            className="flex w-full items-center justify-center gap-4 rounded-[28px] bg-[#C0392B] px-6 py-6 text-left text-white shadow-[0_18px_30px_rgba(192,57,43,0.18)] transition hover:bg-[#A93226] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C0392B] focus-visible:ring-offset-2"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
              <PhoneCall className="h-7 w-7" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-2xl font-bold">Call for Help</span>
              <span className="block text-base text-white/80">Need support now?</span>
            </span>
          </button>
        </div>

        <section className="mt-6 rounded-[28px] bg-white p-6 shadow-[0_6px_24px_rgba(32,38,31,0.06)]" aria-labelledby="activities-heading">
          <h2 id="activities-heading" className="text-2xl font-bold text-[#20261F] sm:text-[28px]">What would you like to do?</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {PRIMARY_ACTIVITIES.map(({ icon: Icon, label, sub, chip, iconColor, accent, path }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(path)}
                className="relative flex h-full items-start gap-4 rounded-[22px] border border-[#EFECE2] bg-[#FBFAF5] p-5 pb-9 text-left transition hover:-translate-y-0.5 hover:border-[#D8D2C0] hover:shadow-md active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: chip, color: iconColor }}>
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xl font-bold" style={{ color: accent }}>{label}</span>
                  <span className="mt-1 block text-base leading-relaxed text-[#8A917F]">{sub}</span>
                </span>
                <ChevronRight className="absolute bottom-3 right-4 h-6 w-6 text-[#B7BCA9]" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-6 shadow-[0_6px_24px_rgba(32,38,31,0.06)]">
          <p className="text-2xl font-bold text-[#20261F]">How are you feeling today?</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              { key: "good", label: "Happy", icon: Smile, bg: "bg-[#E7F0E2] hover:bg-[#DDE9D6]", color: "text-[#3D8361]", ring: "ring-[#3D8361]" },
              { key: "okay", label: "Okay", icon: Meh, bg: "bg-[#FBF3DD] hover:bg-[#F6EBCC]", color: "text-[#B98A2F]", ring: "ring-[#B98A2F]" },
              { key: "low", label: "Not good", icon: Frown, bg: "bg-[#FBE9E7] hover:bg-[#F6DDDA]", color: "text-[#C0392B]", ring: "ring-[#C0392B]" },
            ].map(({ key, label, icon: Icon, bg, color, ring }) => (
              <button
                key={key}
                type="button"
                onClick={() => saveMoodSelection(key)}
                disabled={savingMood}
                aria-pressed={mood === key}
                className={[
                  "flex items-center justify-center gap-3 rounded-2xl px-4 py-5 text-xl font-bold transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
                  bg,
                  color,
                  mood === key ? `ring-2 ${ring} ring-offset-2` : "",
                ].join(" ")}
              >
                <Icon className="h-8 w-8" aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </section>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-[#E7EFE0] px-6 py-5">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#4E7D5B] shadow-sm">
              <Sprout className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-bold text-[#2E5B3E]">Take small steps, every day.</p>
              <p className="text-base text-[#7C8A72]">You're doing great!</p>
            </div>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2F6F62] text-white shadow-sm">
            <Heart className="h-6 w-6 fill-current" aria-hidden="true" />
          </span>
        </footer>
      </main>
    </div>
  );
}
