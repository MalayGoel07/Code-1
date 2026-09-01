import {
  Home,
  Gamepad2,
  MessageCircle,
  BookOpen,
  Bell,
  UserRound,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Home", path: "/homepage", icon: Home },
  { id: "games", label: "Games", path: "/game", icon: Gamepad2 },
  { id: "talk", label: "Talk", path: "/elder-ai", icon: MessageCircle },
  { id: "stories", label: "Stories", path: "/story", icon: BookOpen },
  { id: "reminders", label: "Reminders", path: "/reminder", icon: Bell },
  { id: "profile", label: "Profile", path: "/profile", icon: UserRound },
];

export default function PatientNavigation({ onNavigate, onLogout, activePage }) {
  const navigate = onNavigate ?? ((nextPath) => {
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  const currentPage = activePage ?? NAV_ITEMS.find((item) => item.path === window.location.pathname)?.id ?? "home";

  return (
    <nav className="border-b border-[#E4DCC8] bg-[#EFEEE6] px-3 py-3 sm:px-6" aria-label="Patient pages">
      <ul className="mx-auto grid max-w-4xl list-none grid-cols-3 gap-2 p-0 sm:grid-cols-7">
        {NAV_ITEMS.map(({ id, label, path, icon: Icon }) => {
          const isActive = currentPage === id;

          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => navigate(path)}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex w-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-base active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2",
                  isActive
                    ? "border-[3px] border-[#2F6F62] bg-[#F3E7D0] font-bold text-[#20261F]"
                    : "border-2 border-[#E4DCC8] bg-white font-semibold text-[#5B6459]",
                ].join(" ")}
              >
                <Icon className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
                <span>{label}</span>
              </button>
            </li>
          );
        })}
        {onLogout && (
          <li>
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-[#E5B1B1] bg-[#FFF0F0] px-2 py-3 text-base font-bold text-[#7A2A2A] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B23A3A] focus-visible:ring-offset-2"
            >
              <span className="text-lg" aria-hidden="true">↩</span>
              <span>Logout</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
