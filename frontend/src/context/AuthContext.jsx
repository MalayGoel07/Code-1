import { useMemo, useState } from "react";
import { getUserRole } from "../lib/roles";
import { AuthContext } from "./auth-context";

const API_BASE_URL = "http://localhost:8000";

const readStoredSession = () => {
  const token = window.localStorage.getItem("access_token");
  if (!token) {
    return { session: null, user: null };
  }

  const role = window.localStorage.getItem("user_role") || "patient";
  const email = window.localStorage.getItem("user_email") || "";
  const fullName = window.localStorage.getItem("user_full_name") || "";

  const user = {
    email,
    user_metadata: {
      role,
      full_name: fullName,
    },
    app_metadata: {
      role,
    },
  };

  return {
    session: { access_token: token },
    user,
  };
};

const persistAuthState = (token, role, userData = {}) => {
  if (!token) {
    window.localStorage.removeItem("access_token");
    window.localStorage.removeItem("user_role");
    window.localStorage.removeItem("user_email");
    window.localStorage.removeItem("user_full_name");
    return;
  }

  window.localStorage.setItem("access_token", token);
  window.localStorage.setItem("user_role", role || "patient");
  window.localStorage.setItem("user_email", userData.email || "");
  window.localStorage.setItem("user_full_name", userData.full_name || "");
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession().session);
  const [user, setUser] = useState(() => readStoredSession().user);
  const [loading] = useState(false);
  const [authError, setAuthError] = useState("");

  const login = async ({ email, password }) => {
    setAuthError("");

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: email,
        password,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.detail || "Incorrect email or password.";
      setAuthError(message);
      throw new Error(message);
    }

    const role = data.role || "patient";
    const nextUser = {
      email,
      user_metadata: {
        role,
        full_name: data.full_name || "",
      },
      app_metadata: {
        role,
      },
    };

    persistAuthState(data.access_token, role, {
      email,
      full_name: data.full_name || "",
    });

    setSession({ access_token: data.access_token });
    setUser(nextUser);

    return {
      ...data,
      user: nextUser,
      session: { access_token: data.access_token },
    };
  };

  const signup = async ({
    email,
    password,
    full_name,
    role,
  }) => {
    setAuthError("");

    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: email,
        email,
        full_name,
        password,
        role,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.detail || "Unable to create account.";
      setAuthError(message);
      throw new Error(message);
    }

    const normalizedRole = data.role || role || "patient";
    const nextUser = {
      email,
      user_metadata: {
        role: normalizedRole,
        full_name,
      },
      app_metadata: {
        role: normalizedRole,
      },
    };

    persistAuthState(data.access_token, normalizedRole, {
      email,
      full_name,
    });

    setSession({ access_token: data.access_token });
    setUser(nextUser);

    return {
      ...data,
      user: nextUser,
      session: { access_token: data.access_token },
    };
  };

  const logout = async () => {
    setAuthError("");

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

      isAuthenticated: Boolean(session?.access_token || session),
    }),
    [session, user, loading, authError]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}