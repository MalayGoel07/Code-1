import {
  Home,
  Gamepad2,
  MessageCircle,
  BookOpen,
  Bell,
  UserRound,
  Pill,
  LogOut,
  Heart,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Home", path: "/homepage", icon: Home },
  { id: "games", label: "Games", path: "/game", icon: Gamepad2 },
  { id: "talk", label: "Talk", path: "/elder-ai", icon: MessageCircle },
  { id: "stories", label: "Stories", path: "/story", icon: BookOpen },
  { id: "reminders", label: "Reminders", path: "/reminder", icon: Bell },
  { id: "medications", label: "Medicines", path: "/medications", icon: Pill },
  { id: "activities", label: "Activities", path: "/patient/activities", icon: Heart },
  { id: "profile", label: "Profile", path: "/profile", icon: UserRound },
];

export default function PatientNavigation({ onNavigate, onLogout, activePage }) {
  const navigate = onNavigate ?? ((nextPath) => {
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  const currentPage = activePage ?? NAV_ITEMS.find((item) => item.path === window.location.pathname)?.id ?? "home";

  return (
    <nav className="px-3 pt-3 sm:px-6 sm:pt-4" aria-label="Patient pages">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-1 rounded-[22px] bg-white px-2 py-2 shadow-[0_10px_30px_rgba(32,38,31,0.08)] sm:justify-start sm:px-3">
        {NAV_ITEMS.map(({ id, label, path, icon: Icon }) => {
          const isActive = currentPage === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => navigate(path)}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex w-[72px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2.5 text-sm transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2 sm:w-[84px]",
                isActive
                  ? "bg-[#E9E9D8] font-bold text-[#1E4D3E]"
                  : "font-semibold text-[#6B7466] hover:bg-[#F4F3EC]",
              ].join(" ")}
            >
              <Icon className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}

        {onLogout && (
          <div className="ml-auto flex items-center sm:border-l sm:border-[#E7E4D8] sm:pl-3">
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-base font-semibold text-[#B23A3A] transition hover:bg-[#FBECEC] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B23A3A] focus-visible:ring-offset-2"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
