import LandingPage from "./components/LandingPage";
import LogSignPage from "./components/LogSignPage";
import HomePage from "./components/HomePage";
import DementiaPage from "./components/DementiaPage";
import CaretakerPage from "./components/CaretakerPage";
import { useState } from "react";

export default function App(){
    const [path, setPath] = useState(window.location.pathname);
    const navigate = (nextPath) => {window.history.pushState({}, "", nextPath);setPath(nextPath);};

    if (path === "/homepage") {return <HomePage onNavigate={navigate} />;}
    if (path === "/caretaker") {return <CaretakerPage onNavigate={navigate} />;}
    if (path === "/logsign") {return <LogSignPage onNavigate={navigate} />;}
    if (path==="/DementiaPage") {return <DementiaPage onNavigate={navigate} />;}
    
    return <LandingPage onNavigate={navigate}/>
}