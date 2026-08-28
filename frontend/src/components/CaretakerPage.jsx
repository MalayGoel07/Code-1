import {
  Heart,
  FileText,
  Bell,
  Bot,
  User,
  Settings,
  ArrowRight,
  Activity,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Elder Care Report",
    text: "View activity, engagement, and care insights.",
    path: "/caretaker/report",
  },
  {
    icon: Bell,
    title: "Reminders",
    text: "Create and manage daily reminders for your elder.",
    path: "/caretaker/reminders",
  },
  {
    icon: Bot,
    title: "AI Helpbot",
    text: "Get guidance and support for caregiving.",
    path: "/caretaker/help",
  },
  {
    icon: User,
    title: "Profile",
    text: "Manage your caretaker account and details.",
    path: "/caretaker/profile",
  },
  {
    icon: Settings,
    title: "Settings",
    text: "Customize your preferences and notifications.",
    path: "/caretaker/settings",
  },
];

export default function CaretakerPage({ onNavigate }) {
  return (
    <main className="min-h-screen bg-[#F6F4EE] text-[#303735]">

      {/* HEADER */}
      <header className="border-b border-[#DED9CD] bg-[#FBFAF6]">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F7D73] shadow-sm">
              <Heart className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="text-lg font-semibold text-[#303735]">
                CODE<span className="text-[#4F7D73]">-1</span>
              </p>

              <p className="text-xs text-[#7A817D]">
                Caregiver dashboard
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate?.("/")}
            className="rounded-full border border-[#D5CFBF] bg-[#FBFAF6] px-5 py-2 text-sm font-medium text-[#4F7D73] transition hover:border-[#4F7D73] hover:bg-[#EDE9DA]"
          >
            Landing page
          </button>

        </nav>
      </header>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">

        {/* WELCOME CARD */}
        <div className="rounded-3xl border border-[#DDD7C7] bg-gradient-to-br from-[#F2EFE5] to-[#E7E2D3] p-8 shadow-sm sm:p-10">

          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-[#4F7D73]" />

            <span className="text-sm font-medium uppercase tracking-widest text-[#4F7D73]">
              Caregiver space
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-semibold text-[#303735] sm:text-5xl">
            Welcome back.
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#64706C]">
            Stay connected with your elder's daily activities, routines,
            and overall care.
          </p>

        </div>

        {/* CARE TOOLS */}
        <div className="mt-12">

          <p className="text-sm font-medium uppercase tracking-widest text-[#4F7D73]">
            Care tools
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-[#303735]">
            Everything you need in one place.
          </h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {features.map(({ icon: Icon, title, text, path }) => (
              <button
                key={title}
                onClick={() => onNavigate?.(path)}
                className="group rounded-2xl border border-[#DED9CD] bg-[#FBFAF6] p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#A9BFB5] hover:shadow-md"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8E6DC]">
                    <Icon className="h-6 w-6 text-[#4F7D73]" />
                  </div>

                  <ArrowRight className="h-5 w-5 text-[#4F7D73] opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />

                </div>

                <h3 className="mt-6 text-lg font-semibold text-[#303735]">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-[#7A817D]">
                  {text}
                </p>

              </button>
            ))}

          </div>

        </div>

      </section>

    </main>
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