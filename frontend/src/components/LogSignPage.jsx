import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { getUserRole } from "../lib/roles";

export default function LogSignPage({ onNavigate }) {
  const [mode, setMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "signup" ? "signup" : "login";
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup, user, isAuthenticated } = useAuth();

  const navigate = useMemo(
    () =>
      onNavigate ??
      ((nextPath) => {
        window.location.href = nextPath;
      }),
    [onNavigate]
  );

  /*
   * Keep the URL in sync when switching between Login and Signup.
   */
  useEffect(() => {
    const nextUrl =
      mode === "signup" ? "/logsign?mode=signup" : "/logsign";

    const currentUrl =
      window.location.pathname + window.location.search;

    if (currentUrl !== nextUrl) {
      window.history.replaceState({}, "", nextUrl);
    }
  }, [mode]);

  /*
   * If an already authenticated user visits /logsign,
   * send them to the correct dashboard.
   */
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const resolvedRole = getUserRole(user);
    const targetPath = resolvedRole === "caretaker" ? "/caretaker" : "/homepage";

    if (window.location.pathname !== targetPath) {
      window.history.replaceState({}, "", targetPath);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [isAuthenticated, user]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
  };

  const validate = () => {
    if (!email.trim()) {
      return "Please enter your email address.";
    }

    if (!email.includes("@")) {
      return "Please enter a valid email address.";
    }

    if (!password) {
      return "Please enter your password.";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (mode === "signup" && !fullName.trim()) {
      return "Please enter your full name.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        /*
         * IMPORTANT:
         * Use the user returned from login().
         * Do NOT use the `user` state here because React state
         * may not have updated yet.
         */
        const data = await login({
          email: email.trim(),
          password,
        });

        const loggedInUser = data?.user;

        if (!loggedInUser) {
          throw new Error("Login succeeded, but the user session was not found.");
        }

        const resolvedRole = getUserRole(loggedInUser);

        if (resolvedRole === "caretaker") {
          navigate("/caretaker");
        } else {
          navigate("/homepage");
        }

        return;
      }

      /*
       * SIGN UP
       */
      const data = await signup({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role,
      });

      /*
       * Supabase can create the account without creating
       * an active session when email confirmation is enabled.
       */
      if (data?.user && !data?.session) {
        setSuccess(
          "Account created successfully. Please check your email and confirm your account before logging in."
        );

        setMode("login");
        setPassword("");
        setFullName("");
        setRole("patient");

        return;
      }

      /*
       * If email confirmation is disabled, Supabase may
       * immediately create a session.
       */
      if (data?.session && data?.user) {
        const newUser = data.user;
        const resolvedRole = getUserRole(newUser);

        navigate(
          resolvedRole === "caretaker"
            ? "/caretaker"
            : "/homepage"
        );

        return;
      }

      setSuccess(
        "Account created successfully. You can now log in."
      );

      setMode("login");
      setPassword("");
      setFullName("");
      setRole("patient");
    } catch (err) {
      console.error("Authentication error:", err);

      const message =
        err?.message ||
        "Something went wrong. Please try again.";

      /*
       * Make Supabase's common errors easier for users to understand.
       */
      if (
        message.toLowerCase().includes("email not confirmed")
      ) {
        setError(
          "Your email is not confirmed yet. Please check your inbox and confirm your email before logging in."
        );
      } else if (
        message.toLowerCase().includes("invalid login credentials")
      ) {
        setError(
          "Incorrect email or password."
        );
      } else if (
        message.toLowerCase().includes("user already registered")
      ) {
        setError(
          "An account with this email already exists. Try logging in instead."
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return null;
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#FBF8F2",
        color: "#20261F",
        fontFamily: "'Atkinson Hyperlegible', 'Segoe UI', sans-serif",
      }}
    >
      <nav className="border-b border-[#E4DCC8] bg-[#FFFDF9]/90 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2F6F62] text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-[#20261F]">Maitri</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-full border-2 border-[#C9C2B2] bg-white px-4 py-2 text-base font-semibold text-[#5B6459] shadow-sm transition hover:bg-[#F7F4EE]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
        </div>
      </nav>

      <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center justify-center px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden rounded-[32px] border border-[#E4DCC8] bg-[#F7F3EC] p-8 shadow-sm lg:block">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2F6F62] text-white shadow-sm">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#2F6F62]">Maitri Care</span>
            </div>

            <h1 className="text-4xl font-bold leading-tight text-[#20261F]">A calmer way to care and connect.</h1>
            <p className="mt-4 max-w-md text-xl leading-relaxed text-[#5B6459]">
              Simple support for older adults and their caregivers to stay connected, informed, and confident every day.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Clear reminders and daily support",
                "Easy access to games, stories, and talk",
                "A warm, readable experience built for comfort",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#E4DCC8] bg-white/60 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4F0EC] text-[#2F6F62] font-bold">✓</div>
                  <span className="text-lg font-medium text-[#20261F]">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="w-full max-w-md justify-self-center">
            <div className="mb-6 text-center lg:text-left">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#2F6F62] shadow-sm lg:mx-0">
                <ShieldCheck className="h-8 w-8 text-white" aria-hidden="true" />
              </div>
              <h2 className="text-4xl font-bold leading-none text-[#20261F]">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-[#5B6459]">
                {mode === "login"
                  ? "Sign in to continue to your care routine."
                  : "Set up your account to begin your care journey."}
              </p>
            </div>

            <div className="overflow-hidden rounded-[28px] border-2 border-[#E4DCC8] bg-[#EFEEE6] shadow-[0_20px_50px_rgba(47,111,98,0.08)]">
              <div className="grid grid-cols-2 border-b-2 border-[#E4DCC8] bg-[#F5F2EC]">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="py-4 text-lg font-bold transition duration-150"
                  style={{
                    background: mode === "login" ? "#FFFFFF" : "transparent",
                    color: mode === "login" ? "#2F6F62" : "#5B6459",
                    borderBottom: mode === "login" ? "3px solid #2F6F62" : "3px solid transparent",
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="py-4 text-lg font-bold transition duration-150"
                  style={{
                    background: mode === "signup" ? "#FFFFFF" : "transparent",
                    color: mode === "signup" ? "#2F6F62" : "#5B6459",
                    borderBottom: mode === "signup" ? "3px solid #2F6F62" : "3px solid transparent",
                  }}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
                {mode === "signup" && (
                  <div>
                    <label htmlFor="full-name" className="mb-2 block text-base font-semibold text-[#5B6459]">
                      Full name
                    </label>
                    <input
                      id="full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      className="w-full rounded-2xl border-2 border-[#C9C2B2] bg-white px-4 py-3.5 text-lg text-[#20261F] outline-none transition focus:border-[#2F6F62] focus:ring-4 focus:ring-[#E4F0EC]"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="mb-2 block text-base font-semibold text-[#5B6459]">
                    Email address
                  </label>
                  <input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border-2 border-[#C9C2B2] bg-white px-4 py-3.5 text-lg text-[#20261F] outline-none transition focus:border-[#2F6F62] focus:ring-4 focus:ring-[#E4F0EC]"
                  />
                </div>

                {mode === "signup" && (
                  <fieldset>
                    <legend className="mb-2 block text-base font-semibold text-[#5B6459]">I am signing up as</legend>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className="cursor-pointer rounded-2xl border-2 p-3 transition-all"
                        style={{
                          borderColor: role === "patient" ? "#2F6F62" : "#C9C2B2",
                          background: role === "patient" ? "#F3E7D0" : "#FFFFFF",
                          boxShadow: role === "patient" ? "0 8px 16px rgba(47,111,98,0.08)" : "none",
                        }}
                      >
                        <input type="radio" name="role" value="patient" checked={role === "patient"} onChange={(e) => setRole(e.target.value)} className="sr-only" />
                        <div className="text-base font-bold text-[#20261F]">Elder patient</div>
                        <div className="mt-1 text-sm text-[#5B6459]">For the person receiving care</div>
                      </label>

                      <label
                        className="cursor-pointer rounded-2xl border-2 p-3 transition-all"
                        style={{
                          borderColor: role === "caretaker" ? "#2F6F62" : "#C9C2B2",
                          background: role === "caretaker" ? "#F3E7D0" : "#FFFFFF",
                          boxShadow: role === "caretaker" ? "0 8px 16px rgba(47,111,98,0.08)" : "none",
                        }}
                      >
                        <input type="radio" name="role" value="caretaker" checked={role === "caretaker"} onChange={(e) => setRole(e.target.value)} className="sr-only" />
                        <div className="text-base font-bold text-[#20261F]">Caretaker</div>
                        <div className="mt-1 text-sm text-[#5B6459]">For family or care providers</div>
                      </label>
                    </div>
                  </fieldset>
                )}

                <div>
                  <label htmlFor="password" className="mb-2 block text-base font-semibold text-[#5B6459]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      placeholder="At least 6 characters"
                      className="w-full rounded-2xl border-2 border-[#C9C2B2] bg-white px-4 py-3.5 pr-12 text-lg text-[#20261F] outline-none transition focus:border-[#2F6F62] focus:ring-4 focus:ring-[#E4F0EC]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#5B6459] transition hover:bg-[#F7F4EE]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {mode === "login" && (
                  <div className="flex justify-end">
                    <button type="button" className="text-base font-semibold text-[#2F6F62] underline-offset-4 hover:underline">
                      Forgot password?
                    </button>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border-2 border-[#E5B1B1] bg-[#FFF0F0] px-4 py-3 text-base font-medium text-[#7A2A2A]">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl border-2 border-[#A9D4C7] bg-[#EEF7F3] px-4 py-3 text-base font-medium text-[#24594F]">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#2F6F62] py-4 text-lg font-bold text-white shadow-[0_12px_20px_rgba(47,111,98,0.2)] transition hover:bg-[#245C54] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
                </button>

                <p className="text-center text-base text-[#5B6459]">
                  {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                    className="font-bold text-[#2F6F62] underline-offset-4 hover:underline"
                  >
                    {mode === "login" ? "Sign up" : "Log in"}
                  </button>
                </p>
              </form>
            </div>

            <p className="mt-5 text-center text-sm text-[#7A8178]">Secure session-based access for your patient and caregiver experience.</p>
          </section>
        </div>
      </main>
    </div>
  );
}