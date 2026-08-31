import { useState, useEffect } from "react";

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
import PatternGame from "./components/games/pattern";

export default function App() {
  const [path, setPath] = useState(window.location.pathname + window.location.search);
  const isAuthenticated = Boolean(window.localStorage.getItem("access_token"));
  const userRole = window.localStorage.getItem("user_role");

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname + window.location.search);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  };

  // Extract pathname for route matching (ignore query params)
  const pathname = path.split("?")[0];

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
    "/pattern-game",
    "/elder-ai",
    "/reminder",
    "/profile",
    "/story",
  ];

  if (pathname === "/logsign" && isAuthenticated) {
    if (userRole === "caretaker") {
      return <CaretakerPage onNavigate={navigate} onLogout={logout} />;
    }

    if (userRole === "patient") {
      return <HomePage onNavigate={navigate} onLogout={logout} />;
    }
  }

  if (protectedCaretakerRoutes.includes(pathname) || protectedPatientRoutes.includes(pathname)) {
    if (!isAuthenticated) {
      return <LogSignPage onNavigate={navigate} />;
    }

    if (protectedCaretakerRoutes.includes(pathname) && userRole !== "caretaker") {
      return <LogSignPage onNavigate={navigate} />;
    }

    if (protectedPatientRoutes.includes(pathname) && userRole !== "patient") {
      return <LogSignPage onNavigate={navigate} />;
    }
  }

  if (pathname === "/homepage") {
    return <HomePage onNavigate={navigate} onLogout={logout} />;
  }

  if (pathname === "/caretaker") {
    return <CaretakerPage onNavigate={navigate} onLogout={logout} />;
  }

  if (pathname === "/caretaker/report") {
    return <ElderCareReport onNavigate={navigate} onLogout={logout} />;
  }

  if (pathname === "/caretaker/reminders") {
    return <ReminderPage onNavigate={navigate} onLogout={logout} />;
  }

  if (pathname === "/caretaker/help") {
    return <HelpBotPage onNavigate={navigate} onLogout={logout} />;
  }

  if (pathname === "/caretaker/profile") {
    return <ProfilePage onNavigate={navigate} onLogout={logout} />;
  }

  if (pathname === "/caretaker/settings") {
    return <SettingsPage onNavigate={navigate} onLogout={logout} />;
  }

  if (pathname === "/logsign") {
    return <LogSignPage onNavigate={navigate} />;
  }

  if (pathname === "/DementiaPage") {
    return <DementiaPage onNavigate={navigate} />;
  }

  if (pathname === "/game") {
    return <GamePage onNavigate={navigate} />;
  }

  if (pathname === "/pattern-game") {
    return <PatternGame onNavigate={navigate} />;
  }

  if (pathname === "/elder-ai") {
    return <ElderAi onNavigate={navigate} />;
  }

  if (pathname === "/reminder") {
    return <Reminder onNavigate={navigate} />;
  }

  if (pathname === "/profile") {
    return <Profile onNavigate={navigate} />;
  }

  if (pathname === "/story") {
    return <Story onNavigate={navigate} />;
  }

  return <LandingPage onNavigate={navigate} />;
}