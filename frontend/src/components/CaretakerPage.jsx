import { Gamepad2, MessageCircle, Bell, BookOpen, Mic, Wifi, WifiOff, Smile, Meh, Frown } from "lucide-react";
import { useState } from "react";

const ACTIVITIES = [
  { icon: Gamepad2, label: "Play a Game", sub: "Memory & attention", color: "bg-blue-600" },
  { icon: MessageCircle, label: "Talk to Companion", sub: "Voice assistant", color: "bg-cyan-600" },
  { icon: Bell, label: "Reminders", sub: "2 medicines left today", color: "bg-amber-500" },
  { icon: BookOpen, label: "Today's Story", sub: "5 min listen", color: "bg-indigo-500" },
];

const ACTIVITIES_DONE = 3;
const ACTIVITIES_TOTAL = 5;

export default function CaretakerPage() {
  const [mood, setMood] = useState(null);
  const isOnline = true;

  return (
    <div className="theme-page min-h-screen pb-28" style={{ background: "#FBF8F2", color: "#20261F", fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap');`}</style>
      {/* Top bar */}
      <header className="flex items-center justify-between border-b px-6 py-4 backdrop-blur" style={{ borderColor: "#E4DCC8", background: "rgba(255,255,255,0.9)" }}>
        <div>
          <p className="text-xl font-semibold tracking-tight">Good morning, Kong</p>
          <p className="mt-1 text-sm text-slate-500">Thursday, 27 August</p>
        </div>
        <div className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs" style={{ border: "2px solid #C9C2B2", background: "#FFFFFF", color: "#5B6459" }}>
          {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          {isOnline ? "Online" : "Offline"}
        </div>
      </header>

      {/* Mood check-in */}
      <main className="mx-auto max-w-3xl px-6">
      <div className="mt-8 rounded-3xl p-5" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8" }}>
        <p className="mb-4 text-center text-lg font-medium">How are you feeling today?</p>
        <div className="flex justify-center gap-6">
          <button
            onClick={() => setMood("good")}
            className={`rounded-full p-4 transition ${
              mood === "good" ? "text-white" : "bg-white hover:bg-green-50"
            }`}
          >
            <Smile className="h-8 w-8" />
          </button>
          <button
            onClick={() => setMood("okay")}
            className={`rounded-full p-4 transition ${mood === "okay" ? "text-white" : "bg-white hover:bg-orange-50"}`}
            style={{ background: mood === "okay" ? "#C97A2B" : undefined }}
          >
            <Meh className="h-8 w-8" />
          </button>
          <button
            onClick={() => setMood("low")}
            className={`rounded-full p-4 transition ${mood === "low" ? "text-white" : "bg-white hover:bg-red-50"}`}
            style={{ background: mood === "low" ? "#B23A3A" : undefined }}
          >
            <Frown className="h-8 w-8" />
          </button>
        </div>
      </div>

      {/* Progress ring */}
      <div className="mt-6 flex items-center gap-5 rounded-3xl p-5" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8" }}>
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4" style={{ borderColor: "#2F6F62" }}>
          <span className="text-lg font-semibold text-slate-800">
            {ACTIVITIES_DONE}/{ACTIVITIES_TOTAL}
          </span>
        </div>
        <div>
          <p className="text-lg font-medium">Today's Activities</p>
          <p className="text-slate-500">Keep going, you're doing great</p>
        </div>
      </div>

      {/* Activity tiles */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ACTIVITIES.map(({ icon: Icon, label, sub, color }) => (
          <button
            key={label}
            className="flex flex-col items-center gap-3 rounded-2xl border bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
            style={{ borderColor: "#E4DCC8" }}
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${color}`}>
              <Icon className="h-7 w-7 text-white" />
            </div>
            <p className="text-lg font-medium">{label}</p>
            <p className="text-sm text-slate-500">{sub}</p>
          </button>
        ))}
      </div>
      </main>

      {/* Floating voice assist button */}
      <button aria-label="Start voice assistant" className="fixed bottom-8 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full shadow-lg transition hover:opacity-90 active:scale-95" style={{ background: "#2F6F62", boxShadow: "0 10px 24px rgba(47,111,98,0.25)" }}>
        <Mic className="h-7 w-7 text-white" />
      </button>
    </div>
  );
}