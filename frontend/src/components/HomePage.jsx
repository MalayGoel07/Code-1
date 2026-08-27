import { Gamepad2, MessageCircle, BookOpen, Mic, Smile, Meh, Frown, Settings, PhoneCall } from "lucide-react";
import { useState } from "react";

const PRIMARY_ACTIVITIES = [
  { icon: MessageCircle, label: "Talk to Someone", sub: "Voice chat", tint: "#2F6F62" },
  { icon: Gamepad2, label: "Play a Game", sub: "Memory & fun", tint: "#8A6D3B" },
  { icon: BookOpen, label: "Today's Story", sub: "5 minute listen", tint: "#2F6F62" },
];

function getGreeting(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function PatientHome() {
  const [mood, setMood] = useState(null);
  const hour = new Date().getHours();

  return (
    <div
      className="theme-page min-h-screen pb-28"
      style={{ background: "#FBF8F2", color: "#20261F", fontFamily: "Verdana, Tahoma, 'Segoe UI', system-ui, sans-serif",  }}>
      <header className="flex items-start justify-between px-6 pt-6 pb-4">
        <div>
          <p className="text-3xl font-bold">{getGreeting(hour)}, Kong</p>
          <p className="mt-1 text-xl" style={{ color: "#5B6459" }}>Thursday, 27 August &nbsp;·&nbsp; Morning</p>
        </div>
        <button aria-label="Settings" className="flex h-12 w-12 items-center justify-center rounded-full border-2" style={{ borderColor: "#C9C2B2", background: "#FFFFFF" }}>
          <Settings className="h-6 w-6" style={{ color: "#5B6459" }} />
        </button>
      </header>

      <div className="px-6">
        <button className="flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-2xl font-bold text-white shadow-md active:scale-95" style={{ background: "#B23A3A" }}>
          <PhoneCall className="h-7 w-7" />
          Call for Help
        </button>
      </div>

      <main className="mx-auto max-w-2xl px-6">
        <div className="mt-6 rounded-3xl p-6" style={{ background: "#F3E7D0", border: "3px solid #C97A2B" }}>
          <p className="text-lg font-bold" style={{ color: "#8A4E12" }}>Reminder</p>
          <p className="mt-2 text-2xl font-bold">Take your morning medicine</p>
          <p className="mt-1 text-lg" style={{ color: "#6B4A1E" }}>2 left for today</p>
          <button className="mt-4 w-full rounded-xl py-4 text-xl font-bold text-white active:scale-95" style={{ background: "#C97A2B" }}>Mark as Done</button>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {PRIMARY_ACTIVITIES.map(({ icon: Icon, label, sub, tint }) => (
            <button key={label} className="flex items-center gap-5 rounded-2xl p-5 text-left shadow-sm active:scale-95" style={{ background: "#FFFFFF", border: "2px solid #E4DCC8" }}>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ background: tint }}>
                <Icon className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{label}</p>
                <p className="text-lg" style={{ color: "#5B6459" }}>{sub}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-3xl p-6 text-center" style={{ background: "#EFEEE6" }}>
          <p className="text-xl font-bold">How are you feeling right now?</p>
          <div className="mt-5 flex justify-center gap-6">
            <button onClick={() => setMood("good")} aria-label="Good" className="flex h-20 w-20 items-center justify-center rounded-full transition active:scale-95" style={{ background: mood === "good" ? "#2F6F62" : "#FFFFFF", border: "2px solid #C9C2B2",  }}>
              <Smile className="h-10 w-10" style={{ color: mood === "good" ? "#FFFFFF" : "#2F6F62" }} />
            </button>
            <button onClick={() => setMood("okay")} aria-label="Okay" className="flex h-20 w-20 items-center justify-center rounded-full transition active:scale-95" style={{ background: mood === "okay" ? "#C97A2B" : "#FFFFFF", border: "2px solid #C9C2B2", }} >
              <Meh className="h-10 w-10" style={{ color: mood === "okay" ? "#FFFFFF" : "#C97A2B" }} />
            </button>
            <button onClick={() => setMood("low")} aria-label="Not good" className="flex h-20 w-20 items-center justify-center rounded-full transition active:scale-95" style={{ background: mood === "low" ? "#B23A3A" : "#FFFFFF", border: "2px solid #C9C2B2", }} >
              <Frown className="h-10 w-10" style={{ color: mood === "low" ? "#FFFFFF" : "#B23A3A" }} />
            </button>
          </div>
        </div>
      </main>

      <button aria-label="Start voice assistant" className="fixed bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center justify-center gap-1 rounded-full shadow-lg active:scale-95" style={{ background: "#2F6F62", width: "96px", height: "96px" }}  >
        <Mic className="h-8 w-8 text-white" />
        <span className="text-xs font-bold text-white">Talk</span>
      </button>
    </div>
  );
}