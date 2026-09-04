import { useEffect, useMemo, useState } from "react";
import { Pill, Clock, CalendarDays } from "lucide-react";

import { api } from "../../api";
import PatientNavigation from "./PatientNavigation";

/**
 * Patient-facing medicines page.
 *
 * Patients only VIEW the medicines assigned by their caretaker. All add / edit /
 * delete management happens on the caretaker side, so this page intentionally
 * has no management controls.
 */
export default function Medications({ onNavigate }) {
  const navigate = useMemo(
    () =>
      onNavigate ??
      ((nextPath) => {
        window.location.href = nextPath;
      }),
    [onNavigate]
  );

  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/logsign");
      return;
    }

    const loadMedications = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await api.get("/patient/medications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMedications(
          Array.isArray(data?.medications) ? data.medications : []
        );
      } catch {
        setError("We couldn't load the medicines.");
      } finally {
        setLoading(false);
      }
    };

    loadMedications();
  }, [navigate]);

  return (
    <div
      className="min-h-screen bg-[#FBF8F2] text-[#20261F]"
      style={{
        fontFamily: "Verdana, Tahoma, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <PatientNavigation onNavigate={navigate} activePage="medications" />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <section className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F7E2DF] text-[#B23A3A]">
            <Pill className="h-10 w-10" />
          </div>

          <h1 className="mt-5 text-4xl font-bold">Your Medicines</h1>

          <p className="mx-auto mt-3 max-w-2xl text-lg text-[#5B6459]">
            The medicines below are set up for you by your caretaker.
          </p>
        </section>

        {error && (
          <div
            className="mt-6 rounded-2xl border-2 border-[#E5B1B1] bg-[#FFF0F0] px-5 py-4 text-center font-semibold text-[#7A2A2A]"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="mt-8" aria-label="My medicines">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Your Medicines</h2>

            <span className="rounded-full bg-[#F3E7D0] px-4 py-2 font-bold text-[#8A4E12]">
              {medications.length}
            </span>
          </div>

          {loading ? (
            <div className="rounded-3xl border-2 border-[#E4DCC8] bg-[#EFEEE6] p-8 text-center text-lg font-semibold">
              Loading your medicines...
            </div>
          ) : medications.length === 0 ? (
            <div className="rounded-3xl border-2 border-[#E4DCC8] bg-[#EFEEE6] p-8 text-center">
              <Pill className="mx-auto h-12 w-12 text-[#B23A3A]" />

              <h3 className="mt-4 text-2xl font-bold">No medicines yet</h3>

              <p className="mt-2 text-lg text-[#5B6459]">
                Your caretaker will add your medicines here for you.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {medications.map((medication) => (
                <article
                  key={medication.id}
                  className="rounded-3xl border-2 border-[#E4DCC8] bg-[#EFEEE6] p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F7E2DF] text-[#B23A3A]">
                      <Pill className="h-7 w-7" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-2xl font-bold">{medication.name}</h3>

                      <p className="mt-1 text-lg font-semibold text-[#5B6459]">
                        {medication.dosage}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3 text-base font-semibold">
                        <span className="flex items-center gap-2 rounded-full bg-white px-3 py-2">
                          <Clock className="h-5 w-5 text-[#2F6F62]" />
                          {medication.time}
                        </span>

                        <span className="flex items-center gap-2 rounded-full bg-white px-3 py-2">
                          <CalendarDays className="h-5 w-5 text-[#8A4E12]" />
                          {medication.frequency}
                        </span>
                      </div>

                      {medication.instructions && (
                        <p className="mt-3 text-base text-[#5B6459]">
                          <strong>Instructions:</strong>{" "}
                          {medication.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}