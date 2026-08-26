import { useRef } from "react";
import { Brain, Gamepad2, Users, Globe2, ArrowRight, Heart, Home, Star, Sun, Cloud } from "lucide-react";

const TILE_ICONS = [Brain, Heart, Home, Star, Sun, Cloud];

export default function CodeOneLanding({ onNavigate }) {
  const howItWorksRef = useRef(null);
  const scrollToSection = () => {howItWorksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });};
  const openLogin = () => {
    if (onNavigate) {
      onNavigate("/logsign");
      return;
    }
    window.location.href = "/logsign";
  };

  return (
    <div className="bg-slate-950 font-sans text-blue-50 h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-blue-900">

      <header className="sticky top-0 z-50 border-b border-blue-900/40 bg-slate-950/80 backdrop-blur">
        <nav className="mx-auto flex items-center justify-between p-4">
          <div className="text-xl font-semibold tracking-tight text-blue-50">
            CODE<span className="text-blue-400">-1</span>
          </div>
          <button onClick={openLogin} className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">Log In / Sign Up</button>
        </nav>
      </header>


      <section className="relative overflow-hidden px-6 pb-24 pt-16 sm:pt-24">
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
              <button onClick={scrollToSection} className="group flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"  >
                See how it works
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
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

      <section ref={howItWorksRef} id="how-it-works" className="border-t border-blue-900/40 bg-blue-950/20 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-blue-400"> What CODE-1 does</p>
          <h2 className="max-w-2xl text-3xl font-semibold text-blue-50 sm:text-4xl">One platform, four ways it helps.</h2>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            <FeatureCard icon={Gamepad2} title="Cognitive games" text="Daily memory-matching, sequencing, and recall games that adjust their difficulty to each patient's ability, keeping the mind active without frustration."/>
            <FeatureCard icon={Brain} title="Memory companion" text="A gentle AI companion that reminds patients of names, routines, and medicine times, speaking in the languages and dialects of the region."/>
            <FeatureCard icon={Users} title="Caregiver dashboard" text="Families track mood, engagement, and memory trends remotely, so distance is never the reason a warning sign goes unnoticed."/>
            <FeatureCard icon={Globe2} title="Built for the North-East" text="Works on low-bandwidth connections and in remote terrain, so support reaches families beyond the region's few urban neurology centres."/>
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
          <span>Smart India Hackathon 2026 · Problem Statement 26003 · MDoNER</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-blue-900/50 bg-slate-900 p-7 transition hover:border-blue-700">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-900/60">
        <Icon className="h-5 w-5 text-blue-300" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-blue-50">{title}</h3>
      <p className="text-sm leading-relaxed text-blue-300/60">{text}</p>
    </div>
  );
}