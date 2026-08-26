import { useState } from "react";

export default function LogSignPage({ onNavigate }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = onNavigate ?? ((nextPath) => {window.location.href = nextPath;});

  return (
    <div className="h-screen bg-[#0a0f18] text-white font-sans overflow-hidden flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#131c2b] bg-[#0a0f18]/80 backdrop-blur-md z-50">
        <div className="text-xl font-semibold tracking-tight text-blue-50">
            CODE<span className="text-blue-400">-1</span>
          </div>
        <div className="flex items-center gap-8">
            <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-gray-400 hover:text-[#4a9eff] text-[14px] tracking-wide border border-[#1e2d3d] hover:border-[#4a9eff]/40 rounded-lg px-4 py-2 transition-colors">← Back</button>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center gap-10 px-8 z-10">
        <div className="w-[360px] bg-[#0d1117] border border-[#1e2d3d] rounded-2xl overflow-hidden flex-shrink-0">
          <div className="flex border-b border-[#1e2d3d]">
            <button onClick={() => setMode("login")} className={`flex-1 py-3 text-sm font-medium tracking-wide transition-colors ${mode === "login" ? "text-[#4a9eff] border-b-2 border-[#4a9eff] bg-[#0d1117]": "text-gray-500 hover:text-gray-300"}`}>Login</button>
            <button onClick={() => setMode("signup")} className={`flex-1 py-3 text-sm font-medium tracking-wide transition-colors ${ mode === "signup" ? "text-[#4a9eff] border-b-2 border-[#4a9eff] bg-[#0d1117]" : "text-gray-500 hover:text-gray-300" }`} >Sign Up</button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <p className="text-white font-semibold text-lg mb-1">{mode === "login" ? "Welcome back" : "Create account"}</p>
              <p className="text-gray-500 text-xs">{mode === "login"? "Login into your memories": "Start creating memories today"}</p>
            </div>
            {mode === "signup" && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} type="text" placeholder="John Doe" className="w-full bg-[#131c2b] border border-[#1e2d3d] rounded-lg px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-[#4a9eff]/50 transition-colors placeholder-gray-600"/>
              </div>
            )}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="w-full bg-[#131c2b] border border-[#1e2d3d] rounded-lg px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-[#4a9eff]/50 transition-colors placeholder-gray-600"  />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" className="w-full bg-[#131c2b] border border-[#1e2d3d] rounded-lg px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-[#4a9eff]/50 transition-colors placeholder-gray-600"  />
            </div>

            {mode === "signup" && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Confirm Password</label>
                <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" placeholder="••••••••" className="w-full bg-[#131c2b] border border-[#1e2d3d] rounded-lg px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-[#4a9eff]/50 transition-colors placeholder-gray-600"/>
              </div>
            )}
            {mode === "login" && (<div className="flex justify-end"><button className="text-xs text-[#4a9eff] hover:text-[#00e5ff] transition-colors">Forgot password?</button></div>)}
            <button onClick={() => navigate("/homepage")} className="w-full bg-[#4a9eff] hover:bg-[#3a8eef] text-white py-2.5 rounded-lg text-sm font-medium transition-colors">{mode === "login" ? "Sign In" : "Create Account"}</button>
            <p className="text-center text-xs text-gray-500">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-[#4a9eff] hover:text-[#00e5ff] transition-colors">{mode === "login" ? "Sign up" : "Log in"} </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}