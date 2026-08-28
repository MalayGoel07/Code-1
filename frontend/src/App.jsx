import LandingPage from "./components/LandingPage";
import LogSignPage from "./components/LogSignPage";
import HomePage from "./components/HomePage";
import DementiaPage from "./components/DementiaPage";
import CaretakerPage from "./components/CaretakerPage";
import GamePage from "./components/patient/GamePage";
import Reminder from "./components/patient/Reminder";
import ElderAi from "./components/patient/ElderAi";
import Story from "./components/patient/Story";
import Profile from "./components/patient/Profile";
import { useState } from "react";

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