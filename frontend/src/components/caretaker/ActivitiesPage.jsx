import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  ImagePlus,
  ListPlus,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { api } from "../../api";

const ACTIVITY_TYPES = [
  { id: "family_tree", label: "Family Tree", hint: "Family members with photos" },
  { id: "family_memory", label: "Family & People", hint: "Remember familiar faces" },
  { id: "places", label: "Places", hint: "Familiar places at home or nearby" },
  { id: "objects", label: "Objects", hint: "Everyday objects with photos" },
  { id: "routine", label: "Daily Routine", hint: "Order the steps of a familiar routine" },
  { id: "personal_info", label: "My Details", hint: "Phone number, house number, names" },
];

const QUESTION_TYPES = [
  { id: "mcq", label: "Choose the answer (photo question)" },
  { id: "text", label: "Type the answer" },
  { id: "routine", label: "Daily Routine (arrange steps)" },
];

const EMPTY_MCQ = { question_type: "mcq", question_text: "", options: ["", "", "", ""], correct_answer: "", image_url: "", audio_url: "", metadata: { normalize: "text" } };
const EMPTY_TEXT = { question_type: "text", question_text: "", options: [], correct_answer: "", image_url: "", audio_url: "", metadata: { normalize: "text" } };
const EMPTY_ROUTINE = { question_type: "routine", question_text: "", options: [], correct_answer: [], image_url: "", audio_url: "", metadata: {} };

export default function ActivitiesPage({ onNavigate }) {
  const [patients, setPatients] = useState([]);
  const [patientEmail, setPatientEmail] = useState("");
  const [activities, setActivities] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [detail, setDetail] = useState({ activity: null, questions: [] });
  const [results, setResults] = useState({ results: [] });
  const [view, setView] = useState("questions");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newActivity, setNewActivity] = useState({ activity_type: "family_memory", title: "", notes: "" });
  const [newQuestion, setNewQuestion] = useState(EMPTY_MCQ);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get("/caretaker/report").then((data) => {
      if (!cancelled) {
        const list = Array.isArray(data?.patients) ? data.patients : [];
        setPatients(list);
        if (list.length === 1) setPatientEmail(list[0]?.email || "");
      }
    }).catch(() => setPatients([])).finally(() => setLoading(false));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!patientEmail) {
        await Promise.resolve();
        if (!cancelled) {
          setActivities([]);
          setSelectedActivityId("");
          setDetail({ activity: null, questions: [] });
          setResults({ results: [] });
        }
        return;
      }
      try {
        const data = await api.get(`/caretaker/activities?patient_email=${encodeURIComponent(patientEmail)}`);
        if (!cancelled) {
          const list = Array.isArray(data?.activities) ? data.activities : [];
          setActivities(list);
          if (list.length === 1) setSelectedActivityId(list[0]?.id || "");
        }
      } catch {
        if (!cancelled) setActivities([]);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [patientEmail]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!selectedActivityId) {
        await Promise.resolve();
        if (!cancelled) {
          setDetail({ activity: null, questions: [] });
          setResults({ results: [] });
        }
        return;
      }
      try {
        const data = await api.get(`/caretaker/activities/${selectedActivityId}?patient_email=${encodeURIComponent(patientEmail)}`);
        if (!cancelled) setDetail(data || { activity: null, questions: [] });
      } catch {
        if (!cancelled) setDetail({ activity: null, questions: [] });
      }
      if (showResults) {
        try {
          const data = await api.get(`/caretaker/activities/${selectedActivityId}/results?patient_email=${encodeURIComponent(patientEmail)}`);
          if (!cancelled) setResults(data || { results: [] });
        } catch {
          if (!cancelled) setResults({ results: [] });
        }
      }
    };
    run();
    return () => { cancelled = true; };
  }, [selectedActivityId, patientEmail, showResults]);

  const refreshDetail = async () => {
    if (!selectedActivityId) return;
    const data = await api.get(`/caretaker/activities/${selectedActivityId}?patient_email=${encodeURIComponent(patientEmail)}`);
    setDetail(data || { activity: null, questions: [] });
  };
const createActivity = async (event) => {
    event.preventDefault();
    if (!newActivity.title.trim()) { setError("Please give the activity a title."); return; }
    setSaving(true);
    setError("");
    try {
      const data = await api.post("/caretaker/activities", {
        patient_email: patientEmail,
        activity_type: newActivity.activity_type,
        title: newActivity.title.trim(),
        notes: newActivity.notes.trim(),
      });
      setSuccess("Activity created.");
      setShowCreate(false);
      setNewActivity({ activity_type: "family_memory", title: "", notes: "" });
      const listed = await api.get(`/caretaker/activities?patient_email=${encodeURIComponent(patientEmail)}`);
      setActivities(listed?.activities || []);
      setSelectedActivityId(data?.activity?.id || "");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) { setError(err.message || "Could not create activity."); }
    finally { setSaving(false); }
  };

  const saveQuestion = async (event) => {
    event.preventDefault();
    const q = { ...newQuestion };
    if (!q.question_text.trim()) { setError("Please enter the question."); return; }

    if (q.question_type === "mcq") {
      const options = q.options.map((o) => o.trim());
      if (options.some((o) => !o)) { setError("Please fill in all four options."); return; }
      if (!options.includes(q.correct_answer)) { setError("Please select the correct answer from the options."); return; }
      q.options = options;
    }
    if (q.question_type === "text" && !String(q.correct_answer || "").trim()) { setError("Please enter the correct answer."); return; }
    if (q.question_type === "routine") {
      const steps = q.options.filter((s) => s?.text?.trim());
      if (steps.length < 2) { setError("Please add at least two steps."); return; }
      q.options = steps;
      q.correct_answer = steps.map((s) => s.id);
    }

    setSaving(true);
    setError("");
    try {
      const url = editingQuestionId
        ? `/caretaker/activity-questions/${editingQuestionId}`
        : `/caretaker/activities/${selectedActivityId}/questions`;
      const payload = {
        question_type: q.question_type,
        question_text: q.question_text.trim(),
        options: q.options,
        correct_answer: q.correct_answer,
        image_url: q.image_url,
        audio_url: q.audio_url,
        metadata: q.metadata || {},
      };
      if (editingQuestionId) {
        await api.put(url, payload);
        setSuccess("Question updated.");
      } else {
        await api.post(url, payload);
        setSuccess("Question saved.");
      }
      setShowQuestionForm(false);
      setNewQuestion(EMPTY_MCQ);
      setEditingQuestionId(null);
      await refreshDetail();
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) { setError(err.message || "Could not save the question."); }
    finally { setSaving(false); }
  };

  const deleteQuestion = async (questionId) => {
    const ok = window.confirm("Delete this question?");
    if (!ok) return;
    try {
      await api.delete(`/caretaker/activity-questions/${questionId}`);
      setSuccess("Question removed.");
      await refreshDetail();
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) { setError(err.message || "Could not remove the question."); }
  };

  const startEditQuestion = (question) => {
    if (question.question_type === "text") {
      setNewQuestion({
        question_type: "text",
        question_text: question.question_text,
        options: [],
        correct_answer: question.correct_answer || "",
        image_url: question.image_url || "",
        audio_url: question.audio_url || "",
        metadata: question.metadata || { normalize: "text" },
      });
    } else if (question.question_type === "routine") {
      setNewQuestion({
        question_type: "routine",
        question_text: question.question_text,
        options: question.options || [],
        correct_answer: question.correct_answer || [],
        image_url: question.image_url || "",
        audio_url: question.audio_url || "",
        metadata: question.metadata || {},
      });
    } else {
      setNewQuestion({
        question_type: "mcq",
        question_text: question.question_text,
        options: (question.options || []).length === 4 ? question.options : ["", "", "", ""],
        correct_answer: question.correct_answer || "",
        image_url: question.image_url || "",
        audio_url: question.audio_url || "",
        metadata: question.metadata || {},
      });
    }
    setEditingQuestionId(question.id);
    setShowQuestionForm(true);
  };

  const onQuestionTypeChange = (qtype) => {
    setNewQuestion(qtype === "text" ? EMPTY_TEXT : qtype === "routine" ? EMPTY_ROUTINE : EMPTY_MCQ);
  };

  const onImageFileChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      setError("Only JPEG, PNG, WebP or GIF images are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Images must be 5 MB or smaller.");
      return;
    }
    setError("");
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await api.request("/caretaker/uploads/image", { method: "POST", body: formData });
      setNewQuestion((q) => ({ ...q, image_url: data?.url || "" }));
      setSuccess("Image uploaded.");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError(err.message || "Could not upload the image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteActivity = async (activityId) => {
    const ok = window.confirm("Delete this activity and all of its questions?");
    if (!ok) return;
    try {
      await api.delete(`/caretaker/activities/${activityId}`);
      setSuccess("Activity deleted.");
      setSelectedActivityId("");
      const listed = await api.get(`/caretaker/activities?patient_email=${encodeURIComponent(patientEmail)}`);
      setActivities(listed?.activities || []);
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) { setError(err.message || "Could not delete the activity."); }
  };
return (
    <main className="min-h-screen bg-[#faf8f3] text-[#3f3b36]">
      <header className="border-b border-[#e6e0d6] bg-[#fffdf9]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5f8f70] text-white shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#3f3b36]">CODE<span className="text-[#5f8f70]">-1</span></p>
              <p className="text-xs text-[#81796f]">Personalized Activities</p>
            </div>
          </div>
          <button onClick={() => onNavigate?.("/caretaker")} className="flex items-center gap-2 rounded-full border border-[#d8d0c2] bg-[#faf9f6] px-4 py-2 text-sm font-medium text-[#5f8f70] transition hover:border-[#8caf98] hover:bg-[#f0f5f1]">
            <ArrowLeft className="h-4 w-4" /> Caretaker Dashboard
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-[#e5ded3] bg-gradient-to-br from-[#f6f0e7] via-[#faf7f1] to-[#eef4ec] p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-[#5f8f70]" />
            <span className="text-sm font-medium uppercase tracking-widest text-[#5f8f70]">Activities</span>
          </div>
          <h1 className="mt-5 text-4xl font-semibold text-[#3f3b36] sm:text-5xl">Create activities for your patient</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#756f65]">
            Build personalized memory questions — familiar faces, places, objects,
            routines — so your elder can practice recalling daily life.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        )}
        {success && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            <CheckCircle2 className="h-5 w-5" /> {success}
          </div>
        )}
        {loading && (
          <div className="mt-6 rounded-2xl border border-[#e5ded3] bg-white px-4 py-3 text-[#756f65]">
            Loading your patients…
          </div>
        )}

        {/* Patient + activity selector */}
        <div className="mt-8 grid gap-5 rounded-3xl border border-[#e5ded3] bg-white p-6 shadow-sm sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-[#554f48]">Patient</label>
            <select value={patientEmail} onChange={(e) => { setPatientEmail(e.target.value); setSelectedActivityId(""); }} className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-lg text-[#3f3b36] outline-none focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]">
              <option value="">Select a patient…</option>
              {patients.map((p) => (
                <option key={p.email || p.username} value={p.email || p.username}>
                  {p.full_name || p.email || p.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-[#554f48]">Activity</label>
            <select value={selectedActivityId} onChange={(e) => setSelectedActivityId(e.target.value)} className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-lg text-[#3f3b36] outline-none focus:border-[#7ba287] focus:ring-2 focus:ring-[#dce9df]">
              <option value="">Select an activity…</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.question_count} questions)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-end gap-2">
            <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 rounded-full bg-[#5f8f70] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4d7a5e]">
              <Plus className="h-5 w-5" /> New Activity
            </button>
          </div>
        </div>
{showCreate && (
          <form onSubmit={createActivity} className="mt-6 rounded-3xl border border-[#e5ded3] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#3f3b36]">Create a new activity</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl p-2 text-[#81796f] hover:bg-[#f0ede7]"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-[#554f48]">Activity type</label>
                <select value={newActivity.activity_type} onChange={(e) => setNewActivity({ ...newActivity, activity_type: e.target.value })} className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none focus:border-[#7ba287]">
                  {ACTIVITY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <p className="mt-1 text-xs text-[#81796f]">{ACTIVITY_TYPES.find((t) => t.id === newActivity.activity_type)?.hint || ""}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#554f48]">Title</label>
                <input type="text" value={newActivity.title} onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })} placeholder="e.g. Family & Memory" className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none focus:border-[#7ba287]" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-[#554f48]">Notes (optional)</label>
                <input type="text" value={newActivity.notes} onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })} placeholder="A short note you want your elder to see" className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none focus:border-[#7ba287]" />
              </div>
              <div className="sm:col-span-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl px-5 py-3 text-sm font-medium text-[#81796f] hover:bg-[#f0ede7]">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-full bg-[#5f8f70] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#4d7a5e] disabled:cursor-not-allowed disabled:opacity-70">{saving ? "Saving…" : "Create Activity"}</button>
              </div>
            </div>
          </form>
        )}

        {selectedActivityId && (
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <button onClick={() => { setView("questions"); setShowResults(false); }} className={`rounded-full px-4 py-2 text-sm font-medium ${view === "questions" ? "bg-[#5f8f70] text-white" : "border border-[#ddd5c8] bg-white text-[#554f48]"}`}>Questions</button>
                <button onClick={() => { setView("results"); setShowResults(true); }} className={`rounded-full px-4 py-2 text-sm font-medium ${view === "results" ? "bg-[#5f8f70] text-white" : "border border-[#ddd5c8] bg-white text-[#554f48]"}`}>Results</button>
              </div>
              {view === "questions" && (
                <button onClick={() => { setEditingQuestionId(null); setNewQuestion(EMPTY_MCQ); setShowQuestionForm(!showQuestionForm); }} className="flex items-center gap-2 rounded-full border-2 border-[#5f8f70] bg-white px-4 py-2 text-sm font-medium text-[#5f8f70] transition hover:bg-[#f0f5f1]">
                  <Plus className="h-4 w-4" /> Add Question
                </button>
              )}
              {detail.activity && (
                <button onClick={() => deleteActivity(detail.activity.id)} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" /> Delete Activity
                </button>
              )}
            </div>

            {detail.activity && view === "questions" && (
              <p className="mt-3 text-sm text-[#81796f]">
                {detail.activity.title} — {detail.activity.activity_type_label} — {detail.questions.length} questions
              </p>
            )}
{showQuestionForm && view === "questions" && (
              <form onSubmit={saveQuestion} className="mt-6 rounded-3xl border border-[#e5ded3] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-[#3f3b36]">{editingQuestionId ? "Edit question" : "Add a question"}</h2>
                  <button type="button" onClick={() => { setShowQuestionForm(false); setEditingQuestionId(null); }} className="rounded-xl p-2 text-[#81796f] hover:bg-[#f0ede7]"><X className="h-5 w-5" /></button>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-[#554f48]">Question type</label>
                    <select value={newQuestion.question_type} disabled={Boolean(editingQuestionId)} onChange={(e) => onQuestionTypeChange(e.target.value)} className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none focus:border-[#7ba287]">
                      {QUESTION_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#554f48]">Question</label>
                    <input type="text" value={newQuestion.question_text} onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })} placeholder={newQuestion.question_type === "mcq" ? "Who is this person?" : newQuestion.question_type === "text" ? "What is your phone number?" : "Morning Routine"} className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none focus:border-[#7ba287]" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-[#554f48]">Photo (optional)</label>
                    <div className="mt-2 flex flex-wrap items-start gap-4">
                      {newQuestion.image_url && (
                        <div className="relative shrink-0">
                          <img src={newQuestion.image_url} alt="Question preview" className="h-24 w-24 rounded-2xl border border-[#e5ded3] object-cover" />
                          <button type="button" onClick={() => setNewQuestion({ ...newQuestion, image_url: "" })} className="absolute -right-2 -top-2 rounded-full bg-[#b23a3a] p-1 text-white shadow-sm hover:bg-[#9a3030]"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                      <div className="min-w-[220px] flex-1 space-y-2">
                        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-[#5f8f70] bg-white px-4 py-2 text-sm font-medium text-[#5f8f70] hover:bg-[#f0f5f1] ${uploadingImage ? "cursor-wait opacity-70" : ""}`}>
                          <ImagePlus className="h-4 w-4" /> {uploadingImage ? "Uploading…" : "Upload photo"}
                          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" disabled={uploadingImage} onChange={onImageFileChange} />
                        </label>
                        <p className="text-xs text-[#81796f]">JPEG, PNG, WebP or GIF — up to 5 MB.</p>
                        <input type="text" value={newQuestion.image_url} onChange={(e) => setNewQuestion({ ...newQuestion, image_url: e.target.value })} placeholder="…or paste an image URL" className="w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-2.5 text-sm text-[#3f3b36] outline-none focus:border-[#7ba287]" />
                      </div>
                    </div>
                  </div>
{newQuestion.question_type === "mcq" && (
                    <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
                      {[0, 1, 2, 3].map((idx) => (
                        <div key={idx}>
                          <label className="text-sm font-medium text-[#554f48]">Option {idx + 1}</label>
                          <input type="text" value={newQuestion.options[idx] || ""} onChange={(e) => { const options = [...newQuestion.options]; options[idx] = e.target.value; setNewQuestion({ ...newQuestion, options }); }} placeholder="e.g. Grandfather" className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none focus:border-[#7ba287]" />
                        </div>
                      ))}
                      <div>
                        <label className="text-sm font-medium text-[#554f48]">Correct answer</label>
                        <select value={newQuestion.correct_answer} onChange={(e) => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })} className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none focus:border-[#7ba287]">
                          <option value="">Select…</option>
                          {newQuestion.options.filter((o) => o?.trim()).map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {newQuestion.question_type === "text" && (
                    <div>
                      <label className="text-sm font-medium text-[#554f48]">Correct answer</label>
                      <input type="text" value={newQuestion.correct_answer} onChange={(e) => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })} placeholder="e.g. 9876543210" className="mt-2 w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none focus:border-[#7ba287]" />
                      <p className="mt-1 text-xs text-[#81796f]">Spaces, dashes and +91 prefixes are ignored when comparing phone numbers.</p>
                    </div>
                  )}

                  {newQuestion.question_type === "routine" && (
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-[#554f48]">Steps (in the correct order)</label>
                      <div className="mt-4 space-y-3">
                        {newQuestion.options.map((step, idx) => (
                          <div key={step.id} className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8efe9] text-sm font-semibold text-[#5f8f70]">{idx + 1}</span>
                            <input type="text" value={step.text} onChange={(e) => { const options = [...newQuestion.options]; options[idx] = { ...step, text: e.target.value }; setNewQuestion({ ...newQuestion, options }); }} placeholder={`Step ${idx + 1}`} className="w-full rounded-xl border border-[#ddd5c8] bg-white px-4 py-3 text-[#3f3b36] outline-none focus:border-[#7ba287]" />
                            {newQuestion.options.length > 1 && (
                              <button type="button" onClick={() => { const options = newQuestion.options.filter((_, i) => i !== idx); setNewQuestion({ ...newQuestion, options }); }} className="rounded-xl p-2 text-[#b23a3a] hover:bg-red-50"><X className="h-4 w-4" /></button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => { const maxIdx = newQuestion.options.reduce((m, s) => Math.max(m, parseInt(String(s.id?.replace("step-", "") || "0", 10)), 0), 0); setNewQuestion({ ...newQuestion, options: [...newQuestion.options, { id: `step-${maxIdx + 1}`, text: "" }] }); }} className="mt-3 flex items-center gap-2 rounded-full border-2 border-[#5f8f70] bg-white px-4 py-2 text-sm font-medium text-[#5f8f70] hover:bg-[#f0f5f1]">
                        <Plus className="h-4 w-4" /> Add step
                      </button>
                    </div>
                  )}

                  <div className="sm:col-span-2 flex items-center justify-end gap-2">
                    <button type="button" onClick={() => { setShowQuestionForm(false); setEditingQuestionId(null); }} className="rounded-xl px-5 py-3 text-sm font-medium text-[#81796f] hover:bg-[#f0ede7]">Cancel</button>
                    <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-full bg-[#5f8f70] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#4d7a5e] disabled:cursor-not-allowed disabled:opacity-70">
                      <Save className="h-4 w-4" /> {saving ? "Saving…" : editingQuestionId ? "Update Question" : "Save Question"}
                    </button>
                  </div>
                </div>
              </form>
            )}
{view === "questions" && (
              <div className="mt-6 space-y-4">
                {detail.questions.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#ddd5c8] bg-white p-10 text-center">
                    <ListPlus className="mx-auto h-10 w-10 text-[#b3aca1]" />
                    <p className="mt-4 text-lg font-medium text-[#554f48]">No questions yet</p>
                    <p className="mt-1 text-sm text-[#81796f]">Add questions so your elder can practice this activity.</p>
                  </div>
                ) : (
                  detail.questions.map((question) => (
                    <div key={question.id} className="rounded-2xl border border-[#e5ded3] bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-[#3f3b36]">{question.question_text}</p>
                          <p className="mt-1 text-sm text-[#81796f]">
                            {question.question_type === "mcq" ? "Photo choice" : question.question_type === "text" ? "Type answer" : "Daily routine"}
                            {question.image_url && " · image"}
                          </p>
                          {question.image_url && (
                            <img src={question.image_url} alt="" className="mt-3 h-20 w-20 rounded-xl border border-[#e5ded3] object-cover" />
                          )}
                          {question.question_type === "mcq" && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(question.options || []).map((o) => (
                                <span key={o} className={`rounded-full px-3 py-1 text-sm font-medium ${o === question.correct_answer ? "bg-green-100 text-green-700" : "bg-[#f0ede7] text-[#81796f]"}`}>{o}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button onClick={() => startEditQuestion(question)} className="rounded-xl p-2 text-[#5f8f70] hover:bg-[#f0f5f1]"><Pencil className="h-5 w-5" /></button>
                          <button onClick={() => deleteQuestion(question.id)} className="rounded-xl p-2 text-[#b23a3a] hover:bg-red-50"><Trash2 className="h-5 w-5" /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {view === "results" && (
              <div className="mt-6 space-y-4">
                {results.results.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#ddd5c8] bg-white p-10 text-center">
                    <Activity className="mx-auto h-10 w-10 text-[#b3aca1]" />
                    <p className="mt-4 text-lg font-medium text-[#554f48]">No completed sessions yet</p>
                    <p className="mt-1 text-sm text-[#81796f]">When your elder finishes this activity, results will show up here.</p>
                  </div>
                ) : (
                  results.results.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e5ded3] bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-4">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8efe9] text-xl font-bold text-[#5f8f70]">{r.score ?? "—"}</span>
                        <div>
                          <p className="text-lg font-semibold text-[#3f3b36]">{r.correct_count} / {r.total_questions}</p>
                          <p className="text-sm text-[#81796f]">{r.completed_at ? new Date(r.completed_at).toLocaleString() : ""}</p>
                        </div>
                      </div>
                      <p className="text-sm text-[#81796f]">{r.duration_seconds ? `${Math.round(r.duration_seconds / 60)} min ${r.duration_seconds % 60} sec` : ""}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}