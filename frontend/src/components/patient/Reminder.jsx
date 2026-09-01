import { useEffect, useMemo, useState } from "react";
import { Pill, CalendarDays, Activity, Check, Clock, Bell, PartyPopper,} from "lucide-react";

import { api } from "../../api";
import PatientNavigation from "./PatientNavigation";

const REMINDER_ICONS = {
  Medicine: Pill,
  Health: Bell,
  Activity: Activity,
  Routine: CalendarDays,
};

const REMINDER_COLORS = {
  Medicine: { color: "#B23A3A", background: "#F7E2DF" },
  Health: { color: "#2F6F62", background: "#E4F0EC" },
  Activity: { color: "#8A4E12", background: "#F3E7D0" },
  Routine: { color: "#2F6F62", background: "#E4F0EC" },
};

export default function Reminder({ onNavigate }) {
  const navigate = useMemo(
    () =>
      onNavigate ??
      ((nextPath) => {
        window.location.href = nextPath;
      }),
    [onNavigate]
  );

  const [reminders, setReminders] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [doneCount, setDoneCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/logsign");
      return;
    }

    const fetchReminders = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await api.get("/patient/reminders", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const nextReminders = (Array.isArray(data?.reminders) ? data.reminders : []).map((reminder) => ({
          ...reminder,
          icon: REMINDER_ICONS[reminder.type] || Bell,
          color: REMINDER_COLORS[reminder.type]?.color || "#2F6F62",
          background: REMINDER_COLORS[reminder.type]?.background || "#E4F0EC",
        }));

        setReminders(nextReminders);
        setDoneCount(Number(data?.done_count) || 0);
        setCompletedTasks([]);
      } catch {
        setReminders([]);
        setDoneCount(0);
        setCompletedTasks([]);
        setError("We couldn’t load your reminders right now. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, [navigate]);

  const markAsDone = async (reminder) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/logsign");
      return;
    }

    if (!reminder?.id || completingId === reminder.id) {
      return;
    }

    setCompletingId(reminder.id);

    try {
      const response = await api.post(
        "/patient/reminders/complete",
        { reminder_id: reminder.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReminders((currentReminders) =>
        currentReminders.filter((currentReminder) => currentReminder.id !== reminder.id)
      );
      setCompletedTasks((currentCompleted) => [
        ...currentCompleted,
        { ...reminder, completedAt: new Date().toISOString() },
      ]);
      setDoneCount(Number(response?.done_count) || Number(doneCount) + 1);
      setError("");
      setShowCelebration(true);
      window.setTimeout(() => setShowCelebration(false), 1800);
    } catch {
      setError("We couldn’t mark that reminder as complete. Please try again.");
    } finally {
      setCompletingId(null);
    }
  };

  const undoCompletedTask = (task) => {
    setCompletedTasks((currentCompleted) =>
      currentCompleted.filter((completedTask) => completedTask.id !== task.id)
    );
    setReminders((currentReminders) => [
      ...currentReminders,
      {
        ...task,
        icon: REMINDER_ICONS[task.type] || Bell,
        color: REMINDER_COLORS[task.type]?.color || "#2F6F62",
        background: REMINDER_COLORS[task.type]?.background || "#E4F0EC",
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-[#FBF8F2] text-[#20261F]" style={{ fontFamily: "Verdana, Tahoma, 'Segoe UI', system-ui, sans-serif", }} >
      <PatientNavigation onNavigate={navigate} activePage="reminders"/>
      {showCelebration ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center" aria-live="polite" role="status">
          <div className="rounded-3xl px-8 py-6 text-center shadow-lg motion-safe:animate-bounce" style={{  background: "#FFFFFF",  border: "3px solid #C97A2B", }} >
            <PartyPopper className="mx-auto h-12 w-12" style={{ color: "#C97A2B" }} aria-hidden="true"/>
            <p className="mt-2 text-2xl font-bold">Great job!</p>
            <p className="mt-1 text-lg" style={{ color: "#5B6459" }}>Task completed!</p>
          </div>

          <span className="absolute left-[15%] top-[35%] text-3xl motion-safe:animate-ping">🎉</span>
          <span className="absolute left-[28%] top-[25%] text-2xl motion-safe:animate-bounce"> ✨</span>
          <span className="absolute right-[25%] top-[30%] text-3xl motion-safe:animate-ping"> 🎊</span>
          <span className="absolute right-[15%] top-[45%] text-2xl motion-safe:animate-bounce"> ⭐</span>
          <span className="absolute left-[20%] bottom-[35%] text-2xl motion-safe:animate-bounce">✨</span>
          <span className="absolute right-[22%] bottom-[30%] text-3xl motion-safe:animate-ping"> 🎉 </span>
        </div>
      ) : null}

      <main className="mx-auto mt-10 max-w-5xl px-6">
        {error ? <p className="mx-auto mb-4 max-w-3xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        <div className="text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">Reminders</h1>
          <p className="mx-auto mt-3 max-w-2xl text-xl" style={{ color: "#5B6459" }}> Here are the things you need to remember today.</p>
        </div>

        <section className="mx-auto mt-8 flex max-w-3xl items-center justify-center gap-4 rounded-3xl p-5" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8", }} aria-label="Reminder progress" >
          <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "#F3E7D0", color: "#C97A2B", }}>
            <Bell className="h-7 w-7" aria-hidden="true"/></div>
          <div className="text-left">
            <p className="text-xl font-bold">Today's reminders</p>
            <p className="mt-1 text-lg" style={{ color: "#5B6459" }}>
              {doneCount} of {Math.max(reminders.length + doneCount, 0)} completed
            </p>
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-3xl" aria-label="Pending reminders">
          <h2 className="mb-5 text-2xl font-bold">Today's Tasks</h2>
          {loading ? (
            <div className="rounded-3xl border border-[#E4DCC8] bg-[#EFEEE6] p-8 text-center text-lg font-medium text-[#5B6459]">
              Loading your reminders…
            </div>
          ) : reminders.length === 0 ? (
            <div className="rounded-3xl p-8 text-center" style={{ background: "#E4F0EC", border: "2px solid #2F6F62", }} >
              <Check className="mx-auto h-12 w-12" style={{ color: "#2F6F62" }} aria-hidden="true"/>
              <h3 className="mt-3 text-2xl font-bold">All tasks completed!</h3>
              <p className="mt-2 text-lg" style={{ color: "#5B6459" }}>
                Well done. You have finished all your reminders for today.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {reminders.map((reminder) => {
                const Icon = reminder.icon;
                const isCompleting = completingId === reminder.id;

                return (
                  <article key={reminder.id} className="rounded-3xl p-6 shadow-sm" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8", }} >
                    <div className="flex items-start gap-5">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl" style={{ background: reminder.background, border: `3px solid ${reminder.color}`, }} >
                        <Icon className="h-10 w-10"  style={{  color: reminder.color,  }}  aria-hidden="true"  />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p  className="inline-block rounded-full px-3 py-1 text-base font-bold" style={{ background:  reminder.background,  color:  reminder.color, }} >{reminder.type}</p>
                        <h3 className="mt-3 text-2xl font-bold">{reminder.title}</h3>
                        <div className="mt-2 flex items-center gap-2 text-lg font-bold" style={{ color: "#5B6459", }} >
                          <Clock className="h-5 w-5" aria-hidden="true" />
                          <span>{reminder.time} </span>
                        </div>
                        {reminder.frequency || reminder.dosage || reminder.duration ? (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {reminder.frequency ? (
                              <span className="rounded-full px-3 py-1 text-base font-bold" style={{ background: reminder.background, color: reminder.color }}>
                                {reminder.frequency}{reminder.frequency === "Weekly" && reminder.day ? ` · ${reminder.day}` : ""}
                              </span>
                            ) : null}
                            {reminder.dosage ? (
                              <span className="rounded-full px-3 py-1 text-base font-bold" style={{ background: reminder.background, color: reminder.color }}>
                                Dose: {reminder.dosage}
                              </span>
                            ) : null}
                            {reminder.duration ? (
                              <span className="rounded-full px-3 py-1 text-base font-bold" style={{ background: reminder.background, color: reminder.color }}>
                                For {reminder.duration}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        {reminder.description ? (
                          <p className="mt-2 text-lg leading-snug" style={{ color: "#5B6459", }}>{reminder.description}</p>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => markAsDone(reminder)}
                      disabled={isCompleting}
                      className="mt-6 flex w-full items-center justify-center gap-3 rounded-full py-4 text-xl font-bold text-white active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C97A2B] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                      style={{ background: "#C97A2B" }}
                    >
                      <Check className="h-6 w-6" aria-hidden="true"/>
                      {isCompleting ? "Completing..." : "Mark as Done"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>


        {completedTasks.length > 0 ? (
          <section className="mx-auto mt-10 max-w-3xl" aria-label="Tasks completed">
            <div className="mb-5 flex items-center gap-3">
              <Check className="h-8 w-8" style={{ color: "#2F6F62" }} aria-hidden="true"/>
              <h2 className="text-2xl font-bold">Tasks Completed</h2>
            </div>

            <div className="space-y-4">
              {completedTasks.map((task) => {
                const Icon = task.icon;

                return (
                  <article key={task.id} className="rounded-3xl p-5" style={{ background: "#E4F0EC", border: "2px solid #2F6F62", }}>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl" style={{ background: "#FFFFFF", color: "#2F6F62",  border: "2px solid #2F6F62", }} >
                        <Icon className="h-8 w-8" aria-hidden="true"/>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xl font-bold line-through">{task.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-base font-semibold" style={{ color: "#5B6459", }}>
                          <Clock className="h-4 w-4" aria-hidden="true"/>
                          <span>{task.time}</span>
                        </div>
                      </div>

                      <div  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"  style={{  background: "#2F6F62",  color: "#FFFFFF", }} >
                        <Check className="h-7 w-7" strokeWidth={3} aria-hidden="true"/>
                      </div>
                    </div>
                    <button type="button" onClick={() =>   undoCompletedTask(task) } className="mt-4 flex w-full items-center justify-center gap-3 rounded-full py-3 text-lg font-bold active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2" style={{ background: "#FFFFFF", color: "#2F6F62", border: "2px solid #2F6F62", }}>
                      <Check className="h-5 w-5" aria-hidden="true"/>
                      Completed — Tap to Undo
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

      </main>
    </div>
  );
}