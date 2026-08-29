import { useState } from "react";
import {
  Mic,
  Pill,
  Droplets,
  CalendarDays,
  Activity,
  Check,
  Clock,
  Bell,
  PartyPopper,
} from "lucide-react";

import PatientNavigation from "./PatientNavigation";

const REMINDERS = [
  {
    id: 1,
    type: "Medicine",
    title: "Take your medicine",
    time: "8:00 AM",
    description: "Take your morning medicine.",
    icon: Pill,
    color: "#B23A3A",
    background: "#F7E2DF",
  },
  {
    id: 2,
    type: "Hydration",
    title: "Drink some water",
    time: "10:00 AM",
    description: "Have a glass of water.",
    icon: Droplets,
    color: "#2F6F62",
    background: "#E4F0EC",
  },
  {
    id: 3,
    type: "Medical Appointment",
    title: "Doctor's appointment",
    time: "2:00 PM",
    description: "You have an appointment with your doctor.",
    icon: CalendarDays,
    color: "#8A4E12",
    background: "#F3E7D0",
  },
  {
    id: 4,
    type: "Daily Activity",
    title: "Take a short walk",
    time: "5:00 PM",
    description: "Take a gentle walk and get some fresh air.",
    icon: Activity,
    color: "#2F6F62",
    background: "#E4F0EC",
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

export default function Reminder({ onNavigate }) {
  const navigate =
    onNavigate ??
    ((nextPath) => {
      window.location.href = nextPath;
    });

  const [voiceState, setVoiceState] = useState("idle");
  const [reminders, setReminders] = useState(REMINDERS);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const voiceCopy = VOICE_COPY[voiceState];
  const handleVoicePress = () => {
    if (voiceState === "idle") {
      setVoiceState("listening");
      return;
    }

    if (voiceState === "listening") {
      setVoiceState("processing");

      setTimeout(() => {
        setVoiceState("not_understood");
      }, 1000);

      return;
    }

    if (voiceState === "processing") {
      return;
    }

    if (voiceState === "not_understood") {
      setVoiceState("idle");
    }
  };

  const markAsDone = (reminder) => {
    setReminders((currentReminders) =>
      currentReminders.filter(
        (currentReminder) =>
          currentReminder.id !== reminder.id
      )
    );
    setCompletedTasks((currentCompleted) => [
      ...currentCompleted,
      {...reminder,completedAt: new Date(),},
    ]);

    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
    }, 1800);
  };


  const undoCompletedTask = (task) => {setCompletedTasks((currentCompleted) =>currentCompleted.filter((completedTask) =>completedTask.id !== task.id));
    setReminders((currentReminders) => [
      ...currentReminders,
      task,
    ]);
  };

  return (
    <div
      className="min-h-screen bg-[#FBF8F2] text-[#20261F]"
      style={{
        fontFamily:
          "Verdana, Tahoma, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <PatientNavigation
        onNavigate={navigate}
        activePage="reminders"
      />

      {/* ==================================================
          CELEBRATION
          ================================================== */}

      {showCelebration ? (
        <div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          aria-live="polite"
          role="status"
        >
          {/* Main celebration message */}
          <div
            className="rounded-3xl px-8 py-6 text-center shadow-lg motion-safe:animate-bounce"
            style={{
              background: "#FFFFFF",
              border: "3px solid #C97A2B",
            }}
          >
            <PartyPopper
              className="mx-auto h-12 w-12"
              style={{ color: "#C97A2B" }}
              aria-hidden="true"
            />

            <p className="mt-2 text-2xl font-bold">
              Great job!
            </p>

            <p
              className="mt-1 text-lg"
              style={{ color: "#5B6459" }}
            >
              Task completed!
            </p>
          </div>

          {/* Small celebration pieces */}
          <span className="absolute left-[15%] top-[35%] text-3xl motion-safe:animate-ping">
            🎉
          </span>

          <span className="absolute left-[28%] top-[25%] text-2xl motion-safe:animate-bounce">
            ✨
          </span>

          <span className="absolute right-[25%] top-[30%] text-3xl motion-safe:animate-ping">
            🎊
          </span>

          <span className="absolute right-[15%] top-[45%] text-2xl motion-safe:animate-bounce">
            ⭐
          </span>

          <span className="absolute left-[20%] bottom-[35%] text-2xl motion-safe:animate-bounce">
            ✨
          </span>

          <span className="absolute right-[22%] bottom-[30%] text-3xl motion-safe:animate-ping">
            🎉
          </span>
        </div>
      ) : null}

      {/* ==================================================
          VOICE ASSISTANT
          ================================================== */}

      <div className="mt-8 flex flex-col items-center px-6">
        <button
          type="button"
          onClick={handleVoicePress}
          aria-label={voiceCopy.label}
          aria-pressed={voiceState !== "idle"}
          className="flex items-center justify-center rounded-full border-4 shadow-md active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
          style={{
            width: "76px",
            height: "76px",
            background:
              voiceState === "listening"
                ? "#F3E7D0"
                : "#2F6F62",
            borderColor:
              voiceState === "listening"
                ? "#C97A2B"
                : "#24594F",
            color:
              voiceState === "listening"
                ? "#2F6F62"
                : "#FFFFFF",
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

        <p
          className="mt-3 text-center text-lg font-bold"
          aria-live="polite"
        >
          {voiceCopy.label}
        </p>

        {voiceCopy.support ? (
          <p
            className="mt-1 max-w-sm text-center text-base"
            style={{ color: "#5B6459" }}
          >
            {voiceCopy.support}
          </p>
        ) : null}

        {voiceState === "not_understood" ? (
          <button
            type="button"
            onClick={() => setVoiceState("idle")}
            className="mt-4 rounded-full px-6 py-3 text-lg font-bold text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
            style={{
              background: "#2F6F62",
            }}
          >
            Try Again
          </button>
        ) : null}
      </div>

      {/* ==================================================
          MAIN CONTENT
          ================================================== */}

      <main className="mx-auto mt-10 max-w-5xl px-6">

        {/* Page Heading */}
        <div className="text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Reminders
          </h1>

          <p
            className="mx-auto mt-3 max-w-2xl text-xl"
            style={{ color: "#5B6459" }}
          >
            Here are the things you need to remember today.
          </p>
        </div>

        {/* ==================================================
            PROGRESS SUMMARY
            ================================================== */}

        <section
          className="mx-auto mt-8 flex max-w-3xl items-center justify-center gap-4 rounded-3xl p-5"
          style={{
            background: "#EFEEE6",
            border: "2px solid #E4DCC8",
          }}
          aria-label="Reminder progress"
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{
              background: "#F3E7D0",
              color: "#C97A2B",
            }}
          >
            <Bell
              className="h-7 w-7"
              aria-hidden="true"
            />
          </div>

          <div className="text-left">
            <p className="text-xl font-bold">
              Today's reminders
            </p>

            <p
              className="mt-1 text-lg"
              style={{ color: "#5B6459" }}
            >
              {completedTasks.length} of{" "}
              {REMINDERS.length} completed
            </p>
          </div>
        </section>

        {/* ==================================================
            PENDING TASKS
            ================================================== */}

        <section
          className="mx-auto mt-8 max-w-3xl"
          aria-label="Pending reminders"
        >
          <h2 className="mb-5 text-2xl font-bold">
            Today's Tasks
          </h2>

          {reminders.length === 0 ? (
            <div
              className="rounded-3xl p-8 text-center"
              style={{
                background: "#E4F0EC",
                border: "2px solid #2F6F62",
              }}
            >
              <Check
                className="mx-auto h-12 w-12"
                style={{ color: "#2F6F62" }}
                aria-hidden="true"
              />

              <h3 className="mt-3 text-2xl font-bold">
                All tasks completed!
              </h3>

              <p
                className="mt-2 text-lg"
                style={{ color: "#5B6459" }}
              >
                Well done. You have finished all your
                reminders for today.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {reminders.map((reminder) => {
                const Icon = reminder.icon;

                return (
                  <article
                    key={reminder.id}
                    className="rounded-3xl p-6 shadow-sm"
                    style={{
                      background: "#EFEEE6",
                      border: "2px solid #E4DCC8",
                    }}
                  >
                    <div className="flex items-start gap-5">

                      {/* Reminder Icon */}
                      <div
                        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                          background:
                            reminder.background,
                          border: `3px solid ${reminder.color}`,
                        }}
                      >
                        <Icon
                          className="h-10 w-10"
                          style={{
                            color: reminder.color,
                          }}
                          aria-hidden="true"
                        />
                      </div>

                      {/* Reminder Information */}
                      <div className="min-w-0 flex-1">
                        <p
                          className="inline-block rounded-full px-3 py-1 text-base font-bold"
                          style={{
                            background:
                              reminder.background,
                            color:
                              reminder.color,
                          }}
                        >
                          {reminder.type}
                        </p>

                        <h3 className="mt-3 text-2xl font-bold">
                          {reminder.title}
                        </h3>

                        <div
                          className="mt-2 flex items-center gap-2 text-lg font-bold"
                          style={{
                            color: "#5B6459",
                          }}
                        >
                          <Clock
                            className="h-5 w-5"
                            aria-hidden="true"
                          />

                          <span>
                            {reminder.time}
                          </span>
                        </div>

                        <p
                          className="mt-2 text-lg leading-snug"
                          style={{
                            color: "#5B6459",
                          }}
                        >
                          {reminder.description}
                        </p>
                      </div>
                    </div>

                    {/* Mark as Done */}
                    <button
                      type="button"
                      onClick={() =>
                        markAsDone(reminder)
                      }
                      className="mt-6 flex w-full items-center justify-center gap-3 rounded-full py-4 text-xl font-bold text-white active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C97A2B] focus-visible:ring-offset-2"
                      style={{
                        background: "#C97A2B",
                      }}
                    >
                      <Check
                        className="h-6 w-6"
                        aria-hidden="true"
                      />

                      Mark as Done
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ==================================================
            COMPLETED TASKS
            ================================================== */}

        {completedTasks.length > 0 ? (
          <section
            className="mx-auto mt-10 max-w-3xl"
            aria-label="Tasks completed"
          >
            {/* Section Heading */}
            <div className="mb-5 flex items-center gap-3">
              <Check
                className="h-8 w-8"
                style={{ color: "#2F6F62" }}
                aria-hidden="true"
              />

              <h2 className="text-2xl font-bold">
                Tasks Completed
              </h2>
            </div>

            <div className="space-y-4">
              {completedTasks.map((task) => {
                const Icon = task.icon;

                return (
                  <article
                    key={task.id}
                    className="rounded-3xl p-5"
                    style={{
                      background: "#E4F0EC",
                      border: "2px solid #2F6F62",
                    }}
                  >
                    {/* Completed Task */}
                    <div className="flex items-center gap-4">

                      {/* Icon */}
                      <div
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                          background: "#FFFFFF",
                          color: "#2F6F62",
                          border:
                            "2px solid #2F6F62",
                        }}
                      >
                        <Icon
                          className="h-8 w-8"
                          aria-hidden="true"
                        />
                      </div>

                      {/* Task Information */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xl font-bold line-through">
                          {task.title}
                        </p>

                        <div
                          className="mt-1 flex items-center gap-2 text-base font-semibold"
                          style={{
                            color: "#5B6459",
                          }}
                        >
                          <Clock
                            className="h-4 w-4"
                            aria-hidden="true"
                          />

                          <span>
                            {task.time}
                          </span>
                        </div>
                      </div>

                      {/* Completed Check */}
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: "#2F6F62",
                          color: "#FFFFFF",
                        }}
                      >
                        <Check
                          className="h-7 w-7"
                          strokeWidth={3}
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    {/* Undo Button */}
                    <button
                      type="button"
                      onClick={() =>
                        undoCompletedTask(task)
                      }
                      className="mt-4 flex w-full items-center justify-center gap-3 rounded-full py-3 text-lg font-bold active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
                      style={{
                        background: "#FFFFFF",
                        color: "#2F6F62",
                        border: "2px solid #2F6F62",
                      }}
                    >
                      <Check
                        className="h-5 w-5"
                        aria-hidden="true"
                      />

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