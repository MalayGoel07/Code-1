import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Pill,
  Clock3,
  CalendarDays,
  UserRound,
} from "lucide-react";

import { api } from "../../api";

const EMPTY_FORM = {
  name: "",
  dosage: "",
  time: "",
  frequency: "Daily",
  instructions: "",
};

const FREQUENCIES = [
  "Daily",
  "Twice daily",
  "Three times daily",
  "Weekly",
  "As needed",
];

/**
 * Caretaker-facing medication management.
 *
 * The caretaker configures medications for one of their linked elders. Adding a
 * medication also creates the matching Medicine reminder on the patient side,
 * so the patient sees and completes it through the existing reminder flow.
 */
export default function MedicationManager() {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("access_token")
      : null;

  const [linkedPatients, setLinkedPatients] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [medications, setMedications] = useState([]);

  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingMedications, setLoadingMedications] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  useEffect(() => {
    if (!token) return;

    api
      .get("/caretaker/report", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((data) => {
        const linked = Array.isArray(data?.patients) ? data.patients : [];
        setLinkedPatients(linked);
        setSelectedEmail(linked.length > 0 ? linked[0].email || "" : "");
      })
      .catch(() => {
        setLinkedPatients([]);
        setSelectedEmail("");
        setError("We couldn't load the linked patients.");
      })
      .finally(() => setLoadingPatients(false));
  }, [token]);

  useEffect(() => {
    if (!token || !selectedEmail) return;

    let cancelled = false;

    api
      .get(
        `/caretaker/medications?patient_email=${encodeURIComponent(selectedEmail)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((data) => {
        if (!cancelled) {
          setMedications(
            Array.isArray(data?.medications) ? data.medications : []
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMedications([]);
          setError("We couldn't load the medicines.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingMedications(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, selectedEmail]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    clearMessages();
  };

  const openEditForm = (medication) => {
    setForm({
      name: medication.name || "",
      dosage: medication.dosage || "",
      time: medication.time || "",
      frequency: medication.frequency || "Daily",
      instructions: medication.instructions || "",
    });
    setEditingId(medication.id);
    setShowForm(true);
    clearMessages();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    clearMessages();
  };

  const handleSave = async () => {
    clearMessages();

    if (!selectedEmail) {
      setError("Please select a patient first.");
      return;
    }

    if (!form.name.trim() || !form.dosage.trim() || !form.time) {
      setError("Please enter the medicine name, dosage and time.");
      return;
    }

    if (!token) {
      setError("Please log in to save medicines.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        patient_email: selectedEmail,
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        time: form.time,
        frequency: form.frequency,
        instructions: form.instructions.trim(),
      };

      if (editingId) {
        const data = await api.put(
          `/caretaker/medications/${editingId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data?.medication) {
          setMedications((current) =>
            current.map((item) =>
              item.id === editingId ? data.medication : item
            )
          );
        }

        setSuccess("Medicine updated.");
      } else {
        const data = await api.post(
          "/caretaker/medications",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data?.medication) {
          setMedications((current) => [...current, data.medication]);
        }

        setSuccess("Medicine added.");
      }

      closeForm();
      window.setTimeout(() => setSuccess(""), 2500);
    } catch {
      setError("We couldn't save this medicine.");
    } finally {
      setSaving(false);
    }
  };

  const beginDelete = (id) => {
    setConfirmDeleteId(id);
  };

  const cancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const confirmDelete = async (id) => {
    if (!token || !selectedEmail || deletingId) return;

    setDeletingId(id);
    clearMessages();

    try {
      await api.delete(
        `/caretaker/medications/${id}?patient_email=${encodeURIComponent(selectedEmail)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMedications((current) => current.filter((item) => item.id !== id));
      setConfirmDeleteId(null);
      setSuccess("Medicine removed.");
      window.setTimeout(() => setSuccess(""), 2500);
    } catch {
      setError("We couldn't remove this medicine.");
    } finally {
      setDeletingId(null);
    }
  };
return (
    <section
      className="mt-12 rounded-3xl border border-[#e3dccf] bg-[#faf9f6] p-7 shadow-sm"
      aria-labelledby="patient-medications-heading"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Pill className="h-6 w-6 text-[#5f8f70]" />
            <span className="text-sm font-medium uppercase tracking-widest text-[#5f8f70]">
              Medication care plan
            </span>
          </div>
          <h2
            id="patient-medications-heading"
            className="mt-5 text-3xl font-semibold text-[#3f3b36]"
          >
            Patient Medications
          </h2>
          <p className="mt-2 text-sm text-[#81796f]">
            Manage the medicines your elder takes. They will see these in their
            Reminders.
          </p>
        </div>

        {linkedPatients.length > 0 && (
          <button
            type="button"
            onClick={() => (showForm ? closeForm() : openAddForm())}
            className="flex items-center justify-center gap-2 rounded-full bg-[#5f8f70] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#4d7a5e]"
          >
            {showForm ? (
              <>
                <X className="h-5 w-5" />
                Close
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Add Medicine
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <p
          className="mt-4 rounded-xl bg-[#fde8e5] px-4 py-3 text-sm text-[#a04a3a]"
          role="alert"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          className="mt-4 rounded-xl bg-[#e8f2ea] px-4 py-3 text-sm text-[#3f6f4f]"
          role="status"
        >
          {success}
        </p>
      )}
<div className="mt-6">
        <label className="text-sm font-medium text-[#554f48]">Patient</label>
        {loadingPatients ? (
          <p className="mt-2 text-sm text-[#81796f]">
            Loading linked patients...
          </p>
        ) : linkedPatients.length === 0 ? (
          <p className="mt-2 text-sm text-[#81796f]">
            No elder is linked to your caretaker account yet.
          </p>
        ) : (
          <select
            value={selectedEmail}
            onChange={(event) => {
              setSelectedEmail(event.target.value);
              setMedications([]);
              setLoadingMedications(true);
              setShowForm(false);
              setEditingId(null);
              setForm(EMPTY_FORM);
              clearMessages();
            }}
            className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"
          >
            {linkedPatients.map((patient) => (
              <option
                key={patient.email || patient.username}
                value={patient.email || ""}
              >
                {patient.full_name || patient.username || patient.email || "Elder"}
              </option>
            ))}
          </select>
        )}
      </div>
{showForm && (
        <div className="mt-6 rounded-2xl border border-[#e1dbd0] bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#3f3b36]">
              {editingId ? "Edit Medicine" : "Add Medicine"}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl p-2 text-[#81796f] transition hover:bg-[#f0ede7]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#554f48]">
                Medicine name
              </span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="e.g. Paracetamol"
                className="w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#554f48]">
                Dosage
              </span>
              <input
                type="text"
                value={form.dosage}
                onChange={(event) => updateField("dosage", event.target.value)}
                placeholder="e.g. 500 mg"
                className="w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#554f48]">
                Time
              </span>
              <input
                type="time"
                value={form.time}
                onChange={(event) => updateField("time", event.target.value)}
                className="w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#554f48]">
                Frequency
              </span>
              <select
                value={form.frequency}
                onChange={(event) =>
                  updateField("frequency", event.target.value)
                }
                className="w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"
              >
                {FREQUENCIES.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {frequency}
                  </option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-[#554f48]">
                Instructions (optional)
              </span>
              <textarea
                value={form.instructions}
                onChange={(event) =>
                  updateField("instructions", event.target.value)
                }
                placeholder="e.g. Take after breakfast"
                rows={3}
                className="w-full resize-none rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none transition focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-xl border border-[#d8d0c2] bg-[#faf9f6] px-5 py-3 font-medium text-[#554f48] transition hover:border-[#c8c0b4] disabled:opacity-70"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !selectedEmail}
              className="rounded-xl bg-[#5f8f70] px-5 py-3 font-medium text-white transition hover:bg-[#4d7a5e] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Medicine"}
            </button>
          </div>
        </div>
      )}
<div className="mt-8">
        <div className="flex items-center gap-3">
          <Pill className="h-5 w-5 text-[#5f8f70]" />
          <div>
            <h3 className="text-xl font-semibold text-[#3f3b36]">
              Assigned Medicines
            </h3>
            <p className="text-sm text-[#81796f]">
              Medicines configured for {selectedEmail || "the selected elder"}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {loadingMedications ? (
            <div className="rounded-2xl border border-[#e1dbd0] bg-[#faf9f6] p-8 text-center text-sm text-[#81796f]">
              Loading medicines...
            </div>
          ) : !selectedEmail ? (
            <div className="rounded-2xl border border-[#e1dbd0] bg-[#faf9f6] p-8 text-center">
              <UserRound className="mx-auto h-9 w-9 text-[#c5bdb1]" />
              <p className="mt-3 font-medium text-[#554f48]">
                Select a patient to manage their medicines.
              </p>
            </div>
          ) : medications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8d0c2] bg-[#faf9f6] p-8 text-center">
              <Pill className="mx-auto h-9 w-9 text-[#c5bdb1]" />
              <p className="mt-3 font-medium text-[#554f48]">
                No medicines added yet
              </p>
              <p className="mt-1 text-sm text-[#81796f]">
                Tap "Add Medicine" to configure your elder's medication.
              </p>
            </div>
          ) : (
            medications.map((medication) => (
              <div
                key={medication.id}
                className="flex flex-col gap-5 rounded-2xl border border-[#e1dbd0] bg-[#faf9f6] p-6 shadow-sm transition sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf3ed]">
                    <Pill className="h-6 w-6 text-[#5f8f70]" />
                  </div>

                  <div>
                    <p className="font-semibold text-[#3f3b36]">
                      {medication.name}
                    </p>
                    <p className="mt-1 text-sm text-[#81796f]">
                      {medication.dosage}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-[#5f8f70]">
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {medication.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {medication.frequency}
                      </span>
                    </div>
                    {medication.instructions && (
                      <p className="mt-2 text-xs text-[#81796f]">
                        <strong>Instructions:</strong>{" "}
                        {medication.instructions}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openEditForm(medication)}
                    disabled={deletingId === medication.id}
                    className="flex items-center gap-2 rounded-xl border border-[#c8d0c4] bg-white px-4 py-2 text-sm font-medium text-[#5f8f70] transition hover:border-[#8caf98] hover:bg-[#f0f5f1] disabled:opacity-50"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>

                  {confirmDeleteId === medication.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => confirmDelete(medication.id)}
                        disabled={deletingId === medication.id}
                        className="rounded-xl bg-[#b86b58] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#a05a48] disabled:opacity-70"
                      >
                        {deletingId === medication.id
                          ? "Removing..."
                          : "Confirm?"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelDelete}
                        className="rounded-xl border border-[#d8d0c2] bg-white px-4 py-2 text-sm font-medium text-[#554f48] transition hover:border-[#c8c0b4]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => beginDelete(medication.id)}
                      disabled={deletingId !== null}
                      className="flex items-center gap-2 rounded-xl border border-[#e5c0b8] bg-white px-4 py-2 text-sm font-medium text-[#b86b58] transition hover:border-[#d8a497] hover:bg-[#fdf1ee] disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}