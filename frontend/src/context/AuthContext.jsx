import { useEffect, useMemo, useState } from "react";
import { getUserRole } from "../lib/roles";
import { AuthContext } from "./auth-context";
import { supabase } from "../lib/supabase";

const API_BASE_URL = "http://localhost:8000";

const buildUserFromSupabase = (supabaseUser) => {
  if (!supabaseUser) return null;

  const metadata = supabaseUser.user_metadata || {};
  const role = metadata.role || "patient";

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    user_metadata: {
      role,
      full_name: metadata.full_name || "",
    },
    app_metadata: {
      role,
      ...(supabaseUser.app_metadata || {}),
    },
  };
};

const persistAuthState = (session) => {
  if (!session) {
    window.localStorage.removeItem("access_token");
    window.localStorage.removeItem("user_role");
    window.localStorage.removeItem("user_email");
    window.localStorage.removeItem("user_full_name");
    window.localStorage.removeItem("full_name");
    window.localStorage.removeItem("current_mood");
    return;
  }

  const token = session.access_token;
  const role = (session.user?.user_metadata?.role) || "patient";
  const email = session.user?.email || "";
  const fullName = session.user?.user_metadata?.full_name || "";

  window.localStorage.setItem("access_token", token);
  window.localStorage.setItem("user_role", role);
  window.localStorage.setItem("user_email", email);
  window.localStorage.setItem("user_full_name", fullName);
  window.localStorage.setItem("full_name", fullName);
};

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  /* Listen for stale-session from api.js */
  useEffect(() => {
    window.addEventListener("stale-session", () => supabase.auth.signOut());
  }, []);

  /* Restore a previous Supabase session on first mount */
  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session: activeSession } }) => {
        if (!isMounted) return;

        if (activeSession) {
          persistAuthState(activeSession);
          setSession({ access_token: activeSession.access_token });
          setUser(buildUserFromSupabase(activeSession.user));
        } else {
          /* No valid Supabase session — clear any stale data that
             readStoredSession() may have placed in React state or
             localStorage from a previous auth flow. */
          persistAuthState(null);
          setSession(null);
          setUser(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          persistAuthState(null);
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      });

        const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (newSession) {
          persistAuthState(newSession);
          setSession({ access_token: newSession.access_token });
          setUser(buildUserFromSupabase(newSession.user));
        } else {
          persistAuthState(null);
          setSession(null);
          setUser(null);
        }
      }
    );

    /* When api.js detects a 401 it dispatches a "stale-session" event.
       We sign out of Supabase so the session isn't restored on reload. */
    const handleStaleSession = () => {
      supabase.auth.signOut();
    };
    window.addEventListener("stale-session", handleStaleSession);

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("stale-session", handleStaleSession);
    };
  }, []);

  /* Login via Supabase Auth */
  const login = async ({ email, password }) => {
    setAuthError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      const message = error.message || "Incorrect email or password.";
      setAuthError(message);
      throw new Error(message);
    }

    const role = data.user?.user_metadata?.role || "patient";
    const nextUser = buildUserFromSupabase(data.user);

    persistAuthState(data.session);
    setSession({ access_token: data.session.access_token });
    setUser(nextUser);

    return {
      access_token: data.session.access_token,
      role,
      user: nextUser,
      session: { access_token: data.session.access_token },
    };
  };

  /* Signup via Supabase Auth + backend profile setup */
  const signup = async ({ email, password, full_name, role }) => {
    setAuthError("");

    const normalizedRole = (role || "patient").trim().toLowerCase();
    if (!["patient", "caretaker"].includes(normalizedRole)) {
      const message = "Role must be either patient or caretaker.";
      setAuthError(message);
      throw new Error(message);
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name,
          role: normalizedRole,
        },
      },
    });

    if (error) {
      const message = error.message || "Unable to create account.";
      setAuthError(message);
      throw new Error(message);
    }

        const supabaseUser = data.user;
    if (!supabaseUser) {
      /* Supabase created the account but email confirmation is required.
         Tell the caller via the return shape so LogSignPage can show the
         confirmation message.  We don't throw — the signup itself succeeded. */
      return {
        access_token: "",
        role: normalizedRole,
        user: null,
        session: null,
      };
    }

    if (data.session) {
      persistAuthState(data.session);
      setSession({ access_token: data.session.access_token });
      setUser(buildUserFromSupabase(supabaseUser));

      /* Best-effort: ensure the FastAPI in-memory profile has the role */
      try {
        await fetch(`${API_BASE_URL}/auth/setup-profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({
            full_name,
            role: normalizedRole,
          }),
        });
      } catch {
        /* Non-fatal — backend lazily creates the profile on first request */
      }
    } else {
      /* User created but no session (email confirmation required).
         Clear any stale session state. */
      persistAuthState(null);
      setSession(null);
      setUser(null);
    }

    return {
      access_token: data.session?.access_token || "",
      role: normalizedRole,
      user: buildUserFromSupabase(supabaseUser),
      session: data.session
        ? { access_token: data.session.access_token }
        : null,
    };
  };

  /* Logout */
  const logout = async () => {
    setAuthError("");
    await supabase.auth.signOut();
    persistAuthState(null);
    setSession(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      session,
      user,
      currentUser: user,
      loading,
      authError,

      login,
      signup,
      logout,

      getRole: () => getUserRole(user),

      isAuthenticated: Boolean(session?.access_token && user),
    }),
    [session, user, loading, authError]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}