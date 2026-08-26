import { Brain, Gamepad2, Heart, Users } from "lucide-react";

const quickLinks = [
	{ icon: Gamepad2, title: "Cognitive games", text: "Practice memory, focus, and recall." },
	{ icon: Brain, title: "Memory companion", text: "Keep routines and important notes close." },
	{ icon: Users, title: "Family circle", text: "Connect caregivers and loved ones." },
];

export default function HomePage({ onNavigate }) {
	return (
		<main className="min-h-screen bg-slate-950 text-blue-50">
			<header className="border-b border-blue-900/40 bg-slate-950/90 px-6 py-4">
				<nav className="mx-auto flex max-w-6xl items-center justify-between">
					<div className="text-xl font-semibold tracking-tight">
						CODE<span className="text-blue-400">-1</span>
					</div>
					<button onClick={() => onNavigate?.("/")} className="rounded-full border border-blue-800 px-4 py-2 text-sm text-blue-200 transition hover:border-blue-500 hover:text-white">
						Landing page
					</button>
				</nav>
			</header>

			<section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
				<p className="text-sm font-medium uppercase tracking-widest text-blue-400">Your care space</p>
				<h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">Welcome to CODE-1</h1>
				<p className="mt-5 max-w-xl text-lg leading-relaxed text-blue-200/70">A simple home for memory support, daily activities, and family connection.</p>

				<div className="mt-12 grid gap-5 md:grid-cols-3">
					{quickLinks.map(({ icon: Icon, title, text }) => (
						<article key={title} className="rounded-2xl border border-blue-900/50 bg-slate-900 p-6">
							<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-900/60">
								<Icon className="h-5 w-5 text-blue-300" />
							</div>
							<h2 className="mt-5 text-lg font-medium">{title}</h2>
							<p className="mt-2 text-sm leading-relaxed text-blue-300/60">{text}</p>
						</article>
					))}
				</div>

				<div className="mt-10 rounded-2xl border border-blue-900/50 bg-blue-950/30 p-6">
					<div className="flex items-center gap-3">
						<Heart className="h-5 w-5 text-blue-300" />
						<h2 className="text-lg font-medium">Getting started</h2>
					</div>
					<p className="mt-3 text-sm text-blue-200/70">This homepage is ready for the games, patient profile, and caregiver dashboard to be developed next.</p>
				</div>
			</section>
		</main>
	);
}