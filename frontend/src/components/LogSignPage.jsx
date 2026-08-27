import { useState } from "react";

export default function LogSignPage({ onNavigate }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = onNavigate ?? ((nextPath) => {window.location.href = nextPath;});

  return (
    <div className="h-screen bg-white text-slate-900 font-sans overflow-hidden flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/90 backdrop-blur-md z-50">
        <div className="text-xl font-semibold tracking-tight text-slate-900">
            CODE<span className="text-blue-400">-1</span>
          </div>
        <div className="flex items-center gap-8">
            <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-slate-600 hover:text-blue-700 text-base tracking-wide border border-slate-300 hover:border-blue-400 rounded-lg px-4 py-2 transition-colors">← Back</button>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center gap-10 px-8 z-10 ">
        <div className="w-[360px] bg-slate-200 border border-slate-400 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
          <div className="flex border-b border-slate-200">
            <button onClick={() => setMode("login")} className={`flex-1 py-3 text-base font-medium tracking-wide transition-colors ${mode === "login" ? "text-blue-700 border-b-2 border-blue-600 bg-blue-50": "text-slate-500 hover:text-slate-800"}`}>Login</button>
            <button onClick={() => setMode("signup")} className={`flex-1 py-3 text-base font-medium tracking-wide transition-colors ${ mode === "signup" ? "text-blue-700 border-b-2 border-blue-600 bg-blue-50" : "text-slate-500 hover:text-slate-800" }`} >Sign Up</button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <p className="text-slate-900 font-semibold text-lg mb-1">{mode === "login" ? "Welcome back" : "Create account"}</p>
              <p className="text-slate-500 text-sm">{mode === "login"? "Login into your memories": "Start creating memories today"}</p>
            </div>
            {mode === "signup" && (
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} type="text" placeholder="John Doe" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-base text-slate-900 outline-none focus:border-blue-500 transition-colors placeholder-slate-400"/>
              </div>
            )}
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-base text-slate-900 outline-none focus:border-blue-500 transition-colors placeholder-slate-400"  />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-base text-slate-900 outline-none focus:border-blue-500 transition-colors placeholder-slate-400"  />
            </div>

            {mode === "signup" && (
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Confirm Password</label>
                <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-base text-slate-900 outline-none focus:border-blue-500 transition-colors placeholder-slate-400"/>
              </div>
            )}
            {mode === "login" && (<div className="flex justify-end"><button className="text-sm text-blue-700 hover:text-blue-900 transition-colors">Forgot password?</button></div>)}
            <button onClick={() => navigate("/homepage")} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-base font-medium transition-colors">{mode === "login" ? "Sign In" : "Create Account"}</button>
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