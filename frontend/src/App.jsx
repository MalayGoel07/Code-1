import { useState, useEffect, useMemo } from "react";

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
import { useAuth } from "./hooks/useAuth";
import { getUserRole, isCaretakerRole, isPatientRole } from "./lib/roles";

export default function App() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [path, setPath] = useState(window.location.pathname + window.location.search);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname + window.location.search);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath) => {
    const safePath = nextPath || "/";
    window.history.pushState({}, "", safePath);
    setPath(safePath);
  };

  const pathname = path.split("?")[0];
  const userRole = getUserRole(user);

  const protectedCaretakerRoutes = useMemo(
    () => [
      "/caretaker",
      "/caretaker/report",
      "/caretaker/reminders",
      "/caretaker/help",
      "/caretaker/profile",
      "/caretaker/settings",
    ],
    []
  );

  const protectedPatientRoutes = useMemo(
    () => [
      "/homepage",
      "/game",
      "/pattern-game",
      "/elder-ai",
      "/reminder",
      "/profile",
      "/story",
    ],
    []
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/logsign");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/logsign");
    }
  };

  useEffect(() => {
    if (loading) {
      return;
    }

    const isProtectedPatientRoute = protectedPatientRoutes.includes(pathname);
    const isProtectedCaretakerRoute = protectedCaretakerRoutes.includes(pathname);

    let nextPath = null;

    if (!isAuthenticated) {
      if (isProtectedPatientRoute || isProtectedCaretakerRoute) {
        nextPath = "/logsign";
      }
    } else if ((pathname === "/" || pathname === "/logsign") && isPatientRole(userRole)) {
      nextPath = "/homepage";
    } else if ((pathname === "/" || pathname === "/logsign") && isCaretakerRole(userRole)) {
      nextPath = "/caretaker";
    } else if (isProtectedPatientRoute && !isPatientRole(userRole)) {
      nextPath = "/logsign";
    } else if (isProtectedCaretakerRoute && !isCaretakerRole(userRole)) {
      nextPath = "/logsign";
    }

    if (nextPath && window.location.pathname !== nextPath) {
      window.history.replaceState({}, "", nextPath);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [loading, isAuthenticated, pathname, userRole, protectedCaretakerRoutes, protectedPatientRoutes]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#FBF8F2", color: "#20261F" }}>
        <p className="text-lg font-medium">Loading your session...</p>
      </div>
    );
  }

  if (pathname === "/homepage") {
    return <HomePage onNavigate={navigate} onLogout={handleLogout} />;
  }

  if (pathname === "/caretaker") {
    return <CaretakerPage onNavigate={navigate} onLogout={handleLogout} />;
  }

  if (pathname === "/caretaker/report") {
    return <ElderCareReport onNavigate={navigate} onLogout={handleLogout} />;
  }

  if (pathname === "/caretaker/reminders") {
    return <ReminderPage onNavigate={navigate} onLogout={handleLogout} />;
  }

  if (pathname === "/caretaker/help") {
    return <HelpBotPage onNavigate={navigate} onLogout={handleLogout} />;
  }

  if (pathname === "/caretaker/profile") {
    return <ProfilePage onNavigate={navigate} onLogout={handleLogout} />;
  }

  if (pathname === "/caretaker/settings") {
    return <SettingsPage onNavigate={navigate} onLogout={handleLogout} />;
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