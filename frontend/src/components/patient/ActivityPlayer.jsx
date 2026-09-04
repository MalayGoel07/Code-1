import { useEffect, useState } from "react";

import {

  ArrowLeft,

  ArrowDown,

  ArrowUp,

  CheckCircle2,

  XCircle,

} from "lucide-react";



import { api } from "../../api";

import PatientNavigation from "./PatientNavigation";



export default function ActivityPlayer({ onNavigate, activityId }) {

  const navigate = onNavigate ?? ((nextPath) => {

    window.history.pushState({}, "", nextPath);

    window.dispatchEvent(new PopStateEvent("popstate"));

  });



  const [loading, setLoading] = useState(Boolean(activityId));

  const [error, setError] = useState(activityId ? "" : "No activity selected.");

  const [activity, setActivity] = useState(null);

  const [session, setSession] = useState(null);

  const [questions, setQuestions] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [feedback, setFeedback] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const [result, setResult] = useState(null);

  const [routineOrder, setRoutineOrder] = useState([]);

  const [textAnswer, setTextAnswer] = useState("");



  useEffect(() => {

    let cancelled = false;

    if (!activityId) {

      return undefined;



    }

    api

      .get(`/patient/activities/${activityId}`)

      .then((data) => {

        if (!cancelled) {

          setActivity(data?.activity || null);

        }

      })

      .catch((err) => setError(err.message || "Could not load the activity."))

      .finally(() => setLoading(false));

    return () => { cancelled = true; };

  }, [activityId]);



  const startSession = async () => {

    setLoading(true);

    setError("");

    try {

      const data = await api.post(`/patient/activities/${activityId}/start`);

      setSession(data?.session || null);

      setQuestions(Array.isArray(data?.questions) ? data.questions : []);

      setCurrentIndex(0);

      setFeedback(null);

      setResult(null);

      setTextAnswer("");

      const fresh = (data?.questions || []).filter(

        (q) => q.question_type === "routine"

      );

      if (fresh.length) {

        setRoutineOrder(fresh[0].steps?.map((s) => s.id) || []);

      }

    } catch (err) {

      setError(err.message || "Could not start the activity.");

    } finally {

      setLoading(false);

    }

  };



  const currentQuestion = questions[currentIndex];



  const submitAnswer = async (answer) => {

    if (!session || !currentQuestion) return;

    if (submitting) return;

    setSubmitting(true);

    setError("");

    try {

      const data = await api.post(

        `/patient/activity-sessions/${session.id}/answer`,

        { question_id: currentQuestion.id, answer }

      );

      const isCorrect = data?.correct === true;

      setFeedback({

        correct: isCorrect,

        message: isCorrect

          ? "That's right!"

          : "That's okay. Let's try the next one.",

      });

    } catch (err) {

      setError(err.message || "Could not save your answer.");

    } finally {

      setSubmitting(false);

    }

  };



  const submitText = async (event) => {

    event.preventDefault();

    if (!textAnswer.trim()) return;

    await submitAnswer(textAnswer.trim());

  };



  const moveStep = (index, direction) => {

    setRoutineOrder((current) => {

      const next = [...current];

      const target = index + direction;

      if (target < 0 || target >= next.length) return current;

      [next[index], next[target]] = [next[target], next[index]];

      return next;

    });

  };



  const nextQuestion = () => {

    setFeedback(null);

    setTextAnswer("");

    if (currentIndex < questions.length - 1) {

      setCurrentIndex((i) => i + 1);

    } else {

      completeSession();

    }

  };



  const completeSession = async () => {

    if (!session) return;

    setSubmitting(true);

    try {

      const data = await api.post(

        `/patient/activity-sessions/${session.id}/complete`

      );

      setResult(data?.result || null);

    } catch (err) {

      setError(err.message || "Could not finish the activity.");

    } finally {

      setSubmitting(false);

    }

  };





  if (loading) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-[#FBF8F2]">

        <p className="text-xl font-semibold text-[#20261F]">

          Loading your activity...

        </p>

      </div>

    );

  }



  if (result) {

    return (

      <div className="min-h-screen bg-[#FBF8F2] text-[#20261F] font-sans">

        <PatientNavigation onNavigate={navigate} activePage="games" />

        <main className="mx-auto max-w-2xl px-6 py-12">

          <div className="rounded-3xl border-2 border-[#E4DCC8] bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#E8F0E6]">

              <CheckCircle2 className="h-12 w-12 text-[#2F6F62]" />

            </div>

            <h1 className="mt-6 text-4xl font-bold">Well done!</h1>

            <p className="mt-6 text-6xl font-bold text-[#2F6F62]">

              {result.correct_count} / {result.total_questions}

            </p>

            <p className="mt-3 text-2xl text-[#5B6459]">

              You got {result.correct_count} right.

            </p>

            <button

              type="button"

              onClick={() => navigate("/game")}

              className="mt-10 flex w-full items-center justify-center gap-3 rounded-full bg-[#2F6F62] py-5 text-2xl font-bold text-white shadow-sm active:scale-95"

            >

              Continue

            </button>

          </div>

        </main>

      </div>

    );

  }



  if (!session) {

    return (

      <div className="min-h-screen bg-[#FBF8F2] text-[#20261F] font-sans">

        <PatientNavigation onNavigate={navigate} activePage="games" />

        <main className="mx-auto max-w-2xl px-6 py-12">

          <button

            type="button"

            onClick={() => navigate("/game")}

            className="flex items-center gap-2 rounded-full border-2 border-[#E4DCC8] bg-white px-4 py-2 text-lg font-semibold text-[#5B6459]"

          >

            <ArrowLeft className="h-5 w-5" /> Back to Games

          </button>

          <div className="mt-8 rounded-3xl border-2 border-[#E4DCC8] bg-white p-10 text-center shadow-sm">

            <h1 className="text-4xl font-bold">

              {activity?.title || "Start the activity"}

            </h1>

            {activity?.notes && (

              <p className="mt-4 text-xl text-[#5B6459]">{activity.notes}</p>

            )}

            {error && (<p className="mt-6 text-xl text-[#B23A3A]">{error}</p>)}

            <p className="mt-6 text-xl text-[#5B6459]">

              You will get up to 5 questions each time you play.

            </p>

            <button

              type="button"

              onClick={startSession}

              className="mt-10 w-full rounded-full bg-[#2F6F62] py-5 text-2xl font-bold text-white shadow-sm active:scale-95"

            >

              Start

            </button>

          </div>

        </main>

      </div>

    );

  }



  const progress = questions.length

    ? `Question ${currentIndex + 1} of ${questions.length}`

    : "";



  const renderMCQ = () => (

    <div className="space-y-4">

      {currentQuestion.image_url && (

        <div className="mb-6">

          <img

            src={currentQuestion.image_url}

            alt="Question illustration"

            className="mx-auto max-h-56 w-full max-w-sm rounded-2xl object-contain"

            loading="lazy"

          />

        </div>

      )}

      {currentQuestion.audio_url && (

        <div className="flex justify-center">

          <audio controls className="w-full max-w-xs">

            <source src={currentQuestion.audio_url} type="audio/mpeg" />

          </audio>

        </div>

      )}

      <p className="text-center text-2xl font-bold leading-snug text-[#20261F]">

        {currentQuestion.question_text}

      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">

        {(currentQuestion.options || []).map((option, idx) => (

          <button

            key={idx}

            type="button"

            disabled={!!feedback || submitting}

            onClick={() => submitAnswer(option)}

            className="flex min-h-[72px] items-center justify-center rounded-2xl border-2 border-[#CEDFCA] bg-white px-4 py-3 text-center text-lg font-semibold text-[#303735] shadow-sm hover:border-[#2F6F62] hover:bg-[#F0F5F1] hover:text-[#1E4D3E] active:scale-[0.98] disabled:opacity-50"

          >

            {option}

          </button>

        ))}

      </div>

    </div>

  );



  const renderText = () => (

    <div className="space-y-6">

      <p className="text-center text-2xl font-bold leading-snug text-[#20261F]">

        {currentQuestion.question_text}

      </p>

      {currentQuestion.image_url && (

        <img

          src={currentQuestion.image_url}

          alt="Question illustration"

          className="mx-auto max-h-48 w-full max-w-sm rounded-2xl object-contain"

          loading="lazy"

        />

      )}

      <form onSubmit={submitText} className="mt-6">

        <input

          type="text"

          value={textAnswer}

          onChange={(e) => setTextAnswer(e.target.value)}

          placeholder="Type your answer here"

          disabled={!!feedback || submitting}

          className="w-full rounded-2xl border-2 border-[#CEDFCA] bg-[#FBFAF6] px-5 py-4 text-2xl text-[#20261F] placeholder-[#81796f] shadow-sm outline-none ring-[#2F6F62] focus-within:ring-2"

        />

        <button

          type="submit"

          disabled={!textAnswer.trim() || !!feedback || submitting}

          className="mt-6 w-full rounded-full bg-[#2F6F62] py-4 text-xl font-bold text-white shadow-sm hover:bg-[#275C51] disabled:opacity-50"

        >

          Submit Answer

        </button>

      </form>

    </div>

  );



  const renderRoutine = () => {

    const steps = currentQuestion.steps || [];

    return (

      <div className="space-y-4">

        <p className="text-center text-2xl font-bold leading-snug text-[#20261F]">

          {currentQuestion.question_text ||

            "Put the steps in the right order."}

        </p>

        {currentQuestion.audio_url && (

          <div className="flex justify-center">

            <audio controls className="w-full max-w-xs">

              <source src={currentQuestion.audio_url} type="audio/mpeg" />

            </audio>

          </div>

        )}

        <div className="mt-8 space-y-3">

          {routineOrder.map((stepId, idx) => {

            const step = steps.find((s) => s.id === stepId);

            if (!step) return null;

            return (

              <div

                key={stepId}

                className="flex items-center gap-3 rounded-2xl border-2 border-[#CEDFCA] bg-white p-4 shadow-sm"

              >

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F0E6] text-lg font-bold text-[#2F6F62]">

                  {idx + 1}

                </span>

                {step.image_url && (

                  <img

                    src={step.image_url}

                    alt={step.text}

                    className="h-16 w-16 rounded-xl object-cover"

                    loading="lazy"

                  />

                )}

                <span className="flex-1 text-xl font-semibold text-[#303735]">

                  {step.text}

                </span>

                <button

                  type="button"

                  onClick={() => moveStep(idx, -1)}

                  disabled={idx === 0}

                  className="rounded-lg p-1 text-[#5B6459] hover:bg-[#F0EFE9] disabled:opacity-40"

                  aria-label="Move up"

                >

                  <ArrowUp className="h-5 w-5" />

                </button>

                <button

                  type="button"

                  onClick={() => moveStep(idx, 1)}

                  disabled={idx === routineOrder.length - 1}

                  className="rounded-lg p-1 text-[#5B6459] hover:bg-[#F0EFE9] disabled:opacity-40"

                  aria-label="Move down"

                >

                  <ArrowDown className="h-5 w-5" />

                </button>

              </div>

            );

          })}

        </div>

        {!feedback && (

          <button

            type="button"

            onClick={() => submitAnswer(routineOrder)}

            disabled={submitting}

            className="mt-6 w-full rounded-full bg-[#2F6F62] py-4 text-xl font-bold text-white shadow-sm hover:bg-[#275C51] disabled:opacity-50"

          >

            Submit Order

          </button>

        )}

      </div>

    );

  };



  const renderQuestion = () => {

    const qt = currentQuestion?.question_type;

    if (qt === "text") return renderText();

    if (qt === "routine") return renderRoutine();

    return renderMCQ();

  };



  return (

    <div className="min-h-screen bg-[#FBF8F2] text-[#20261F] font-sans">

      <PatientNavigation onNavigate={navigate} activePage="games" />

      <main className="mx-auto max-w-2xl px-4 py-8">

        <div className="mb-6 flex items-center justify-between text-sm text-[#7A817D]">

          <button

            type="button"

            onClick={() => navigate("/game")}

            className="flex items-center gap-1 rounded-full border border-[#E4DCC8] bg-white px-3 py-1.5 text-base font-semibold text-[#5B6459] hover:bg-[#F0F5F1]"

          >

            <ArrowLeft className="h-4 w-4" />

            Back

          </button>

          <span className="font-medium text-[#303735]">{progress}</span>

        </div>

        <div className="rounded-3xl border-2 border-[#E4DCC8] bg-white p-6 shadow-sm sm:p-10">

          {error && (

            <div className="mb-4 rounded-xl border border-[#FDE2E2] bg-[#FEF6F6] p-3 text-[#B23A3A]">

              {error}

            </div>

          )}

          {feedback && (

            <div className="mb-6 flex items-center justify-between rounded-2xl border border-[#C9E4D9] bg-[#F0F5F1] p-4">

              <div className="flex items-center gap-3">

                {feedback.correct ? (

                  <CheckCircle2 className="h-6 w-6 text-[#2F6F62]" />

                ) : (

                  <XCircle className="h-6 w-6 text-[#5B6459]" />

                )}

                <span className="text-lg font-semibold text-[#303735]">

                  {feedback.message}

                </span>

              </div>

              <button

                type="button"

                onClick={nextQuestion}

                className="rounded-full bg-[#2F6F62] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#275C51]"

              >

                Next

              </button>

            </div>

          )}

          {!feedback && renderQuestion()}

          {!feedback && (

            <div className="mt-8 flex justify-center">

              <span className="text-sm text-[#81796f]">

                {currentIndex + 1} of {questions.length}

              </span>

            </div>

          )}

        </div>

      </main>

    </div>

  );

}

