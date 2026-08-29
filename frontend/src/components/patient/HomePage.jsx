import { useState } from "react";
import {
  Gamepad2,
  MessageCircle,
  BookOpen,
  Mic,
  Smile,
  Meh,
  Frown,
  PhoneCall,
} from "lucide-react";

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

const VOICE_COPY = {
  idle: {
    label: "Tap to speak",
    support: "",
  },
  listening: {
    label: "Listening...",
    support: "Tell me what you would like to do.",
  },
  processing: {
    label: "Understanding...",
    support: "",
  },
  error: {
    label: "I didn't understand that.",
    support: "Please try again.",
  },
};

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
  const [reminderDone, setReminderDone] = useState(false);
  const [voiceState, setVoiceState] = useState("idle");

  const hour = new Date().getHours();
  const userName =
    typeof window !== "undefined"
      ? window.localStorage.getItem("full_name") || "there"
      : "there";
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
    <div className="min-h-screen bg-[#FBF8F2] text-[#20261F] font-sans">
      <PatientNavigation onNavigate={navigate} onLogout={onLogout} activePage="home"/>
      <header className="mx-auto max-w-3xl px-6 pb-4 pt-8">
        <div className="rounded-3xl border border-[#E4DCC8] bg-[#F7F3EC] p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2F6F62]"> Welcome
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{getGreeting(hour)}, {userName}!</h1>
          <p className="mt-2 text-lg text-[#5B6459]">What would you like to do today?
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6">
        <button type="button" className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#B23A3A] py-5 text-2xl font-bold text-white shadow-md active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B23A3A] focus-visible:ring-offset-2">
          <PhoneCall className="h-7 w-7" aria-hidden="true" />
          Call for Help
        </button>
      </div>

      <main className="mx-auto max-w-2xl px-6">
        <section className="mt-6 rounded-3xl border-[3px] border-[#C97A2B] bg-[#F3E7D0] p-6">
          <p className="text-lg font-bold text-[#8A4E12]">Today's reminder</p>
          <p className="mt-2 text-2xl font-bold">{reminderDone ? "Medicine marked as done" : "Take your medicine"}</p>
          <p className="mt-1 text-lg text-[#6B4A1E]">Due at 8:00 AM</p>
          <button type="button" onClick={() => setReminderDone(true)} disabled={reminderDone} className={[ "mt-4 w-full rounded-xl py-4 text-xl font-bold text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C97A2B] focus-visible:ring-offset-2 disabled:opacity-70", reminderDone ? "bg-[#5B6459]" : "bg-[#C97A2B]", ].join(" ")}>{reminderDone ? "Done for now" : "Mark as Done"}</button>
        </section>
        <section className="mt-8" aria-labelledby="activities-heading">
          <h2 id="activities-heading" className="text-2xl font-bold">Activities</h2>
          <div className="mt-4 flex flex-col gap-4">
            {PRIMARY_ACTIVITIES.map(({ icon: Icon, label, sub, tint, path }) => (
              <button key={label} type="button" onClick={() => navigate(path)} className="flex items-center gap-5 rounded-2xl border-2 border-[#E4DCC8] bg-white p-5 text-left shadow-sm active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ background: tint }}>
                  <Icon className="h-8 w-8 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{label}</p>
                  <p className="text-lg text-[#5B6459]">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border-2 border-[#E4DCC8] bg-[#EFEEE6] p-6 text-center">
          <p className="text-xl font-bold">How are you feeling today?</p>
          <div className="mt-5 flex justify-center gap-4 sm:gap-6">
            <button type="button" onClick={() => setMood("good")} className="flex flex-col items-center gap-2 rounded-2xl p-2 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2">
              <span className={[ "flex h-20 w-20 items-center justify-center rounded-full border", mood === "good" ? "border-[3px] border-[#20261F] bg-[#2F6F62]" : "border-[#C9C2B2] bg-white", ].join(" ")}>
                <Smile className={[ "h-10 w-10", mood === "good" ? "text-white" : "text-[#2F6F62]", ].join(" ")} aria-hidden="true"/>
              </span>
              <span className="text-lg font-bold">Good</span>
            </button>

            <button type="button" onClick={() => setMood("okay")} className="flex flex-col items-center gap-2 rounded-2xl p-2 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C97A2B] focus-visible:ring-offset-2">
              <span className={[ "flex h-20 w-20 items-center justify-center rounded-full border", mood === "okay" ? "border-[3px] border-[#20261F] bg-[#C97A2B]" : "border-[#C9C2B2] bg-white", ].join(" ")}>
                <Meh className={[ "h-10 w-10", mood === "okay" ? "text-white" : "text-[#C97A2B]", ].join(" ")} aria-hidden="true" />
              </span>
              <span className="text-lg font-bold">Okay</span>
            </button>

            <button type="button" onClick={() => setMood("low")} className="flex flex-col items-center gap-2 rounded-2xl p-2 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B23A3A] focus-visible:ring-offset-2">
              <span className={[ "flex h-20 w-20 items-center justify-center rounded-full border", mood === "low" ? "border-[3px] border-[#20261F] bg-[#B23A3A]" : "border-[#C9C2B2] bg-white", ].join(" ")}>
                <Frown className={[ "h-10 w-10", mood === "low" ? "text-white" : "text-[#B23A3A]", ].join(" ")} aria-hidden="true"/>
              </span>
              <span className="text-lg font-bold">Not good</span>
            </button>
          </div>
        </section>
      </main>

      <div className="fixed bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
        <button type="button" onClick={handleVoicePress} aria-label={ voiceState === "idle"  ? "Tap to speak. Voice commands are not connected yet."  : voiceCopy.label } aria-pressed={voiceState !== "idle"} className={[ "flex h-[76px] w-[76px] items-center justify-center rounded-full border-4 shadow-lg active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2", voiceState === "listening"  ? "border-[#C97A2B] bg-[#F3E7D0] text-[#2F6F62]"  : "border-[#24594F] bg-[#2F6F62] text-white", ].join(" ")}>
          <Mic className={[ "h-9 w-9", voiceState === "listening" ? "motion-safe:animate-pulse motion-reduce:animate-none" : "", ].join(" ")} aria-hidden="true"/>
        </button>

        <p className="mt-2 text-center text-base font-bold" aria-live="polite">{voiceCopy.label}</p>{voiceCopy.support ? (<p className="max-w-[16rem] text-center text-sm font-semibold text-[#5B6459]">{voiceCopy.support}</p>) : null}{voiceState === "error" ? (<button type="button" onClick={() => setVoiceState("idle")} className="mt-2 rounded-full bg-[#2F6F62] px-5 py-2 text-base font-bold text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2" >Try again</button>) : null}
      </div>
    </div>
  );
}
