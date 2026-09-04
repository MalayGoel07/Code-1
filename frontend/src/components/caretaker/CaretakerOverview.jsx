import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  Clock3,
  FileText,
  Settings,
  User,
  Users,
} from "lucide-react";

import { api } from "../../api";
import PatientLinkManager from "./PatientLinkManager";

const QUICK_ACTIONS = [
  {
    id: "report",
    icon: FileText,
    title: "Elder Care Report",
    text: "View activity, engagement, and care insights.",
  },
  {
    id: "reminders",
    icon: Bell,
    title: "Reminders",
    text: "Create and manage daily reminders for your elder.",
  },
  {
    id: "help",
    icon: Bot,
    title: "AI Helpbot",
    text: "Get guidance and support for caregiving.",
  },
  {
    id: "profile",
    icon: User,
    title: "Profile",
    text: "Manage your caretaker account and details.",
  },
  {
    id: "settings",
    icon: Settings,
    title: "Settings",
    text: "Customize your preferences and notifications.",
  },
];

const getStoredName = () => {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("user_full_name") ||
    window.localStorage.getItem("full_name") ||
    ""
  );
};

export default function CaretakerOverview({ onNavigateTab }) {
  const [patients, setPatients] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name] = useState(getStoredName);

  useEffect(() => {
    let cancelled = false;

    api
      .get("/caretaker/report")
      .then((data) => {
        if (!cancelled) {
          setPatients(Array.isArray(data?.patients) ? data.patients : []);
        }
      })
      .catch(() => {
        if (!cancelled) setPatients([]);
      });

    api
      .get("/caretaker/link-requests")
      .then((data) => {
        if (!cancelled) {
          setPending(Array.isArray(data?.requests) ? data.requests : []);
        }
      })
      .catch(() => {
        if (!cancelled) setPending([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = name.trim().split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#4F7D73]">
        Caregiver space
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-[#303735] sm:text-4xl">
        {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-[#64706C]">
        Here's a snapshot of the elders under your care, and everything you need
        to look after them.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#DED9CD] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4F7D73]">
            Patients under you
          </p>
          <p className="mt-3 text-4xl font-semibold text-[#303735]">
            {loading ? "…" : String(patients.length).padStart(2, "0")}
          </p>
          <p className="mt-1 text-sm text-[#7A817D]">Linked elders</p>
        </div>
        <div className="rounded-2xl border border-[#DED9CD] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#B98A3C]">
            Pending approvals
          </p>
          <p className="mt-3 text-4xl font-semibold text-[#303735]">
            {loading ? "…" : String(pending.length).padStart(2, "0")}
          </p>
          <p className="mt-1 text-sm text-[#7A817D]">Awaiting patient approval</p>
        </div>
        <div className="rounded-2xl border border-[#DED9CD] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4F7D73]">
            Care tools
          </p>
          <p className="mt-3 text-4xl font-semibold text-[#303735]">05</p>
          <p className="mt-1 text-sm text-[#7A817D]">Ready in the sidebar</p>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#4F7D73]" />
          <h2 className="text-xl font-semibold text-[#303735]">
            Patients under you
          </h2>
        </div>
        {loading ? (
          <p className="mt-4 text-sm text-[#7A817D]">Loading your elders…</p>
        ) : patients.length === 0 ? (
          <p className="mt-4 text-sm text-[#7A817D]">
            No elders linked yet. Send a link request below — once your patient
            approves it, they'll appear here.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {patients.map((patient) => (
              <div
                key={patient.email || patient.username}
                className="flex items-center gap-3 rounded-2xl border border-[#DED9CD] bg-white p-4 shadow-sm"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8EFE9] text-base font-semibold text-[#4F7D73]">
                  {(patient.full_name || patient.email || patient.username || "?")
                    .charAt(0)
                    .toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#303735]">
                    {patient.full_name || patient.email || patient.username}
                  </p>
                  <p className="truncate text-sm text-[#7A817D]">
                    {patient.email}
                  </p>
                </div>
                <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-[#4F7D73]" />
              </div>
            ))}
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-[#B98A3C]" />
            <h2 className="text-xl font-semibold text-[#303735]">
              Awaiting approval
            </h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pending.map((request) => (
              <div
                key={request.patient_email}
                className="flex items-center gap-3 rounded-2xl border border-[#E5D9BD] bg-[#FDF8EC] p-4"
              >
                <Clock3 className="h-5 w-5 shrink-0 text-[#B98A3C]" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#303735]">
                    {request.patient_name || request.patient_email}
                  </p>
                  <p className="truncate text-sm text-[#7A817D]">
                    {request.patient_email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-[#303735]">Jump back in</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map(({ id, icon: Icon, title, text }) => (
            <button
              key={id}
              onClick={() => onNavigateTab?.(id)}
              className="group rounded-2xl border border-[#DED9CD] bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#A9BFB5] hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8E6DC]">
                  <Icon className="h-5 w-5 text-[#4F7D73]" />
                </span>
                <ArrowRight className="h-4 w-4 text-[#4F7D73] opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
              </div>
              <p className="mt-4 font-semibold text-[#303735]">{title}</p>
              <p className="mt-1 text-sm text-[#7A817D]">{text}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-[#303735]">
          Connect a patient
        </h2>
        <p className="mt-1 text-sm text-[#7A817D]">
          Send a link request by email. Once approved, the patient is added to
          your care list.
        </p>
        <PatientLinkManager showLists={false} />
      </div>
    </div>
  );
}