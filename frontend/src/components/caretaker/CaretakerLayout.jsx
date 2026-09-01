import { useState } from "react";
import {
  Bell,
  Bot,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
} from "lucide-react";

import ElderCareReport from "./ElderCareReport";
import ReminderPage from "./ReminderPage";
import HelpBotPage from "./HelpBotPage";
import ProfilePage from "./ProfilePage";
import SettingsPage from "./SettingsPage";
import CaretakerOverview from "./CaretakerOverview";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, path: "/caretaker" },
  { id: "report", label: "Elder Care Report", icon: FileText, path: "/caretaker/report" },
  { id: "reminders", label: "Reminders", icon: Bell, path: "/caretaker/reminders" },
  { id: "help", label: "AI Helpbot", icon: Bot, path: "/caretaker/help" },
  { id: "profile", label: "Profile", icon: User, path: "/caretaker/profile" },
  { id: "settings", label: "Settings", icon: Settings, path: "/caretaker/settings" },
];

export default function CaretakerLayout({ onNavigate, onLogout, initialTab = "overview" }) {
  const [active, setActive] = useState(initialTab);

  const go = (tabId) => {
    const item = NAV_ITEMS.find((nav) => nav.id === tabId);
    if (!item) return;
    setActive(tabId);
    onNavigate?.(item.path);
  };

  const renderTab = () => {
    switch (active) {
      case "report":
        return <ElderCareReport onNavigate={onNavigate} onLogout={onLogout} />;
      case "reminders":
        return <ReminderPage onNavigate={onNavigate} onLogout={onLogout} />;
      case "help":
        return <HelpBotPage onNavigate={onNavigate} onLogout={onLogout} />;
      case "profile":
        return <ProfilePage onNavigate={onNavigate} onLogout={onLogout} />;
      case "settings":
        return <SettingsPage onNavigate={onNavigate} onLogout={onLogout} />;
      default:
        return <CaretakerOverview onNavigateTab={go} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F4EE] text-[#303735]">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-[#DED9CD] bg-[#FBFAF6]">
        <button
          onClick={() => go("overview")}
          className="flex items-center gap-3 border-b border-[#DED9CD] px-5 py-5 text-left transition hover:bg-[#F2EFE5]"
          title="Go to home"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4F7D73] shadow-sm">
            <Heart className="h-5 w-5 text-white" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-semibold leading-tight text-[#303735]">
              Maitri
            </span>
            <span className="block truncate text-xs text-[#7A817D]">
              Caregiver dashboard
            </span>
          </span>
        </button>

        <p className="px-6 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-widest text-[#A39F92]">
          Your space
        </p>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => go(id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#303735] text-white shadow-sm"
                    : "text-[#5A625E] hover:bg-[#EFEBDF] hover:text-[#303735]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#DED9CD] p-3">
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#7A2A2A] transition hover:bg-[#FDE5E5]"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1">{renderTab()}</div>
    </div>
  );
}