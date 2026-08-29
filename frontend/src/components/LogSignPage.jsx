import { useState } from "react";

export default function LogSignPage({ onNavigate }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = onNavigate ?? ((nextPath) => {window.location.href = nextPath;});

  const handleSubmit = async () => {
    setError("");

    if (mode === "login") {
      if (!email || !password) {
        setError("Please fill in all required fields.");
        return;
      }
    } else {
      if (!fullName || !email || !password || !role) {
        setError("Please fill in all required fields.");
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = mode === "login" ? "http://localhost:8000/auth/login" : "http://localhost:8000/auth/signup";
      const isLogin = mode === "login";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": isLogin ? "application/x-www-form-urlencoded" : "application/json",
        },
        body: isLogin
          ? new URLSearchParams({ username: email, password }).toString()
          : JSON.stringify({
              username: fullName,
              email,
              full_name: fullName,
              password,
              role: role === "caretaker" ? "caretaker" : "patient",
            }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("token_type", data.token_type || "bearer");
      localStorage.setItem("full_name", mode === "signup" ? fullName : email);

      const selectedRole = (data.role || (mode === "signup"
        ? (role === "caretaker" ? "caretaker" : "patient")
        : (localStorage.getItem("user_role") || "patient"))).toLowerCase();

      localStorage.setItem("user_role", selectedRole);

      if (selectedRole === "caretaker") {
        navigate("/caretaker");
      } else if (selectedRole === "patient") {
        navigate("/homepage");
      } else {
        localStorage.removeItem("user_role");
        navigate("/logsign");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-page h-screen overflow-hidden flex flex-col" style={{ background: "#FBF8F2", color: "#20261F", fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif" }}>
      <nav className="flex items-center justify-between px-6 py-4 border-b backdrop-blur-md z-50" style={{ borderColor: "#E4DCC8", background: "rgba(255,255,255,0.9)" }}>
        <div className="text-xl font-semibold tracking-tight">
            CODE<span style={{ color: "#2F6F62" }}>-1</span>
          </div>
        <div className="flex items-center gap-8">
            <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-base tracking-wide rounded-full px-4 py-2 transition-colors" style={{ color: "#5B6459", border: "2px solid #C9C2B2" }}>← Back</button>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center gap-10 px-8 z-10 ">
        <div className="w-[360px] rounded-3xl overflow-hidden flex-shrink-0 shadow-sm" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8" }}>
          <div className="flex" style={{ borderBottom: "2px solid #E4DCC8" }}>
            <button onClick={() => setMode("login")} className={`flex-1 py-3 text-base font-medium tracking-wide transition-colors ${mode === "login" ? "bg-white": "text-slate-500"}`} style={mode === "login" ? { color: "#2F6F62", borderBottom: "3px solid #2F6F62" } : {}}>Login</button>
            <button onClick={() => setMode("signup")} className={`flex-1 py-3 text-base font-medium tracking-wide transition-colors ${ mode === "signup" ? "bg-white" : "text-slate-500" }`} style={mode === "signup" ? { color: "#2F6F62", borderBottom: "3px solid #2F6F62" } : {}} >Sign Up</button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <p className="font-semibold text-lg mb-1">{mode === "login" ? "Welcome back" : "Create account"}</p>
            </div>
            {mode === "signup" && (
              <div>
                <label className="text-sm mb-1 block" style={{ color: "#5B6459" }}>Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} type="text" placeholder="John Doe" className="w-full rounded-xl px-4 py-2.5 text-base outline-none transition-colors" style={{ background: "#FFFFFF", border: "2px solid #C9C2B2", color: "#20261F" }}/>
              </div>
            )}
            {mode === "login" && (
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Email ID</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-base text-slate-900 outline-none focus:border-blue-500 transition-colors placeholder-slate-400" />
              </div>
            )}
            {mode === "signup" && (
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-base text-slate-900 outline-none focus:border-blue-500 transition-colors placeholder-slate-400" />
              </div>
            )}
            {mode === "signup" && (
              <fieldset>
                <legend className="text-sm mb-2 block" style={{ color: "#5B6459" }}>I am signing up as</legend>
                <div className="flex gap-3">
                  <label className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm cursor-pointer" style={{ background: "#FFFFFF", border: "2px solid #C9C2B2" }}>
                    <input type="radio" name="role" value="caretaker" checked={role === "caretaker"} onChange={e => setRole(e.target.value)} required className="accent-green-700" />
                    Caretaker
                  </label>
                  <label className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm cursor-pointer" style={{ background: "#FFFFFF", border: "2px solid #C9C2B2" }}>
                    <input type="radio" name="role" value="patient" checked={role === "patient"} onChange={e => setRole(e.target.value)} required className="accent-green-700" />
                    Elder patient
                  </label>
                </div>
              </fieldset>
            )}
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-base text-slate-900 outline-none focus:border-blue-500 transition-colors placeholder-slate-400"  />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {mode === "login" && (<div className="flex justify-end"><button className="text-sm text-blue-700 hover:text-blue-900 transition-colors">Forgot password?</button></div>)}
            <button onClick={handleSubmit} disabled={loading || (mode === "signup" && !role)} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-base font-medium transition-colors">{loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}</button>
            <p className="text-center text-sm text-slate-500">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-blue-700 hover:text-blue-900 transition-colors">{mode === "login" ? "Sign up" : "Log in"} </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}