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

    if (resolvedRole === "caretaker") {
      navigate("/caretaker");
    } else {
      navigate("/homepage");
    }
  }, [isAuthenticated, user, navigate]);

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
      className="theme-page min-h-screen"
      style={{
        background: "#FBF8F2",
        color: "#20261F",
        fontFamily:
          "'Atkinson Hyperlegible', system-ui, sans-serif",
      }}
    >
      {/* Top navigation */}
      <nav
        className="border-b px-6 py-4"
        style={{
          borderColor: "#E4DCC8",
          background: "rgba(255,255,255,0.92)",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xl font-bold tracking-tight"
          >
            Maitri
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-full border-2 px-4 py-2 font-semibold transition hover:bg-white"
            style={{
              color: "#5B6459",
              borderColor: "#C9C2B2",
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="mb-7 text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                background: "#2F6F62",
              }}
            >
              <ShieldCheck
                className="h-7 w-7 text-white"
                strokeWidth={2}
              />
            </div>

            <h1 className="text-3xl font-bold">
              {mode === "login"
                ? "Welcome back"
                : "Create your account"}
            </h1>

            <p
              className="mt-2 text-base"
              style={{ color: "#5B6459" }}
            >
              {mode === "login"
                ? "Sign in to continue to Maitri."
                : "Create an account for your care journey."}
            </p>
          </div>

          {/* Card */}
          <div
            className="overflow-hidden rounded-3xl border-2 shadow-sm"
            style={{
              background: "#EFEEE6",
              borderColor: "#E4DCC8",
            }}
          >
            {/* Tabs */}
            <div
              className="grid grid-cols-2 border-b-2"
              style={{
                borderColor: "#E4DCC8",
              }}
            >
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="py-4 text-base font-bold transition"
                style={{
                  background:
                    mode === "login" ? "#FFFFFF" : "transparent",
                  color:
                    mode === "login"
                      ? "#2F6F62"
                      : "#5B6459",
                  borderBottom:
                    mode === "login"
                      ? "3px solid #2F6F62"
                      : "3px solid transparent",
                }}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="py-4 text-base font-bold transition"
                style={{
                  background:
                    mode === "signup"
                      ? "#FFFFFF"
                      : "transparent",
                  color:
                    mode === "signup"
                      ? "#2F6F62"
                      : "#5B6459",
                  borderBottom:
                    mode === "signup"
                      ? "3px solid #2F6F62"
                      : "3px solid transparent",
                }}
              >
                Sign Up
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6 sm:p-7"
            >
              {/* Full name */}
              {mode === "signup" && (
                <div>
                  <label
                    htmlFor="full-name"
                    className="mb-2 block text-sm font-semibold"
                    style={{ color: "#5B6459" }}
                  >
                    Full name
                  </label>

                  <input
                    id="full-name"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    className="w-full rounded-xl border-2 bg-white px-4 py-3 text-base outline-none transition focus:border-[#2F6F62]"
                    style={{
                      borderColor: "#C9C2B2",
                    }}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold"
                  style={{ color: "#5B6459" }}
                >
                  Email address
                </label>

                <input
                  id="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border-2 bg-white px-4 py-3 text-base outline-none transition focus:border-[#2F6F62]"
                  style={{
                    borderColor: "#C9C2B2",
                  }}
                />
              </div>

              {/* Role */}
              {mode === "signup" && (
                <fieldset>
                  <legend
                    className="mb-2 block text-sm font-semibold"
                    style={{ color: "#5B6459" }}
                  >
                    I am signing up as
                  </legend>

                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className="cursor-pointer rounded-xl border-2 bg-white p-3 transition"
                      style={{
                        borderColor:
                          role === "patient"
                            ? "#2F6F62"
                            : "#C9C2B2",
                        background:
                          role === "patient"
                            ? "#F3E7D0"
                            : "#FFFFFF",
                      }}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="patient"
                        checked={role === "patient"}
                        onChange={(e) =>
                          setRole(e.target.value)
                        }
                        className="sr-only"
                      />

                      <div className="font-bold">
                        Elder patient
                      </div>

                      <div
                        className="mt-1 text-xs"
                        style={{ color: "#5B6459" }}
                      >
                        For the person receiving care
                      </div>
                    </label>

                    <label
                      className="cursor-pointer rounded-xl border-2 bg-white p-3 transition"
                      style={{
                        borderColor:
                          role === "caretaker"
                            ? "#2F6F62"
                            : "#C9C2B2",
                        background:
                          role === "caretaker"
                            ? "#F3E7D0"
                            : "#FFFFFF",
                      }}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="caretaker"
                        checked={role === "caretaker"}
                        onChange={(e) =>
                          setRole(e.target.value)
                        }
                        className="sr-only"
                      />

                      <div className="font-bold">
                        Caretaker
                      </div>

                      <div
                        className="mt-1 text-xs"
                        style={{ color: "#5B6459" }}
                      >
                        For family or care providers
                      </div>
                    </label>
                  </div>
                </fieldset>
              )}

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold"
                  style={{ color: "#5B6459" }}
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete={
                      mode === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border-2 bg-white px-4 py-3 pr-12 text-base outline-none transition focus:border-[#2F6F62]"
                    style={{
                      borderColor: "#C9C2B2",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2"
                    style={{ color: "#5B6459" }}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              {mode === "login" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm font-semibold"
                    style={{ color: "#2F6F62" }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  className="rounded-xl border-2 p-3 text-sm font-medium"
                  style={{
                    color: "#7A2A2A",
                    background: "#FFF0F0",
                    borderColor: "#E5B1B1",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div
                  className="rounded-xl border-2 p-3 text-sm font-medium"
                  style={{
                    color: "#24594F",
                    background: "#EEF7F3",
                    borderColor: "#A9D4C7",
                  }}
                >
                  {success}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3.5 text-base font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: "#2F6F62",
                }}
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
              </button>

              {/* Switch */}
              <p
                className="text-center text-sm"
                style={{ color: "#5B6459" }}
              >
                {mode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() =>
                    switchMode(
                      mode === "login"
                        ? "signup"
                        : "login"
                    )
                  }
                  className="font-bold"
                  style={{ color: "#2F6F62" }}
                >
                  {mode === "login"
                    ? "Sign up"
                    : "Log in"}
                </button>
              </p>
            </form>
          </div>

          {/* Small footer */}
          <p
            className="mt-5 text-center text-xs"
            style={{ color: "#7A8178" }}
          >
            Your account is securely managed with Supabase.
          </p>
        </div>
      </main>
    </div>
  );
}