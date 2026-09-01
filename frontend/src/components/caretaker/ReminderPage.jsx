import { useState } from "react";
import { ArrowLeft, Bell, Plus, Clock3, Pill, CheckCircle2, Circle, Trash2, CalendarDays, X,} from "lucide-react";
import { api } from "../../api";
import MedicationManager from "./MedicationManager";
import PatientLinkManager from "./PatientLinkManager";

export default function ReminderPage({ onNavigate }) {
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [newReminder, setNewReminder] = useState({
    patient_email: "",
    title: "",
    description: "",
    time: "",
    time2: "",
    type: "Medicine",
    frequency: "Daily",
    day: "Monday",
    dosage: "",
    duration: "",
  });
  const addReminder = async (event) => {
    event.preventDefault();
    if (!newReminder.patient_email || !newReminder.title) {
      setError("Please fill in patient email and a title.");
      return;
    }
    if (newReminder.frequency === "Twice a day" && (!newReminder.time || !newReminder.time2)) {
      setError("Please enter both times for a twice-a-day reminder.");
      return;
    }
    if (newReminder.frequency !== "Twice a day" && !newReminder.time) {
      setError("Please enter a time.");
      return;
    }
    if (newReminder.type === "Medicine" && !newReminder.dosage) {
      setError("Please enter the dosage for this medicine.");
      return;
    }
    if (newReminder.type === "Activity" && !newReminder.duration) {
      setError("Please enter how long the exercise should last.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Please log in to add a reminder.");
      return;
    }

    const times =
      newReminder.frequency === "Twice a day"
        ? [newReminder.time, newReminder.time2]
        : [newReminder.time];

    try {
      setSaving(true);
      setError("");

      const data = await api.post(
        "/caretaker/reminders",
        {
          patient_email: newReminder.patient_email,
          title: newReminder.title,
          description: newReminder.description || "No description added",
          time: times[0],
          times,
          type: newReminder.type,
          frequency:
            newReminder.frequency === "Twice a day"
              ? "Twice daily"
              : newReminder.frequency,
          day: newReminder.frequency === "Weekly" ? newReminder.day : "",
          dosage: newReminder.type === "Medicine" ? newReminder.dosage : "",
          duration: newReminder.type === "Activity" ? newReminder.duration : "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const created = Array.isArray(data?.reminders) ? data.reminders : [];
      const items = created.map((item) => ({
        id: item.id || Date.now() + Math.random(),
        title: item.title,
        description: item.description,
        time: item.time,
        type: item.type,
        frequency: item.frequency,
        day: item.day,
        dosage: item.dosage,
        duration: item.duration,
        completed: false,
      }));

      setReminders((currentReminders) => [...currentReminders, ...items]);
      setNewReminder({
        patient_email: "",
        title: "",
        description: "",
        time: "",
        time2: "",
        type: "Medicine",
        frequency: "Daily",
        day: "Monday",
        dosage: "",
        duration: "",
      });
      setShowForm(false);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const toggleReminder = (id) => {setReminders((currentReminders) =>currentReminders.map((reminder) =>reminder.id === id? { ...reminder, completed: !reminder.completed }: reminder));};
  const deleteReminder = (id) => {setReminders((currentReminders) =>currentReminders.filter((reminder) => reminder.id !== id));};
  const completedCount = reminders.filter((reminder) => reminder.completed).length;

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#3f3b36]">
      <header className="border-b border-[#e6e0d5] bg-[#faf9f6]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5f8f70] text-white shadow-sm">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#3f3b36]">CODE<span className="text-[#5f8f70]">-1</span></p>
              <p className="text-xs text-[#81796f]">Reminders</p>
            </div>
          </div>

          <button onClick={() => onNavigate?.("/caretaker")} className="flex items-center gap-2 rounded-full border border-[#d8d0c2] bg-[#faf9f6] px-4 py-2 text-sm font-medium text-[#5f8f70] transition hover:border-[#8caf98] hover:bg-[#f0f5f1]" >
            <ArrowLeft className="h-4 w-4" />
            Caretaker Dashboard
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-[#e3dccf] bg-gradient-to-br from-[#f5f1e8] via-[#f7f4ee] to-[#eef4ee] p-8 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-[#5f8f70]" />
                <span className="text-sm font-medium uppercase tracking-widest text-[#5f8f70]">Daily schedule</span>
              </div>
              <h1 className="mt-5 text-4xl font-semibold text-[#3f3b36] sm:text-5xl">Reminders</h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#756e65]">
                Help your elder stay on track with medicines, activities,
                and daily routines.
              </p>
            </div>

            <button onClick={() => setShowForm(!showForm)} className="flex items-center justify-center gap-2 rounded-full bg-[#5f8f70] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#4d7a5e]">
              <Plus className="h-5 w-5" />
              Add Reminder
            </button>
          </div>
        </div>

        {showForm && (
          <div className="mt-8 rounded-3xl border border-[#e3dccf] bg-[#faf9f6] p-7 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#3f3b36]">Add New Reminder</h2>
                <p className="mt-1 text-sm text-[#81796f]"> Create a reminder for your elder.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-xl p-2 text-[#81796f] transition hover:bg-[#f0ede7]" >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={addReminder} className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-[#554f48]">Patient Email</label>
                <input type="email" value={newReminder.patient_email} onChange={(event) => setNewReminder({ ...newReminder, patient_email: event.target.value }) } placeholder="elder@example.com" className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition placeholder:text-[#aaa196] focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"/>
              </div>

              <div>
                <label className="text-sm font-medium text-[#554f48]">What is it?</label>
                <select value={newReminder.type} onChange={(event) => setNewReminder({ ...newReminder, type: event.target.value }) } className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]">
                  <option value="Medicine">Medicine</option>
                  <option value="Activity">Activity (Exercise)</option>
                  <option value="Health">Health</option>
                  <option value="Routine">Routine</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-[#554f48]">How often?</label>
                <select value={newReminder.frequency} onChange={(event) => setNewReminder({ ...newReminder, frequency: event.target.value }) } className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]">
                  <option value="Daily">Daily</option>
                  <option value="Twice a day">Twice a day</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>

              <div className="sm:col-span-2 grid gap-5 sm:grid-cols-2">
                {newReminder.frequency === "Weekly" && (
                  <div>
                    <label className="text-sm font-medium text-[#554f48]">Which day?</label>
                    <select value={newReminder.day} onChange={(event) => setNewReminder({ ...newReminder, day: event.target.value }) } className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]">
                      {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((weekday) => (
                        <option key={weekday} value={weekday}>{weekday}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-[#554f48]">Time</label>
                  <input type="time" value={newReminder.time} onChange={(event) => setNewReminder({ ...newReminder, time: event.target.value })} className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"/>
                </div>
                {newReminder.frequency === "Twice a day" && (
                  <div>
                    <label className="text-sm font-medium text-[#554f48]">Second Time</label>
                    <input type="time" value={newReminder.time2} onChange={(event) => setNewReminder({ ...newReminder, time2: event.target.value })} className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"/>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-[#554f48]">
                  {newReminder.type === "Medicine" ? "Which medicine?" : newReminder.type === "Activity" ? "Which exercise?" : "Reminder title"}
                </label>
                <input type="text" value={newReminder.title} onChange={(event) => setNewReminder({ ...newReminder, title: event.target.value }) } placeholder={newReminder.type === "Medicine" ? "e.g. Aspirin" : newReminder.type === "Activity" ? "e.g. Morning walk" : "e.g. Drink water"} className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition placeholder:text-[#aaa196] focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"/>
              </div>

              {newReminder.type === "Medicine" && (
                <div>
                  <label className="text-sm font-medium text-[#554f48]">Dosage</label>
                  <input type="text" value={newReminder.dosage} onChange={(event) => setNewReminder({ ...newReminder, dosage: event.target.value }) } placeholder="e.g. 1 tablet / 500 mg" className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition placeholder:text-[#aaa196] focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"/>
                </div>
              )}

              {newReminder.type === "Activity" && (
                <div>
                  <label className="text-sm font-medium text-[#554f48]">For how long?</label>
                  <input type="text" value={newReminder.duration} onChange={(event) => setNewReminder({ ...newReminder, duration: event.target.value }) } placeholder="e.g. 20 minutes" className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition placeholder:text-[#aaa196] focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"/>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-[#554f48]">Notes</label>
                <input type="text" value={newReminder.description} onChange={(event) => setNewReminder({ ...newReminder, description: event.target.value }) } placeholder="Optional notes for your elder" className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition placeholder:text-[#aaa196] focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"/>
              </div>
              {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={saving} className="sm:col-span-2 rounded-xl bg-[#5f8f70] px-5 py-3 font-medium text-white transition hover:bg-[#4d7a5e] disabled:cursor-not-allowed disabled:opacity-70">{saving ? "Saving..." : "Save Reminder"}</button>
            </form>
          </div>
        )}

        <PatientLinkManager />

        <MedicationManager />

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e1dbd0] bg-[#faf9f6] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf3ed]">
              <Bell className="h-6 w-6 text-[#5f8f70]" />
            </div>
            <p className="mt-5 text-sm text-[#81796f]">Total Reminders </p>
            <p className="mt-2 text-3xl font-semibold text-[#3f3b36]">{reminders.length}</p>
          </div>

          <div className="rounded-2xl border border-[#e1dbd0] bg-[#faf9f6] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf3ed]">
              <CheckCircle2 className="h-6 w-6 text-[#5f8f70]" />
            </div>
            <p className="mt-5 text-sm text-[#81796f]">Completed</p>
            <p className="mt-2 text-3xl font-semibold text-[#3f3b36]">{completedCount}</p>
          </div>

          <div className="rounded-2xl border border-[#e1dbd0] bg-[#faf9f6] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f4efe4]">
              <CalendarDays className="h-6 w-6 text-[#a47a50]" />
            </div>
            <p className="mt-5 text-sm text-[#81796f]"> Remaining</p>
            <p className="mt-2 text-3xl font-semibold text-[#3f3b36]">{reminders.length - completedCount}</p>
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-[#5f8f70]" />
            <div>
              <h2 className="text-xl font-semibold text-[#3f3b36]">Today's Reminders</h2>
              <p className="text-sm text-[#81796f]">Manage your elder's daily schedule </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {reminders.map((reminder) => (
              <div key={reminder.id} className={`flex flex-col gap-5 rounded-2xl border p-6 shadow-sm transition sm:flex-row sm:items-center sm:justify-between ${ reminder.completed ? "border-[#c8dbc9] bg-[#f0f5f0]" : "border-[#e1dbd0] bg-[#faf9f6]" }`} >
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleReminder(reminder.id)} className="shrink-0" >
                    {reminder.completed ? (<CheckCircle2 className="h-7 w-7 text-[#5f8f70]" />
                    ) : (
                    <Circle className="h-7 w-7 text-[#c8c0b4] transition hover:text-[#5f8f70]" />
                    )}
                  </button>

                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${reminder.type === "Medicine" ? "bg-[#edf3ed]": "bg-[#f4efe4]"}`}>
                    {reminder.type === "Medicine" ? (
                      <Pill className="h-6 w-6 text-[#5f8f70]" />
                    ) : (
                      <Bell className="h-6 w-6 text-[#a47a50]" />
                    )}
                  </div>

                  <div>
                    <p className={`font-semibold ${ reminder.completed ? "text-[#9a948a] line-through" : "text-[#3f3b36]"}`}>{reminder.title}</p>
                    <p className="mt-1 text-sm text-[#81796f]">{reminder.description} </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium">
                      <span className="rounded-full bg-[#eef3ee] px-2.5 py-1 text-[#5f8f70]">
                        {reminder.frequency || "Daily"}
                        {reminder.frequency === "Weekly" && reminder.day ? ` · ${reminder.day}` : ""}
                      </span>
                      {reminder.dosage ? (
                        <span className="rounded-full bg-[#f4efe4] px-2.5 py-1 text-[#a47a50]">{reminder.dosage}</span>
                      ) : null}
                      {reminder.duration ? (
                        <span className="rounded-full bg-[#f4efe4] px-2.5 py-1 text-[#a47a50]">{reminder.duration}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#5f8f70]">
                    <Clock3 className="h-4 w-4" />{reminder.time}
                  </div>

                  <button onClick={() => deleteReminder(reminder.id)} className="rounded-xl p-2 text-[#a79f94] transition hover:bg-[#f3e9e6] hover:text-[#b86b58]">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}

            {reminders.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#d8d0c2] bg-[#faf9f6] p-10 text-center">
                <Bell className="mx-auto h-10 w-10 text-[#c5bdb1]" />
                <p className="mt-4 font-medium text-[#554f48]">No reminders yet</p>
                <p className="mt-1 text-sm text-[#81796f]">Add a reminder to help your elder stay on track.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}