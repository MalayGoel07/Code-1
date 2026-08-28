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

export default function PatientNavigation({ onNavigate, activePage }) {
  const navigate = onNavigate ?? ((nextPath) => {
    window.location.href = nextPath;
  });

  return (
    <nav
      className="border-b px-3 py-3 sm:px-6"
      style={{
        borderColor: "#E4DCC8",
        background: "#EFEEE6",
      }}
      aria-label="Patient pages"
    >
      <ul className="mx-auto grid max-w-3xl list-none grid-cols-3 gap-2 p-0 sm:grid-cols-6">
        {NAV_ITEMS.map(({ id, label, path, icon: Icon }) => {
          const isActive = activePage === id;

          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => navigate(path)}
                aria-current={isActive ? "page" : undefined}
                className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-base active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
                style={
                  isActive
                    ? {
                        background: "#F3E7D0",
                        border: "3px solid #2F6F62",
                        color: "#20261F",
                        fontWeight: 700,
                      }
                    : {
                        background: "#FFFFFF",
                        border: "2px solid #E4DCC8",
                        color: "#5B6459",
                        fontWeight: 600,
                      }
                }
              >
                <Icon
                  className="h-7 w-7"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
