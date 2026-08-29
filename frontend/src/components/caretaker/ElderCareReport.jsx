import { useEffect, useState } from "react";
import {ArrowLeft,Activity,Brain,Clock3,Gamepad2,TrendingUp,HeartPulse,CalendarDays,CheckCircle2,} from "lucide-react";

import { api } from "../../api";

export default function ElderCareReport({ onNavigate }) {
  const [report, setReport] = useState({ patients: [], count: 0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    api.get("/caretaker/report", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => setReport(data || { patients: [], count: 0 }))
      .catch(() => setReport({ patients: [], count: 0 }))
      .finally(() => setLoading(false));
  }, []);
  const patients = report.patients || [];

  return (
    <main className="min-h-screen bg-[#faf8f3] text-[#3f3a34]">
      <header className="border-b border-[#e6e0d6] bg-[#fffdf9]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7c9a87] text-white shadow-sm">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#3f3a34]">CODE<span className="text-[#7c9a87]">-1</span></p>
              <p className="text-xs text-[#8a837a]">Elder Care Report</p>
            </div>
          </div>

          <button onClick={() => onNavigate?.("/caretaker")} className="flex items-center gap-2 rounded-full border border-[#cfd9ce] bg-[#fffdf9] px-4 py-2 text-sm font-medium text-[#5f7f6a] transition hover:border-[#7c9a87] hover:bg-[#f1f6ef]">
            <ArrowLeft className="h-4 w-4" />Caretaker Dashboard
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-[#e5ded3] bg-gradient-to-br from-[#f6f0e7] via-[#faf7f1] to-[#eef4ec] p-8 shadow-sm sm:p-10">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-[#7c9a87]" />
            <span className="text-sm font-medium uppercase tracking-widest text-[#6f8f7a]">Daily Overview</span>
          </div>
          <h1 className="mt-5 text-4xl font-semibold text-[#3f3a34] sm:text-5xl"> Elder Care Report</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#756f67]">A simple overview of today's activity, engagement, and wellbeing.</p>
        </div>

        <div className="mt-10 flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-[#7c9a87]" />
          <div>
            <p className="text-sm font-medium text-[#3f3a34]">Today's Report</p>
            <p className="text-sm text-[#8a837a]"> Activity summary for your elder</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#e4ded4] bg-[#fffdf9] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef4ec]">
              <Gamepad2 className="h-6 w-6 text-[#6f8f7a]" />
            </div>

            <p className="mt-5 text-sm text-[#8a837a]">Linked elders</p>
            <p className="mt-2 text-3xl font-semibold text-[#3f3a34]">{loading ? "..." : patients.length}</p>
            <p className="mt-2 text-sm text-[#6f8f7a]">Active care relationships</p>
          </div>

          <div className="rounded-2xl border border-[#e4ded4] bg-[#fffdf9] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f4efe6]">
              <Clock3 className="h-6 w-6 text-[#8b806f]" />
            </div>
            <p className="mt-5 text-sm text-[#8a837a]">Mood entries</p>
            <p className="mt-2 text-3xl font-semibold text-[#3f3a34]">{loading ? "..." : patients.reduce((sum, patient) => sum + (patient.mood_history?.length || 0), 0)}</p>
            <p className="mt-2 text-sm text-[#8a837a]">Saved result updates</p>
          </div>

          <div className="rounded-2xl border border-[#e4ded4] bg-[#fffdf9] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef4ec]">
              <Brain className="h-6 w-6 text-[#6f8f7a]" />
            </div>
            <p className="mt-5 text-sm text-[#8a837a]">Current mood</p>
            <p className="mt-2 text-3xl font-semibold text-[#3f3a34]">{loading ? "..." : (patients[0]?.current_mood ? patients[0].current_mood : "-")}</p>
            <p className="mt-2 text-sm text-[#6f8f7a]">Latest saved selection</p>
          </div>

          <div className="rounded-2xl border border-[#e4ded4] bg-[#fffdf9] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef4ec]">
              <TrendingUp className="h-6 w-6 text-[#6f8f7a]" />
            </div>

            <p className="mt-5 text-sm text-[#8a837a]">Overall trend</p>
            <p className="mt-2 text-3xl font-semibold text-[#3f3a34]">{loading ? "..." : (patients.length > 0 ? "Active" : "No data")}</p>
            <p className="mt-2 text-sm text-[#6f8f7a]">Latest caregiver report</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#e4ded4] bg-[#fffdf9] p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef4ec]">
                <Activity className="h-5 w-5 text-[#6f8f7a]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#3f3a34]">Today's Activities</h2>
                <p className="text-sm text-[#8a837a]">Completed activities</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {patients.length === 0 ? (
                <div className="rounded-2xl bg-[#faf7f1] p-4 text-sm text-[#8a837a]">
                  No elder is linked to your caretaker account yet.
                </div>
              ) : (
                patients.map((patient) => (
                  <div key={patient.email || patient.username} className="rounded-2xl bg-[#faf7f1] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#3f3a34]">{patient.full_name || patient.username || "Elder"}</p>
                        <p className="mt-1 text-sm text-[#8a837a]">{patient.current_mood ? `Current mood: ${patient.current_mood}` : "No mood selected yet"}</p>
                      </div>
                      <CheckCircle2 className="h-6 w-6 text-[#6f8f7a]" />
                    </div>

                    {patient.mood_history && patient.mood_history.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {patient.mood_history.slice(-3).reverse().map((entry, index) => (
                          <div key={`${patient.email}-${index}`} className="flex items-center justify-between rounded-xl border border-[#e4ded4] bg-white p-3 text-sm text-[#756f67]">
                            <span>{entry.label || entry.mood}</span>
                            <span>{new Date(entry.selected_at).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-[#8a837a]">No results recorded yet.</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>


          <div className="rounded-3xl border border-[#dce6d9] bg-gradient-to-br from-[#f1f6ef] via-[#f7f4ed] to-[#faf7f1] p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7c9a87] text-white">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#3f3a34]">Care Insight</h2>
                <p className="text-sm text-[#8a837a]">Saved wellbeing summary</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-[#e5ded3] bg-[#fffdf9] p-5">
              <p className="leading-relaxed text-[#756f67]">
                {patients.length === 0
                  ? "No elder mood history has been linked to this account yet."
                  : `${patients[0].full_name || patients[0].username || "Your elder"} most recently selected ${patients[0].current_mood || "no mood"}.`}
              </p>
              <p className="mt-4 leading-relaxed text-[#756f67]">
                {patients.length > 0 && patients[0].mood_history?.length
                  ? "Recent selections are now stored in the database and available here for review."
                  : "Once the elder picks a mood on the homepage, the result will appear here."}
              </p>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm text-[#6f8f7a]">
              <TrendingUp className="h-4 w-4" />{patients.length > 0 ? "Result history is live" : "Waiting for results"}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}