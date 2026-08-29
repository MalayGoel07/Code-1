import { useState } from "react";
import {Layers,Shapes,ListOrdered,Link2,Puzzle,Dice5,} from "lucide-react";
import PatientNavigation from "./PatientNavigation";

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

export default function GamePage({ onNavigate }) {
  const navigate =
    onNavigate ??
    ((nextPath) => {
      window.location.href = nextPath;
    });

  const [comingSoonId, setComingSoonId] = useState(null);

  return (
    <div className="min-h-screen bg-[#FBF8F2] text-[#20261F] font-sans">
      <PatientNavigation onNavigate={navigate} activePage="games" />

      <main className="mx-auto mt-8 max-w-6xl px-6 pb-12">
        <div className="mb-8 rounded-3xl border border-[#E4DCC8] bg-[#F7F3EC] px-6 py-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2F6F62]"> Activities
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Games</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-[#5B6459]">Choose an activity to exercise your mind.
          </p>
        </div>

        <ul className="mt-10 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game) => {
            const Icon = game.icon;
            const isComingSoon = comingSoonId === game.id;

            return (
              <li key={game.id} className="flex">
                <article className="flex h-full w-full flex-col items-center rounded-3xl border-2 border-[#E4DCC8] bg-[#EFEEE6] p-6 text-center shadow-sm">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#E4DCC8] bg-[#F3E7D0]">
                    {game.image ? (
                      <img src={game.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Icon className="h-12 w-12 text-[#2F6F62]" aria-hidden="true" />
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <p className="rounded-full bg-[#F3E7D0] px-3 py-1 text-base font-bold text-[#8A4E12]">{game.category}</p>
                    <p className="rounded-full border-2 border-[#C9C2B2] bg-white px-3 py-1 text-base font-bold text-[#2F6F62]">{game.difficultyLabel}</p>
                  </div>

                  <h2 className="mt-4 text-2xl font-bold">{game.name}</h2>
                  <p className="mt-2 flex-1 text-lg leading-snug text-[#5B6459]">{game.description}</p>
                  {isComingSoon ? (
                    <p id={`${game.id}-coming-soon`} className="mt-6 w-full rounded-full border-2 border-[#C9C2B2] bg-white py-4 text-xl font-bold text-[#5B6459]" role="status"> Coming soon</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (game.id === "find-the-pattern") {
                          navigate("/pattern-game");
                          return;
                        }
                        setComingSoonId(game.id);
                      }}
                      className="mt-6 w-full rounded-full bg-[#2F6F62] py-4 text-xl font-bold text-white shadow-sm active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
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
