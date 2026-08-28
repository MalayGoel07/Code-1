import { useState } from "react";

import LandingPage from "./components/LandingPage";
import LogSignPage from "./components/LogSignPage";
import HomePage from "./components/HomePage";
import CaretakerPage from "./components/CaretakerPage";
import ElderCareReport from "./components/ElderCareReport";
import ReminderPage from "./components/ReminderPage";
import HelpBotPage from "./components/HelpBotPage";
import ProfilePage from "./components/ProfilePage";
import SettingsPage from "./components/SettingsPage";

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  const navigate = (nextPath) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  };

  if (path === "/homepage") {
    return <HomePage onNavigate={navigate} />;
  }

  if (path === "/caretaker") {
    return <CaretakerPage onNavigate={navigate} />;
  }

  if (path === "/caretaker/report") {
    return <ElderCareReport onNavigate={navigate} />;
  }

  if (path === "/caretaker/reminders") {
    return <ReminderPage onNavigate={navigate} />;
  }

  if (path === "/caretaker/help") {
    return <HelpBotPage onNavigate={navigate} />;
  }

  if (path === "/caretaker/profile") {
    return <ProfilePage onNavigate={navigate} />;
  }

  if (path === "/caretaker/settings") {
    return <SettingsPage onNavigate={navigate} />;
  }

  if (path === "/logsign") {
    return <LogSignPage onNavigate={navigate} />;
  }

  return <LandingPage onNavigate={navigate} />;
}