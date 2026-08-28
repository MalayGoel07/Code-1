import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Plus,
  Clock3,
  Pill,
  CheckCircle2,
  Circle,
  Trash2,
  CalendarDays,
  X,
} from "lucide-react";

export default function ReminderPage({ onNavigate }) {
  const [reminders, setReminders] = useState([
    {
      id: 1,
      title: "Morning Medicine",
      description: "Take prescribed morning medication",
      time: "8:00 AM",
      type: "Medicine",
      completed: false,
    },
    {
      id: 2,
      title: "Drink Water",
      description: "Have a glass of water",
      time: "10:30 AM",
      type: "Health",
      completed: false,
    },
    {
      id: 3,
      title: "Afternoon Medicine",
      description: "Take prescribed afternoon medication",
      time: "2:00 PM",
      type: "Medicine",
      completed: false,
    },
    {
      id: 4,
      title: "Evening Walk",
      description: "Go for a short walk",
      time: "5:30 PM",
      type: "Activity",
      completed: false,
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    time: "",
    type: "Medicine",
  });

  const toggleReminder = (id) => {
    setReminders((currentReminders) =>
      currentReminders.map((reminder) =>
        reminder.id === id
          ? { ...reminder, completed: !reminder.completed }
          : reminder
      )
    );
  };

  const deleteReminder = (id) => {
    setReminders((currentReminders) =>
      currentReminders.filter((reminder) => reminder.id !== id)
    );
  };

  const addReminder = (event) => {
    event.preventDefault();

    if (!newReminder.title || !newReminder.time) {
      return;
    }

    const reminder = {
      id: Date.now(),
      title: newReminder.title,
      description: newReminder.description || "No description added",
      time: newReminder.time,
      type: newReminder.type,
      completed: false,
    };

    setReminders((currentReminders) => [...currentReminders, reminder]);

    setNewReminder({
      title: "",
      description: "",
      time: "",
      type: "Medicine",
    });

    setShowForm(false);
  };

  const completedCount = reminders.filter(
    (reminder) => reminder.completed
  ).length;

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#3f3b36]">
      {/* Header */}
      <header className="border-b border-[#e6e0d5] bg-[#faf9f6]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5f8f70] text-white shadow-sm">
              <Bell className="h-5 w-5" />
            </div>

            <div>
              <p className="text-lg font-semibold text-[#3f3b36]">
                CODE<span className="text-[#5f8f70]">-1</span>
              </p>

              <p className="text-xs text-[#81796f]">
                Reminders
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate?.("/caretaker")}
            className="flex items-center gap-2 rounded-full border border-[#d8d0c2] bg-[#faf9f6] px-4 py-2 text-sm font-medium text-[#5f8f70] transition hover:border-[#8caf98] hover:bg-[#f0f5f1]"
          >
            <ArrowLeft className="h-4 w-4" />
            Caretaker Dashboard
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {/* Hero */}
        <div className="rounded-3xl border border-[#e3dccf] bg-gradient-to-br from-[#f5f1e8] via-[#f7f4ee] to-[#eef4ee] p-8 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-[#5f8f70]" />

                <span className="text-sm font-medium uppercase tracking-widest text-[#5f8f70]">
                  Daily schedule
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-semibold text-[#3f3b36] sm:text-5xl">
                Reminders
              </h1>

              <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#756e65]">
                Help your elder stay on track with medicines, activities,
                and daily routines.
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center justify-center gap-2 rounded-full bg-[#5f8f70] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#4d7a5e]"
            >
              <Plus className="h-5 w-5" />
              Add Reminder
            </button>
          </div>
        </div>

        {/* Add Reminder Form */}
        {showForm && (
          <div className="mt-8 rounded-3xl border border-[#e3dccf] bg-[#faf9f6] p-7 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#3f3b36]">
                  Add New Reminder
                </h2>

                <p className="mt-1 text-sm text-[#81796f]">
                  Create a reminder for your elder.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl p-2 text-[#81796f] transition hover:bg-[#f0ede7]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={addReminder}
              className="mt-6 grid gap-5 sm:grid-cols-2"
            >
              <div>
                <label className="text-sm font-medium text-[#554f48]">
                  Reminder Title
                </label>

                <input
                  type="text"
                  value={newReminder.title}
                  onChange={(event) =>
                    setNewReminder({
                      ...newReminder,
                      title: event.target.value,
                    })
                  }
                  placeholder="Example: Take morning medicine"
                  className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition placeholder:text-[#aaa196] focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#554f48]">
                  Time
                </label>

                <input
                  type="time"
                  value={newReminder.time}
                  onChange={(event) =>
                    setNewReminder({
                      ...newReminder,
                      time: event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#554f48]">
                  Type
                </label>

                <select
                  value={newReminder.type}
                  onChange={(event) =>
                    setNewReminder({
                      ...newReminder,
                      type: event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"
                >
                  <option>Medicine</option>
                  <option>Health</option>
                  <option>Activity</option>
                  <option>Routine</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-[#554f48]">
                  Description
                </label>

                <input
                  type="text"
                  value={newReminder.description}
                  onChange={(event) =>
                    setNewReminder({
                      ...newReminder,
                      description: event.target.value,
                    })
                  }
                  placeholder="Optional description"
                  className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition placeholder:text-[#aaa196] focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"
                />
              </div>

              <button
                type="submit"
                className="sm:col-span-2 rounded-xl bg-[#5f8f70] px-5 py-3 font-medium text-white transition hover:bg-[#4d7a5e]"
              >
                Save Reminder
              </button>
            </form>
          </div>
        )}

        {/* Summary */}
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e1dbd0] bg-[#faf9f6] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf3ed]">
              <Bell className="h-6 w-6 text-[#5f8f70]" />
            </div>

            <p className="mt-5 text-sm text-[#81796f]">
              Total Reminders
            </p>

            <p className="mt-2 text-3xl font-semibold text-[#3f3b36]">
              {reminders.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e1dbd0] bg-[#faf9f6] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf3ed]">
              <CheckCircle2 className="h-6 w-6 text-[#5f8f70]" />
            </div>

            <p className="mt-5 text-sm text-[#81796f]">
              Completed
            </p>

            <p className="mt-2 text-3xl font-semibold text-[#3f3b36]">
              {completedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e1dbd0] bg-[#faf9f6] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f4efe4]">
              <CalendarDays className="h-6 w-6 text-[#a47a50]" />
            </div>

            <p className="mt-5 text-sm text-[#81796f]">
              Remaining
            </p>

            <p className="mt-2 text-3xl font-semibold text-[#3f3b36]">
              {reminders.length - completedCount}
            </p>
          </div>
        </div>

        {/* Reminder List */}
        <div className="mt-10">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-[#5f8f70]" />

            <div>
              <h2 className="text-xl font-semibold text-[#3f3b36]">
                Today's Reminders
              </h2>

              <p className="text-sm text-[#81796f]">
                Manage your elder's daily schedule
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`flex flex-col gap-5 rounded-2xl border p-6 shadow-sm transition sm:flex-row sm:items-center sm:justify-between ${
                  reminder.completed
                    ? "border-[#c8dbc9] bg-[#f0f5f0]"
                    : "border-[#e1dbd0] bg-[#faf9f6]"
                }`}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleReminder(reminder.id)}
                    className="shrink-0"
                  >
                    {reminder.completed ? (
                      <CheckCircle2 className="h-7 w-7 text-[#5f8f70]" />
                    ) : (
                      <Circle className="h-7 w-7 text-[#c8c0b4] transition hover:text-[#5f8f70]" />
                    )}
                  </button>

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      reminder.type === "Medicine"
                        ? "bg-[#edf3ed]"
                        : "bg-[#f4efe4]"
                    }`}
                  >
                    {reminder.type === "Medicine" ? (
                      <Pill className="h-6 w-6 text-[#5f8f70]" />
                    ) : (
                      <Bell className="h-6 w-6 text-[#a47a50]" />
                    )}
                  </div>

                  <div>
                    <p
                      className={`font-semibold ${
                        reminder.completed
                          ? "text-[#9a948a] line-through"
                          : "text-[#3f3b36]"
                      }`}
                    >
                      {reminder.title}
                    </p>

                    <p className="mt-1 text-sm text-[#81796f]">
                      {reminder.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#5f8f70]">
                    <Clock3 className="h-4 w-4" />
                    {reminder.time}
                  </div>

                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="rounded-xl p-2 text-[#a79f94] transition hover:bg-[#f3e9e6] hover:text-[#b86b58]"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}

            {reminders.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#d8d0c2] bg-[#faf9f6] p-10 text-center">
                <Bell className="mx-auto h-10 w-10 text-[#c5bdb1]" />

                <p className="mt-4 font-medium text-[#554f48]">
                  No reminders yet
                </p>

                <p className="mt-1 text-sm text-[#81796f]">
                  Add a reminder to help your elder stay on track.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}