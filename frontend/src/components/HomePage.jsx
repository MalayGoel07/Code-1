import { useState } from "react";
import {
  Home,
  Gamepad2,
  MessageCircle,
  BookOpen,
  Bell,
  UserRound,
  Mic,
  Smile,
  Meh,
  Frown,
  PhoneCall,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Home", path: "/homepage", icon: Home },
  { id: "games", label: "Games", path: "/game", icon: Gamepad2 },
  { id: "talk", label: "Talk", path: "/elder-ai", icon: MessageCircle },
  { id: "stories", label: "Stories", path: "/story", icon: BookOpen },
  { id: "reminders", label: "Reminders", path: "/reminder", icon: Bell },
  { id: "profile", label: "Profile", path: "/profile", icon: UserRound },
];

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

const VOICE_COPY = {
  idle: { label: "Tap to speak", support: "" },
  listening: { label: "Listening...", support: "Tell me what you would like to do." },
  processing: { label: "Understanding...", support: "" },
  error: { label: "I didn't understand that.", support: "Please try again." },
};

function getGreeting(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function PatientHome({ onNavigate }) {
  const navigate = onNavigate ?? ((nextPath) => {
    window.location.href = nextPath;
  });

  const [mood, setMood] = useState(null);
  const [reminderDone, setReminderDone] = useState(false);
  const [voiceState, setVoiceState] = useState("idle");
  const hour = new Date().getHours();
  const voiceCopy = VOICE_COPY[voiceState];

  const handleVoicePress = () => {
    if (voiceState === "idle") {
      setVoiceState("listening");
      return;
    }
    if (voiceState === "listening") {
      setVoiceState("processing");
      return;
    }
    if (voiceState === "processing") {
      setVoiceState("error");
      return;
    }
    setVoiceState("idle");
  };

  return (
    <div
      className="theme-page min-h-screen pb-36"
      style={{
        background: "#FBF8F2",
        color: "#20261F",
        fontFamily: "Verdana, Tahoma, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <nav
        className="border-b px-3 py-3 sm:px-6"
        style={{ borderColor: "#E4DCC8", background: "#EFEEE6" }}
        aria-label="Patient pages"
      >
        <ul className="mx-auto grid max-w-3xl list-none grid-cols-3 gap-2 p-0 sm:grid-cols-6">
          {NAV_ITEMS.map(({ id, label, path, icon: Icon }) => {
            const isHome = id === "home";
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => navigate(path)}
                  aria-current={isHome ? "page" : undefined}
                  className="flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-3 text-base active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
                  style={
                    isHome
                      ? {
                          background: "#F3E7D0",
                          border: "3px solid #2F6F62",
                          color: "#20261F",
                          fontWeight: 700,
                        }
                      : {
                          background: "#FFFFFF",
                          border: "2px solid #E4DCC8",
                          color: "#5B6459",
                          fontWeight: 600,
                        }
                  }
                >
                  <Icon className="h-7 w-7" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <header className="mx-auto max-w-2xl px-6 pt-6 pb-2">
        <h1 className="text-3xl font-bold sm:text-4xl">
          {getGreeting(hour)}, Kong!
        </h1>
        <p className="mt-2 text-xl" style={{ color: "#5B6459" }}>
          What would you like to do today?
        </p>
      </header>

      <div className="mx-auto max-w-2xl px-6">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-2xl font-bold text-white shadow-md active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B23A3A] focus-visible:ring-offset-2"
          style={{ background: "#B23A3A" }}
        >
          <PhoneCall className="h-7 w-7" aria-hidden="true" />
          Call for Help
        </button>
      </div>

      <main className="mx-auto max-w-2xl px-6">
        <section className="mt-6 rounded-3xl p-6" style={{ background: "#F3E7D0", border: "3px solid #C97A2B" }}>
          <p className="text-lg font-bold" style={{ color: "#8A4E12" }}>
            Today's reminder
          </p>
          <p className="mt-2 text-2xl font-bold">
            {reminderDone ? "Medicine marked as done" : "Take your medicine"}
          </p>
          <p className="mt-1 text-lg" style={{ color: "#6B4A1E" }}>
            Due at 8:00 AM
          </p>
          <button
            type="button"
            onClick={() => setReminderDone(true)}
            disabled={reminderDone}
            className="mt-4 w-full rounded-xl py-4 text-xl font-bold text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C97A2B] focus-visible:ring-offset-2 disabled:opacity-70"
            style={{ background: reminderDone ? "#5B6459" : "#C97A2B" }}
          >
            {reminderDone ? "Done for now" : "Mark as Done"}
          </button>
        </section>

        <section className="mt-8" aria-labelledby="activities-heading">
          <h2 id="activities-heading" className="text-2xl font-bold">
            Activities
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {PRIMARY_ACTIVITIES.map(({ icon: Icon, label, sub, tint, path }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(path)}
                className="flex items-center gap-5 rounded-2xl p-5 text-left shadow-sm active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
                style={{ background: "#FFFFFF", border: "2px solid #E4DCC8" }}
              >
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
                  style={{ background: tint }}
                >
                  <Icon className="h-8 w-8 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{label}</p>
                  <p className="text-lg" style={{ color: "#5B6459" }}>
                    {sub}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl p-6 text-center" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8" }}>
          <p className="text-xl font-bold">How are you feeling today?</p>
          <div className="mt-5 flex justify-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={() => setMood("good")}
              className="flex flex-col items-center gap-2 rounded-2xl p-2 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
            >
              <span
                className="flex h-20 w-20 items-center justify-center rounded-full"
                style={{
                  background: mood === "good" ? "#2F6F62" : "#FFFFFF",
                  border: mood === "good" ? "3px solid #20261F" : "2px solid #C9C2B2",
                }}
              >
                <Smile className="h-10 w-10" style={{ color: mood === "good" ? "#FFFFFF" : "#2F6F62" }} aria-hidden="true" />
              </span>
              <span className="text-lg font-bold">Good</span>
            </button>
            <button
              type="button"
              onClick={() => setMood("okay")}
              className="flex flex-col items-center gap-2 rounded-2xl p-2 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C97A2B] focus-visible:ring-offset-2"
            >
              <span
                className="flex h-20 w-20 items-center justify-center rounded-full"
                style={{
                  background: mood === "okay" ? "#C97A2B" : "#FFFFFF",
                  border: mood === "okay" ? "3px solid #20261F" : "2px solid #C9C2B2",
                }}
              >
                <Meh className="h-10 w-10" style={{ color: mood === "okay" ? "#FFFFFF" : "#C97A2B" }} aria-hidden="true" />
              </span>
              <span className="text-lg font-bold">Okay</span>
            </button>
            <button
              type="button"
              onClick={() => setMood("low")}
              className="flex flex-col items-center gap-2 rounded-2xl p-2 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B23A3A] focus-visible:ring-offset-2"
            >
              <span
                className="flex h-20 w-20 items-center justify-center rounded-full"
                style={{
                  background: mood === "low" ? "#B23A3A" : "#FFFFFF",
                  border: mood === "low" ? "3px solid #20261F" : "2px solid #C9C2B2",
                }}
              >
                <Frown className="h-10 w-10" style={{ color: mood === "low" ? "#FFFFFF" : "#B23A3A" }} aria-hidden="true" />
              </span>
              <span className="text-lg font-bold">Not good</span>
            </button>
          </div>
        </section>
      </main>

      <div className="fixed bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
        <button
          type="button"
          onClick={handleVoicePress}
          aria-label={
            voiceState === "idle"
              ? "Tap to speak. Voice commands are not connected yet."
              : voiceCopy.label
          }
          aria-pressed={voiceState !== "idle"}
          className="flex items-center justify-center rounded-full border-4 shadow-lg active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
          style={{
            width: "76px",
            height: "76px",
            background: voiceState === "listening" ? "#F3E7D0" : "#2F6F62",
            borderColor: voiceState === "listening" ? "#C97A2B" : "#24594F",
            color: voiceState === "listening" ? "#2F6F62" : "#FFFFFF",
          }}
        >
          <Mic
            className={`h-9 w-9 ${
              voiceState === "listening" ? "motion-safe:animate-pulse motion-reduce:animate-none" : ""
            }`}
            aria-hidden="true"
          />
        </button>
        <p className="mt-2 text-center text-base font-bold" aria-live="polite">
          {voiceCopy.label}
        </p>
        {voiceCopy.support ? (
          <p className="max-w-[16rem] text-center text-sm font-semibold" style={{ color: "#5B6459" }}>
            {voiceCopy.support}
          </p>
        ) : null}
        {voiceState === "error" ? (
          <button
            type="button"
            onClick={() => setVoiceState("idle")}
            className="mt-2 rounded-full px-5 py-2 text-base font-bold text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
            style={{ background: "#2F6F62" }}
          >
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}
