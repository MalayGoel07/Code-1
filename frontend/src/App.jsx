import { useState } from "react";

import LandingPage from "./components/LandingPage";
import LogSignPage from "./components/LogSignPage";
import HomePage from "./components/patient/HomePage";
import CaretakerPage from "./components/caretaker/CaretakerPage";
import ElderCareReport from "./components/caretaker/ElderCareReport";
import ReminderPage from "./components/caretaker/ReminderPage";
import HelpBotPage from "./components/caretaker/HelpBotPage";
import ProfilePage from "./components/caretaker/ProfilePage";
import SettingsPage from "./components/caretaker/SettingsPage";
import DementiaPage from "./components/DementiaPage";
import GamePage from "./components/patient/GamePage";
import Reminder from "./components/patient/Reminder";
import ElderAi from "./components/patient/ElderAi";
import Story from "./components/patient/Story";
import Profile from "./components/patient/Profile";

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const isAuthenticated = Boolean(window.localStorage.getItem("access_token"));
  const userRole = window.localStorage.getItem("user_role");

  const navigate = (nextPath) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  };

  const logout = () => {
    window.localStorage.removeItem("access_token");
    window.localStorage.removeItem("token_type");
    window.localStorage.removeItem("user_role");
    navigate("/logsign");
  };

  const protectedCaretakerRoutes = [
    "/caretaker",
    "/caretaker/report",
    "/caretaker/reminders",
    "/caretaker/help",
    "/caretaker/profile",
    "/caretaker/settings",
  ];

  const protectedPatientRoutes = [
    "/homepage",
    "/game",
    "/elder-ai",
    "/reminder",
    "/profile",
    "/story",
  ];

  if (path === "/logsign" && isAuthenticated) {
    if (userRole === "caretaker") {
      return <CaretakerPage onNavigate={navigate} onLogout={logout} />;
    }

    if (userRole === "patient") {
      return <HomePage onNavigate={navigate} onLogout={logout} />;
    }
  }

  if (protectedCaretakerRoutes.includes(path) || protectedPatientRoutes.includes(path)) {
    if (!isAuthenticated) {
      return <LogSignPage onNavigate={navigate} />;
    }

    if (protectedCaretakerRoutes.includes(path) && userRole !== "caretaker") {
      return <LogSignPage onNavigate={navigate} />;
    }

    if (protectedPatientRoutes.includes(path) && userRole !== "patient") {
      return <LogSignPage onNavigate={navigate} />;
    }
  }

  if (path === "/homepage") {
    return <HomePage onNavigate={navigate} onLogout={logout} />;
  }

  if (path === "/caretaker") {
    return <CaretakerPage onNavigate={navigate} onLogout={logout} />;
  }

  if (path === "/caretaker/report") {
    return <ElderCareReport onNavigate={navigate} onLogout={logout} />;
  }

  if (path === "/caretaker/reminders") {
    return <ReminderPage onNavigate={navigate} onLogout={logout} />;
  }

  if (path === "/caretaker/help") {
    return <HelpBotPage onNavigate={navigate} onLogout={logout} />;
  }

  if (path === "/caretaker/profile") {
    return <ProfilePage onNavigate={navigate} onLogout={logout} />;
  }

  if (path === "/caretaker/settings") {
    return <SettingsPage onNavigate={navigate} onLogout={logout} />;
  }

  if (path === "/logsign") {
    return <LogSignPage onNavigate={navigate} />;
  }

  if (path === "/DementiaPage") {
    return <DementiaPage onNavigate={navigate} />;
  }

  if (path === "/game") {
    return <GamePage onNavigate={navigate} />;
  }

  if (path === "/elder-ai") {
    return <ElderAi onNavigate={navigate} />;
  }

  if (path === "/reminder") {
    return <Reminder onNavigate={navigate} />;
  }

  if (path === "/profile") {
    return <Profile onNavigate={navigate} />;
  }

  if (path === "/story") {
    return <Story onNavigate={navigate} />;
  }

  return <LandingPage onNavigate={navigate} />;
}