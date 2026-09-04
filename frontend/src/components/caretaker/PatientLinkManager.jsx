import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Mail,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";

import { api } from "../../api";

/**
 * Caretaker-facing patient linking.
 *
 * The caretaker enters a patient email and sends a link request. The patient
 * approves or declines it from their Profile page. Once approved, the patient is
 * linked (via the existing `caregiver_email` field) and the caretaker can manage
 * their reminders and medicines.
 */
export default function PatientLinkManager({ showLists = true }) {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("access_token")
      : null;

  const [patientEmail, setPatientEmail] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [linkedPatients, setLinkedPatients] = useState([]);
  const [sending, setSending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!token) return;

    api
      .get("/caretaker/link-requests", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((data) => {
        setPendingRequests(Array.isArray(data?.requests) ? data.requests : []);
      })
      .catch(() => setPendingRequests([]));

    api
      .get("/caretaker/report", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((data) => {
        setLinkedPatients(Array.isArray(data?.patients) ? data.patients : []);
      })
      .catch(() => setLinkedPatients([]));
  }, [token, refreshKey]);
const sendRequest = async () => {
    const email = patientEmail.trim();
    if (!email) {
      setMessage({
        type: "error",
        text: "Please enter the patient's email address.",
      });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const data = await api.post(
        "/caretaker/link-request",
        { patient_email: email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: "success", text: data?.message || "Link request sent." });
      setPatientEmail("");
      setRefreshKey((key) => key + 1);
    } catch (err) {
      const raw = err?.message || "We couldn't send the request.";
      const text =
        raw === "Failed to fetch"
          ? "We couldn't reach the server. Please try again."
          : raw;
      setMessage({ type: "error", text });
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async (email) => {
    setIsCancelling(true);
    setMessage(null);

    try {
      await api.delete(
        `/caretaker/link-request/${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: "success", text: "Link request cancelled." });
      setRefreshKey((key) => key + 1);
    } catch {
      setMessage({
        type: "error",
        text: "We couldn't cancel that request. Please try again.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <section
      className="mt-12 rounded-3xl border border-[#e3dccf] bg-[#faf9f6] p-7 shadow-sm"
      aria-labelledby="patient-link-heading"
    >
      <div>
        <div className="flex items-center gap-3">
          <UserRound className="h-6 w-6 text-[#5f8f70]" />
          <span className="text-sm font-medium uppercase tracking-widest text-[#5f8f70]">
            Care circle
          </span>
        </div>
        <h2
          id="patient-link-heading"
          className="mt-4 text-2xl font-semibold text-[#3f3b36]"
        >
          Link a Patient
        </h2>
        <p className="mt-2 text-sm text-[#81796f]">
          Enter a patient&apos;s email to send a link request. Once they accept,
          you can manage their reminders and medicines.
        </p>
      </div>

      {message && (
        <p
          className={`mt-5 rounded-xl px-4 py-3 text-sm ${
            message.type === "error"
              ? "bg-[#fde8e5] text-[#a04a3a]"
              : "bg-[#e8f2ea] text-[#3f6f4f]"
          }`}
          role={message.type === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#d8d0c2] bg-white px-3 py-2">
          <Mail className="h-4 w-4 shrink-0 text-[#a79f94]" aria-hidden="true" />
          <input
            type="email"
            value={patientEmail}
            onChange={(event) => setPatientEmail(event.target.value)}
            placeholder="patient@example.com"
            aria-label="Patient email"
            className="w-full bg-transparent text-sm text-[#3f3b36] outline-none placeholder:text-[#a79f94]"
          />
        </div>

        <button
          type="button"
          onClick={sendRequest}
          disabled={sending || !token}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#5f8f70] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4d7a5e] disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {sending ? "Sending..." : "Send Request"}
        </button>
      </div>
      {showLists && pendingRequests.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-[#81796f]">
            Awaiting patient approval
          </h3>
          <ul className="mt-3 space-y-2">
            {pendingRequests.map((request) => (
              <li
                key={request.patient_email}
                className="flex flex-col gap-3 rounded-xl border border-[#e1dbd0] bg-[#faf9f6] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4efe4] text-[#a47a50]">
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#3f3b36]">
                      {request.patient_name || request.patient_email}
                    </p>
                    <p className="truncate text-xs text-[#81796f]">
                      {request.patient_email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCancel(request.patient_email)}
                  disabled={isCancelling}
                  className="flex items-center gap-1 self-start rounded-lg border border-[#e5c0b8] bg-white px-3 py-1.5 text-xs font-medium text-[#b86b58] transition hover:bg-[#fdf1ee] disabled:opacity-60 sm:self-auto"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  {isCancelling ? "Cancelling..." : "Cancel Request"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showLists && linkedPatients.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-[#81796f]">Linked patients</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {linkedPatients.map((patient) => (
              <li
                key={patient.email || patient.username}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-[#e3dccf] bg-[#faf9f6] px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf3ed] text-[#5f8f70]">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#3f3b36]">
                    {patient.full_name || patient.email || patient.username}
                  </p>
                  <p className="truncate text-xs text-[#81796f]">
                    {patient.email}
                  </p>
                </div>
                <CheckCircle2
                  className="ml-auto h-4 w-4 shrink-0 text-[#5f8f70]"
                  aria-hidden="true"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}