import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { getUserRole } from "../lib/roles";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        if (!mounted) return;

        setAuthError(
          error?.message || "Unable to restore your session."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        setAuthError("");
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async ({ email, password }) => {
    setAuthError("");

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    return data;
  };

  const signup = async ({
    email,
    password,
    full_name,
    role,
  }) => {
    setAuthError("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role,
        },
      },
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    return data;
  };

  const logout = async () => {
    setAuthError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(error.message);
      throw error;
    }

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

      isAuthenticated: Boolean(session),
    }),
    [session, user, loading, authError]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}