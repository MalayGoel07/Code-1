import { Brain, Gamepad2, Users, ArrowRight, Heart, Home, Star, Sun, Cloud } from "lucide-react";
const ludo="/ludo.png"
const puzzle="/puzzle.png"
const cd="/cd.png"

const TILE_ICONS = [Brain, Heart, Home, Star, Sun, Cloud];

export default function CodeOneLanding({ onNavigate }) {
  const navigate = onNavigate ?? ((nextPath) => {window.location.href = nextPath;});
  return (
    <div className="theme-page scroll-smooth h-screen overflow-y-auto scrollbar-thin" style={{ background: "#FBF8F2", color: "#20261F", fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap');`}</style>

      <header className="sticky top-0 z-50 border-b backdrop-blur" style={{ borderColor: "#E4DCC8", background: "rgba(255,255,255,0.9)" }}>
        <nav className="mx-auto flex items-center justify-between p-4">
          <div className="text-xl font-semibold tracking-tight text-slate-900">
            CODE<span style={{ color: "#2F6F62" }}>-1</span>
          </div>
          <div className="flex flex-row gap-2">
            <button onClick={() => navigate("/DementiaPage")} className="rounded-full border border-blue-200 px-5 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white">What is dementia?</button>
            <button onClick={() => navigate("/homepage")} className="rounded-full border border-blue-200 px-5 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white">Patient Home</button>
            <button onClick={() => navigate("/logsign")} className="rounded-full px-5 py-2 text-sm font-bold text-white transition hover:opacity-90" style={{ background: "#2F6F62" }}>Log In / Sign Up</button>
          </div>
        </nav>
      </header>


      <section id="home" className="relative overflow-hidden px-6 pb-24 pt-16 sm:pt-24 ">
        <div className="drift-glow pointer-events-none absolute -top-24 right-[-10%] h-96 w-96 rounded-full blur-3xl" style={{ background: "#E4DCC8" }} aria-hidden="true"/>
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-widest" style={{ color: "#2F6F62" }}>Memory assistance platform for Dementia Patients</p>
            <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl" >Memory care that reaches every home.</h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              CODE-1 is a cognitive gaming and memory assistance platform built for elderly
              dementia patients across the North Eastern Region — helping them stay engaged,
              and helping families stay close, even across long distances and thin networks.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a onClick={() => navigate("/homepage")} className="group flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition hover:opacity-90" style={{ background: "#2F6F62" }}  >
                Patient Help
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </a>
              <span className="text-sm text-slate-500">
                Built for rural, low-connectivity elderly care
              </span>
            </div>
          </div>

          <div className="relative mx-auto grid grid-cols-3 gap-4" aria-hidden="true">
            {TILE_ICONS.map((Icon, i) => (
              <div key={i} className="relative h-24 w-24 rounded-2xl sm:h-28 sm:w-28" style={{ perspective: "600px" }}  >
                <div className="tile-flip absolute inset-0 flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50" style={{ animationDelay: `${i * 0.5}s` }}>
                  <span className="absolute inset-0 flex items-center justify-center rounded-2xl [backface-visibility:hidden]" style={{ background: "#EFEEE6" }}>
                    <span className="h-3 w-3 rounded-full" style={{ background: "#C97A2B" }} />
                  </span>
                  <span className="tile-face-back absolute inset-0 flex items-center justify-center rounded-2xl [backface-visibility:hidden]" style={{ background: "#E4DCC8", border: "2px solid #C9C2B2" }}>
                    <Icon className="h-8 w-8" style={{ color: "#2F6F62" }} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="work" className="border-t px-6 py-24" style={{ borderColor: "#E4DCC8", background: "#EFEEE6" }}>
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="mb-3 text-lg font-bold uppercase tracking-widest" style={{ color: "#2F6F62" }}> What CODE-1 does</p>
            <h2 className="max-w-2xl text-4xl font-semibold text-slate-900 sm:text-5xl">One platform, four ways it helps.</h2>
          </div>

          <div className="mt-28 flex flex-col gap-20">
            <div className="flex flex-row gap-16 mb-8">
              <div className="flex max-w-lg flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" style={{ color: "#2F6F62" }} />
                  <p className="text-lg font-bold uppercase tracking-widest" style={{ color: "#2F6F62" }}>
                    Cognitive games
                  </p>
                </div>
                  <p className="text-xl text-slate-600">
                  AI-adaptive games covering memory recall, attention, daily-routine recall, and pattern/object recognition. Difficulty adjusts in real time based on the patient's performance and cognitive condition, using culturally familiar NER themes, visuals, and sounds to keep elderly users engaged.
                </p>
              </div>
              <img src={ludo} alt="Cognitive games screenshot" className="h-80 w-80 shrink-0 rounded-xl border border-blue-900/40 object-cover" />
            </div>

            <div className="flex flex-row gap-16 mb-8">
              <img src={puzzle} alt="Memory companion screenshot" className="h-80 w-80 shrink-0 rounded-xl border border-blue-900/40 object-cover" />
              <div className="flex max-w-lg flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5" style={{ color: "#2F6F62" }} />
                  <p className="text-lg font-bold uppercase tracking-widest" style={{ color: "#2F6F62" }}>
                    Memory companion
                  </p>
                </div>
                <p className="text-xl text-slate-600">
                  A gentle AI voice companion assists patients throughout the day, reminding them of names, daily routines, and medicine times in the languages and dialects of the North Eastern Region. It speaks slowly and clearly, offering reassurance rather than instruction, and helps reduce the confusion and anxiety that often come with memory loss.
                </p>
              </div>
            </div>

            <div className="flex flex-row gap-16 mb-8">
              <div className="flex max-w-lg flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" style={{ color: "#2F6F62" }} />
                  <p className="text-lg font-bold uppercase tracking-widest" style={{ color: "#2F6F62" }}>
                    Caregiver dashboard
                  </p>
                </div>
                <p className="text-xl text-slate-600">
                  The platform is built to run smoothly even on low-bandwidth connections and in remote, hard-to-reach terrain across the North Eastern Region. Offline functionality ensures elderly patients in rural areas can keep using their cognitive tools and reminders without interruption, bringing consistent support to families far from specialized care.
                </p>
              </div>
              <img src={cd} alt="Caregiver dashboard screenshot" className="h-80 w-80 shrink-0 rounded-xl border border-blue-900/40 object-cover" />
            </div>

          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl border p-10 sm:flex-row sm:items-center" style={{ borderColor: "#E4DCC8", background: "#F3E7D0" }}>
          <div>
            <h3 className="text-2xl font-semibold">Built for families who live far, but care close.</h3>
            <p className="mt-2" style={{ color: "#5B6459" }}>Create an account to set up a patient profile and invite your family circle.</p>
          </div>
            <button onClick={() => navigate("/logsign")} className="rounded-full px-5 py-2 text-sm font-bold text-white transition hover:opacity-90" style={{ background: "#2F6F62" }}>Log In / Sign Up</button>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-sm text-slate-500 sm:flex-row">
          <span className="text-slate-700"> CODE-1</span>
          <div className="flex flex-col items-end">
            <span>Smart India Hackathon 2026 · Problem Statement - 26003</span>
            <span>· Bennett University 2025-29</span>
            <span>· Team Code-1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}