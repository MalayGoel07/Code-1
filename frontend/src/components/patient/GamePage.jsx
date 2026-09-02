import { useEffect, useState } from "react";
import {Layers,Shapes,ListOrdered,Link2,Puzzle,Dice5,TreePine,Heart,} from "lucide-react";
import PatientNavigation from "./PatientNavigation";
import { api } from "../../api";

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
  const [personal, setPersonal] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/patient/activities")
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data?.activities) ? data.activities : [];
          setPersonal([...list].sort((a, b) => (a.activity_type === "family_tree" ? -1 : 0) - (b.activity_type === "family_tree" ? -1 : 0)));
        }
      })
      .catch(() => {
        /* Personalized activities are optional here; built-in games still work. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

        {personal.length > 0 && (
          <section className="mt-6">
            <h2 className="text-2xl font-bold text-[#20261F]">Your Activities</h2>
            <p className="mt-1 text-lg text-[#5B6459]">Made for you by your family.</p>
            <ul className="mt-5 list-none space-y-4 p-0">
              {personal.map((activity) => {
                const isFamilyTree = activity.activity_type === "family_tree";
                const Icon = isFamilyTree ? TreePine : Heart;
                return (
                  <li key={activity.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/patient/activities/${activity.id}`)}
                      className="flex w-full items-center gap-5 rounded-3xl border-2 border-[#2F6F62] bg-white p-5 text-left shadow-sm transition hover:bg-[#F0F5F1] active:scale-[0.99]"
                    >
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#E8F0E6]">
                        <Icon className="h-8 w-8 text-[#2F6F62]" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-2xl font-bold">
                          {activity.title || activity.activity_type_label || "Activity"}
                        </span>
                        <span className="mt-0.5 block text-base text-[#5B6459]">
                          {isFamilyTree ? "Learn about your family" : "A personalized activity for you"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

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
