import { useState } from "react";
import {
  ArrowLeft,
  Mic,
  Layers,
  Shapes,
  ListOrdered,
  Link2,
  Puzzle,
  Dice5,
} from "lucide-react";

const GAMES = [
  {
    id: "memory-match",
    name: "Memory Match",
    description: "Match the same pictures to exercise your memory.",
    category: "Memory",
    icon: Layers,
    image: null,
    difficultyLabel: "Easy",
  },
  {
    id: "find-the-pattern",
    name: "Find the Pattern",
    description: "Look at the pattern and choose what comes next.",
    category: "Attention",
    icon: Shapes,
    image: null,
    difficultyLabel: "Easy",
  },
  {
    id: "daily-routine",
    name: "Daily Routine",
    description: "Put familiar daily activities in the correct order.",
    category: "Daily Routine",
    icon: ListOrdered,
    image: null,
    difficultyLabel: "Easy",
  },
  {
    id: "object-match",
    name: "Object Match",
    description: "Find the two pictures that belong together.",
    category: "Recognition",
    icon: Link2,
    image: null,
    difficultyLabel: "Easy",
  },
  {
    id: "puzzle",
    name: "Puzzle",
    description: "Put the pieces together to complete the picture.",
    category: "Attention",
    icon: Puzzle,
    image: "/puzzle.png",
    difficultyLabel: "Easy",
  },
  {
    id: "ludo",
    name: "Ludo",
    description: "Play a simple and familiar board game.",
    category: "Attention",
    icon: Dice5,
    image: "/ludo.png",
    difficultyLabel: "Easy",
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
  not_understood: {
    label: "I didn't understand that.",
    support: "Please try again.",
  },
};

export default function GamePage({ onNavigate }) {
  const navigate = onNavigate ?? ((nextPath) => {
    window.location.href = nextPath;
  });

  const [voiceState, setVoiceState] = useState("idle");
  const [comingSoonId, setComingSoonId] = useState(null);

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
      setVoiceState("not_understood");
      return;
    }
    if (voiceState === "not_understood") {
      setVoiceState("idle");
    }
  };

  return (
    <div
      className="theme-page min-h-screen pb-16"
      style={{
        background: "#FBF8F2",
        color: "#20261F",
        fontFamily: "Verdana, Tahoma, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <header className="px-6 pt-6">
        <button
          type="button"
          onClick={() => navigate("/homepage")}
          className="inline-flex items-center gap-2 rounded-full border-2 px-5 py-3 text-lg font-bold active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
          style={{
            borderColor: "#C9C2B2",
            background: "#FFFFFF",
            color: "#20261F",
          }}
        >
          <ArrowLeft className="h-6 w-6" aria-hidden="true" />
          Back
        </button>
      </header>

      <div className="mt-8 flex flex-col items-center px-6">
        <button
          type="button"
          onClick={handleVoicePress}
          aria-label={
            voiceState === "idle"
              ? "Tap to speak. Voice commands are not connected yet."
              : voiceCopy.label
          }
          aria-pressed={voiceState !== "idle"}
          className="flex items-center justify-center rounded-full border-4 shadow-md active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
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
              voiceState === "listening"
                ? "motion-safe:animate-pulse motion-reduce:animate-none"
                : ""
            }`}
            aria-hidden="true"
          />
        </button>

        <p className="mt-3 text-center text-lg font-bold" aria-live="polite">
          {voiceCopy.label}
        </p>
        {voiceCopy.support ? (
          <p className="mt-1 max-w-sm text-center text-base" style={{ color: "#5B6459" }}>
            {voiceCopy.support}
          </p>
        ) : null}

        {voiceState === "not_understood" ? (
          <button
            type="button"
            onClick={() => setVoiceState("idle")}
            className="mt-4 rounded-full px-6 py-3 text-lg font-bold text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
            style={{ background: "#2F6F62" }}
          >
            Try Again
          </button>
        ) : null}
      </div>

      <main className="mx-auto mt-10 max-w-6xl px-6">
        <h1 className="text-center text-4xl font-bold sm:text-5xl">Games</h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-xl" style={{ color: "#5B6459" }}>
          Choose an activity to exercise your mind.
        </p>

        <ul className="mt-10 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game) => {
            const Icon = game.icon;
            const isComingSoon = comingSoonId === game.id;

            return (
              <li key={game.id} className="flex">
                <article
                  className="flex h-full w-full flex-col items-center rounded-3xl p-6 text-center shadow-sm"
                  style={{ background: "#EFEEE6", border: "2px solid #E4DCC8" }}
                >
                  <div
                    className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full"
                    style={{ background: "#F3E7D0", border: "3px solid #E4DCC8" }}
                  >
                    {game.image ? (
                      <img
                        src={game.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Icon className="h-12 w-12" style={{ color: "#2F6F62" }} aria-hidden="true" />
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <p
                      className="rounded-full px-3 py-1 text-base font-bold"
                      style={{ background: "#F3E7D0", color: "#8A4E12" }}
                    >
                      {game.category}
                    </p>
                    <p
                      className="rounded-full px-3 py-1 text-base font-bold"
                      style={{ background: "#FFFFFF", color: "#2F6F62", border: "2px solid #C9C2B2" }}
                    >
                      {game.difficultyLabel}
                    </p>
                  </div>

                  <h2 className="mt-4 text-2xl font-bold">{game.name}</h2>
                  <p className="mt-2 flex-1 text-lg leading-snug" style={{ color: "#5B6459" }}>
                    {game.description}
                  </p>

                  {isComingSoon ? (
                    <p
                      id={`${game.id}-coming-soon`}
                      className="mt-6 w-full rounded-full py-4 text-xl font-bold"
                      style={{
                        background: "#FFFFFF",
                        color: "#5B6459",
                        border: "2px solid #C9C2B2",
                      }}
                      role="status"
                    >
                      Coming soon
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setComingSoonId(game.id)}
                      className="mt-6 w-full rounded-full py-4 text-xl font-bold text-white shadow-sm active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
                      style={{ background: "#2F6F62" }}
                    >
                      Play
                    </button>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
