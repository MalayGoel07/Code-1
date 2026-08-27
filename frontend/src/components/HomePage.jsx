import { Brain, Gamepad2, Heart, Users } from "lucide-react";

const quickLinks = [
	{ icon: Gamepad2, title: "Cognitive games", text: "Practice memory, focus, and recall." },
	{ icon: Brain, title: "Memory companion", text: "Keep routines and important notes close." },
	{ icon: Users, title: "Family circle", text: "Connect caregivers and loved ones." },
];

export default function HomePage({ onNavigate }) {
	return (
		<main className="min-h-screen bg-white text-slate-900">
			<header className="border-b border-slate-200 bg-white px-6 py-4">
				<nav className="mx-auto flex max-w-6xl items-center justify-between">
					<div className="text-xl font-semibold tracking-tight text-slate-900">
						CODE<span className="text-blue-400">-1</span>
					</div>
					<button onClick={() => onNavigate?.("/")} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-blue-500 hover:text-blue-700">
						Landing page
					</button>
				</nav>
			</header>

			<section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
				<p className="text-sm font-medium uppercase tracking-widest text-blue-700">Your care space</p>
				<h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">Welcome to CODE-1</h1>
				<p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">A simple home for memory support, daily activities, and family connection.</p>

				<div className="mt-12 grid gap-5 md:grid-cols-3">
					{quickLinks.map(({ icon: Icon, title, text }) => (
						<article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
							<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
								<Icon className="h-5 w-5 text-blue-700" />
							</div>
							<h2 className="mt-5 text-lg font-medium">{title}</h2>
							<p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
						</article>
					))}
				</div>

				<div className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-6">
					<div className="flex items-center gap-3">
						<Heart className="h-5 w-5 text-blue-700" />
						<h2 className="text-lg font-medium">Getting started</h2>
					</div>
					<p className="mt-3 text-sm text-slate-600">This homepage is ready for the games, patient profile, and caregiver dashboard to be developed next.</p>
				</div>
			</section>
		</main>
	);
}