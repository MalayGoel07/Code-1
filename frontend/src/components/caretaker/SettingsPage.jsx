import { useState } from "react";
import {ArrowLeft,Settings,Bell,Moon,Globe2,Shield,CheckCircle2,} from "lucide-react";

export default function SettingsPage({ onNavigate }) {
  const [notifications, setNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("English");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => { setSaved(false);}, 3000);
  };

  return (
    <main className="min-h-screen bg-[#f8f7f3] text-[#2f3b32]">
      {/* Header */}
      <header className="border-b border-[#e5dfd4] bg-[#fcfbf8]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5f8567] text-white shadow-sm">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#2f3b32]">CODE<span className="text-[#5f8567]">-1</span></p>
              <p className="text-xs text-[#7b837a]">Settings</p>
            </div>
          </div>
          <button onClick={() => onNavigate?.("/caretaker")} className="flex items-center gap-2 rounded-full border border-[#cdd8ce] bg-[#fcfbf8] px-4 py-2 text-sm font-medium text-[#5f8567] transition hover:border-[#5f8567] hover:bg-[#edf3ed]">
            <ArrowLeft className="h-4 w-4" />
            Caretaker Dashboard
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-3xl border border-[#ded8cc] bg-gradient-to-br from-[#f6f2e8] via-[#f4f1e8] to-[#eaf1e9] p-8 shadow-sm sm:p-10">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-[#5f8567]" />
            <span className="text-sm font-medium uppercase tracking-widest text-[#5f8567]">Preferences</span>
          </div>
          <h1 className="mt-5 text-4xl font-semibold text-[#2f3b32] sm:text-5xl"> Settings</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#6b736b]">
            Customize your caretaker experience and manage notification
            preferences.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-[#e1ddd3] bg-[#fcfbf8] p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf3ed]">
              <Bell className="h-5 w-5 text-[#5f8567]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#2f3b32]">Notifications</h2>
              <p className="text-sm text-[#7b837a]">Control how you receive important updates.</p>
            </div>
          </div>

          <div className="mt-7 space-y-6">
            <div className="flex items-center justify-between border-b border-[#e8e3da] pb-6">
              <div>
                <p className="font-medium text-[#2f3b32]">Notifications</p>
                <p className="mt-1 text-sm text-[#7b837a]">Receive updates about your elder's activities and reminders.</p>
              </div>
              <button onClick={() => setNotifications(!notifications)} className={`relative h-7 w-12 rounded-full transition ${   notifications ? "bg-[#5f8567]" : "bg-[#c9c8c2]" }`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${  notifications ? "left-6" : "left-1" }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#2f3b32]">Sound Alerts</p>
                <p className="mt-1 text-sm text-[#7b837a]">Play a sound when important reminders need attention.</p>
              </div>
              <button onClick={() => setSoundAlerts(!soundAlerts)} className={`relative h-7 w-12 rounded-full transition ${ soundAlerts ? "bg-[#5f8567]" : "bg-[#c9c8c2]" }`} >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${ soundAlerts ? "left-6" : "left-1" }`} />
              </button>
            </div>
          </div>
        </div>


        <div className="mt-6 rounded-3xl border border-[#e1ddd3] bg-[#fcfbf8] p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf3ed]">
              <Moon className="h-5 w-5 text-[#5f8567]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#2f3b32]">Appearance</h2>
              <p className="text-sm text-[#7b837a]">Customize how the platform looks.</p>
            </div>
          </div>
          <div className="mt-7 flex items-center justify-between">
            <div>
              <p className="font-medium text-[#2f3b32]"> Dark Mode</p>
              <p className="mt-1 text-sm text-[#7b837a]">Use a darker interface for more comfortable viewing.</p>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className={`relative h-7 w-12 rounded-full transition ${ darkMode ? "bg-[#5f8567]" : "bg-[#c9c8c2]" }`} >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${ darkMode ? "left-6" : "left-1" }`} />
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-[#e1ddd3] bg-[#fcfbf8] p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf3ed]">
              <Globe2 className="h-5 w-5 text-[#5f8567]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#2f3b32]">Language</h2>
              <p className="text-sm text-[#7b837a]">Select your preferred language.</p>
            </div>
          </div>

          <select value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-7 w-full rounded-xl border border-[#ddd8cd] bg-[#fffdfa] px-4 py-3 text-[#4f5a50] outline-none transition focus:border-[#5f8567] focus:ring-2 focus:ring-[#dce8dd]">
            <option>English</option>
            <option>Hindi</option>
            <option>Assamese</option>
            <option>Bengali</option>
          </select>
        </div>

        <div className="mt-6 rounded-3xl border border-[#e1ddd3] bg-[#fcfbf8] p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf3ed]">
              <Shield className="h-5 w-5 text-[#5f8567]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#2f3b32]">Privacy & Security</h2>
              <p className="text-sm text-[#7b837a]">Your elder's information is protected and handled securely.</p>
            </div>
          </div>

          <button className="mt-7 rounded-xl border border-[#cdd8ce] bg-[#fcfbf8] px-5 py-3 text-sm font-medium text-[#5f8567] transition hover:border-[#5f8567] hover:bg-[#edf3ed]">Manage Privacy Settings</button>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <button onClick={handleSave} className="w-full rounded-xl bg-[#5f8567] px-6 py-4 font-medium text-white shadow-sm transition hover:bg-[#4f7257] sm:w-auto sm:min-w-[220px]"> Save Settings</button>
          {saved && (
            <div className="flex items-center gap-2 text-sm font-medium text-[#5f8567]">
              <CheckCircle2 className="h-5 w-5" />
              Settings saved successfully!
            </div>
          )}
        </div>
      </section>
    </main>
  );
}