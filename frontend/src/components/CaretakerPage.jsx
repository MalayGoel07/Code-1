import {
  Heart,
  FileText,
  Bell,
  Bot,
  User,
  Settings,
  ArrowRight,
  Activity,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Elder Care Report",
    text: "View activity, engagement, and care insights.",
    path: "/caretaker/report",
  },
  {
    icon: Bell,
    title: "Reminders",
    text: "Create and manage daily reminders for your elder.",
    path: "/caretaker/reminders",
  },
  {
    icon: Bot,
    title: "AI Helpbot",
    text: "Get guidance and support for caregiving.",
    path: "/caretaker/help",
  },
  {
    icon: User,
    title: "Profile",
    text: "Manage your caretaker account and details.",
    path: "/caretaker/profile",
  },
  {
    icon: Settings,
    title: "Settings",
    text: "Customize your preferences and notifications.",
    path: "/caretaker/settings",
  },
];

export default function CaretakerPage({ onNavigate }) {
  return (
    <main className="min-h-screen bg-[#F6F4EE] text-[#303735]">

      {/* HEADER */}
      <header className="border-b border-[#DED9CD] bg-[#FBFAF6]">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F7D73] shadow-sm">
              <Heart className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="text-lg font-semibold text-[#303735]">
                CODE<span className="text-[#4F7D73]">-1</span>
              </p>

              <p className="text-xs text-[#7A817D]">
                Caregiver dashboard
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate?.("/")}
            className="rounded-full border border-[#D5CFBF] bg-[#FBFAF6] px-5 py-2 text-sm font-medium text-[#4F7D73] transition hover:border-[#4F7D73] hover:bg-[#EDE9DA]"
          >
            Landing page
          </button>

        </nav>
      </header>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">

        {/* WELCOME CARD */}
        <div className="rounded-3xl border border-[#DDD7C7] bg-gradient-to-br from-[#F2EFE5] to-[#E7E2D3] p-8 shadow-sm sm:p-10">

          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-[#4F7D73]" />

            <span className="text-sm font-medium uppercase tracking-widest text-[#4F7D73]">
              Caregiver space
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-semibold text-[#303735] sm:text-5xl">
            Welcome back.
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#64706C]">
            Stay connected with your elder's daily activities, routines,
            and overall care.
          </p>

        </div>

        {/* CARE TOOLS */}
        <div className="mt-12">

          <p className="text-sm font-medium uppercase tracking-widest text-[#4F7D73]">
            Care tools
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-[#303735]">
            Everything you need in one place.
          </h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {features.map(({ icon: Icon, title, text, path }) => (
              <button
                key={title}
                onClick={() => onNavigate?.(path)}
                className="group rounded-2xl border border-[#DED9CD] bg-[#FBFAF6] p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#A9BFB5] hover:shadow-md"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8E6DC]">
                    <Icon className="h-6 w-6 text-[#4F7D73]" />
                  </div>

                  <ArrowRight className="h-5 w-5 text-[#4F7D73] opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />

                </div>

                <h3 className="mt-6 text-lg font-semibold text-[#303735]">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-[#7A817D]">
                  {text}
                </p>

              </button>
            ))}

          </div>

        </div>

      </section>

    </main>
  );
}