import { useEffect, useState } from "react";
import { ArrowLeft, TreePine, Users, Home, Armchair, Sunrise, NotebookPen, Heart } from "lucide-react";

import { api } from "../../api";
import PatientNavigation from "./PatientNavigation";

/* Family Tree appears first, as the flagship personalized activity. */
const TYPE_META = {
  family_tree: { icon: TreePine, blurb: "Learn about your family", tint: "bg-[#FDE8E6]" },
  family_memory: { icon: Users, blurb: "Remember familiar people", tint: "bg-[#E8F0E6]" },
  places: { icon: Home, blurb: "Recognize familiar places", tint: "bg-[#E6F0FA]" },
  objects: { icon: Armchair, blurb: "Name everyday objects", tint: "bg-[#FDF0E6]" },
  routine: { icon: Sunrise, blurb: "Put your day in the right order", tint: "bg-[#F0E8FA]" },
  personal_info: { icon: NotebookPen, blurb: "Remember your own details", tint: "bg-[#F0F5E6]" },
};

const fallbackMeta = { icon: Heart, blurb: "A personalized activity for you", tint: "bg-[#E8F0E6]" };

export default function PatientActivities({ onNavigate }) {
  const navigate =
    onNavigate ??
    ((nextPath) => {
      window.history.pushState({}, "", nextPath);
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/patient/activities")
      .then((data) => {
        if (!cancelled) setActivities(Array.isArray(data?.activities) ? data.activities : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load your activities.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = [...activities].sort((a, b) => {
    const rank = (t) => (t === "family_tree" ? 0 : 1);
    return rank(a.activity_type) - rank(b.activity_type);
  });

  return (
    <div className="min-h-screen bg-[#FBF8F2] text-[#20261F] font-sans">
      <PatientNavigation onNavigate={navigate} activePage="activities" />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/homepage")}
          className="flex items-center gap-2 rounded-full border-2 border-[#E4DCC8] bg-white px-4 py-2 text-lg font-semibold text-[#5B6459] hover:bg-[#F0F5F1]"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Home
        </button>

        <div className="mt-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">Your Activities</h1>
          <p className="mx-auto mt-3 max-w-md text-xl text-[#5B6459]">
            Made for you by your family.
          </p>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-[#FDE2E2] bg-[#FEF6F6] p-4 text-center text-lg text-[#B23A3A]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-12 text-center text-xl font-semibold text-[#5B6459]">
            Loading your activities...
          </div>
        ) : sorted.length === 0 ? (
          <div className="mt-10 rounded-3xl border-2 border-[#E4DCC8] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E8F0E6]">
              <Heart className="h-10 w-10 text-[#2F6F62]" />
            </div>
            <p className="mt-6 text-2xl font-bold">No activities yet</p>
            <p className="mt-3 text-lg text-[#5B6459]">
              When your caretaker creates activities for you, they will appear here.
            </p>
          </div>
        ) : (
          <ul className="mt-10 list-none space-y-5 p-0">
            {sorted.map((activity) => {
              const meta = TYPE_META[activity.activity_type] ?? fallbackMeta;
              const Icon = meta.icon;
              return (
                <li key={activity.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/patient/activities/${activity.id}`)}
                    className="flex w-full items-center gap-5 rounded-3xl border-2 border-[#E4DCC8] bg-white p-6 text-left shadow-sm transition hover:border-[#2F6F62] active:scale-[0.99]"
                  >
                    <span
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${meta.tint}`}
                    >
                      <Icon className="h-9 w-9 text-[#2F6F62]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-2xl font-bold">
                        {activity.title || activity.activity_type_label || "Activity"}
                      </span>
                      <span className="mt-1 block text-lg text-[#5B6459]">{meta.blurb}</span>
                      {activity.notes && (
                        <span className="mt-1 block truncate text-base text-[#7A817D]">
                          {activity.notes}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
