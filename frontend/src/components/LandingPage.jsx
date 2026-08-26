import { Brain, Gamepad2, Users, Globe2, ArrowRight, Heart, Home, Star, Sun, Cloud } from "lucide-react";
const img = "/i1.png";

const TILE_ICONS = [Brain, Heart, Home, Star, Sun, Cloud];

export default function CodeOneLanding({ onNavigate }) {
  const openLogin = () => {
    if (onNavigate) {
      onNavigate("/logsign");
      return;
    }
    window.location.href = "/logsign";
  };

  return (
    <div className="scroll-smooth bg-slate-950 font-sans text-blue-50 h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-blue-900">

      <header className="sticky top-0 z-50 border-b border-blue-900/40 bg-slate-950/80 backdrop-blur">
        <nav className="mx-auto flex items-center justify-between p-4">
          <div className="text-xl font-semibold tracking-tight text-blue-50">
            CODE<span className="text-blue-400">-1</span>
          </div>
          <div className="flex flex-row gap-2">
            <a href="#home" className="rounded-full px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">Home</a>
            <a href="#work" className="rounded-full px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">Working</a>
            <a href="#" className="rounded-full px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">What is Dementia?</a>
            <a href="#" className="rounded-full px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">About</a>
            <button onClick={openLogin} className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">Log In / Sign Up</button>
          </div>
        </nav>
      </header>


      <section id="home" className="relative overflow-hidden px-6 pb-24 pt-16 sm:pt-24 ">
        <div className="drift-glow pointer-events-none absolute -top-24 right-[-10%] h-96 w-96 rounded-full bg-blue-700 blur-3xl" aria-hidden="true"/>
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
          <div>
            <p className=" text-sm font-xs uppercase tracking-widest text-blue-400">Memory assistance platform for Dementia Patients</p>
            <h1 className="text-4xl font-semibold text-blue-50 sm:text-5xl" >Memory care that reaches every home.</h1>
            <p className="mt-6 max-w-xl text-lg text-blue-200/70">
              CODE-1 is a cognitive gaming and memory assistance platform built for elderly
              dementia patients across the North Eastern Region — helping them stay engaged,
              and helping families stay close, even across long distances and thin networks.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href="#work" className="group flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"  >
                See how it works
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </a>
              <span className="text-sm text-blue-300/60">
                Built for rural, low-connectivity elderly care
              </span>
            </div>
          </div>

          <div className="relative mx-auto grid grid-cols-3 gap-4" aria-hidden="true">
            {TILE_ICONS.map((Icon, i) => (
              <div key={i} className="relative h-24 w-24 rounded-2xl sm:h-28 sm:w-28" style={{ perspective: "600px" }}  >
                <div className="tile-flip absolute inset-0 flex items-center justify-center rounded-2xl border border-blue-800 bg-blue-950" style={{ animationDelay: `${i * 0.5}s` }}>
                  <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-blue-950 [backface-visibility:hidden]">
                    <span className="h-3 w-3 rounded-full bg-blue-500" />
                  </span>
                  <span className="tile-face-back absolute inset-0 flex items-center justify-center rounded-2xl border border-blue-700 bg-blue-900 [backface-visibility:hidden]">
                    <Icon className="h-8 w-8 text-blue-300" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="work" className="border-t border-blue-900/40 bg-blue-950/20 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="mb-3 text-md font-medium uppercase tracking-widest text-blue-400"> What CODE-1 does</p>
            <h2 className="max-w-2xl text-6xl font-semibold text-blue-50 sm:text-4xl">One platform, four ways it helps.</h2>
          </div>

          <div className="mt-28 flex flex-col gap-20">
            <div className="flex flex-row gap-16 mb-8">
              <div className="flex max-w-lg flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-blue-400" />
                  <p className="text-sm font-medium uppercase tracking-widest text-blue-400">
                    Cognitive games
                  </p>
                </div>
                <p className="text-lg text-blue-100/80">
                  AI-adaptive games covering memory recall, attention, daily-routine recall, and pattern/object recognition. Difficulty adjusts in real time based on the patient's performance and cognitive condition, using culturally familiar NER themes, visuals, and sounds to keep elderly users engaged.
                </p>
              </div>
              <img src={img} alt="Cognitive games screenshot" className="h-80 w-80 shrink-0 rounded-xl border border-blue-900/40 object-cover" />
            </div>

            <div className="flex flex-row gap-16 mb-8">
              <img src={img} alt="Memory companion screenshot" className="h-80 w-80 shrink-0 rounded-xl border border-blue-900/40 object-cover" />
              <div className="flex max-w-lg flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-400" />
                  <p className="text-sm font-medium uppercase tracking-widest text-blue-400">
                    Memory companion
                  </p>
                </div>
                <p className="text-lg text-blue-100/80">
                  A gentle AI voice companion assists patients throughout the day, reminding them of names, daily routines, and medicine times in the languages and dialects of the North Eastern Region. It speaks slowly and clearly, offering reassurance rather than instruction, and helps reduce the confusion and anxiety that often come with memory loss.
                </p>
              </div>
            </div>

            <div className="flex flex-row gap-16 mb-8">
              <div className="flex max-w-lg flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <p className="text-sm font-medium uppercase tracking-widest text-blue-400">
                    Caregiver dashboard
                  </p>
                </div>
                <p className="text-lg text-blue-100/80">
                  The platform is built to run smoothly even on low-bandwidth connections and in remote, hard-to-reach terrain across the North Eastern Region. Offline functionality ensures elderly patients in rural areas can keep using their cognitive tools and reminders without interruption, bringing consistent support to families far from specialized care.
                </p>
              </div>
              <img src={img} alt="Caregiver dashboard screenshot" className="h-80 w-80 shrink-0 rounded-xl border border-blue-900/40 object-cover" />
            </div>

            <div className="flex flex-row gap-16">
              <img src={img} alt="Built for the North-East screenshot" className="h-80 w-80 shrink-0 rounded-xl border border-blue-900/40 object-cover" />
              <div className="flex max-w-lg flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-5 w-5 text-blue-400" />
                  <p className="text-sm font-medium uppercase tracking-widest text-blue-400">
                    Built for the North-East
                  </p>
                </div>
                <p className="text-lg text-blue-100/80">
                  Works on low-bandwidth connections and in remote terrain, so support reaches families beyond the region's few urban neurology centres.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl border border-blue-900/50 bg-slate-900 p-10 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-2xl font-semibold text-blue-50">Built for families who live far, but care close.</h3>
            <p className="mt-2 text-blue-200/70">Create an account to set up a patient profile and invite your family circle.</p>
          </div>
          <button onClick={openLogin} className="shrink-0 rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">Log In / Sign Up </button>
        </div>
      </section>

      <footer className="border-t border-blue-900/40 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-sm text-blue-300/50 sm:flex-row">
          <span className="text-blue-100"> CODE-1</span>
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