export const API_BASE_URL = "http://localhost:8000";

const getStoredAuthToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("access_token");
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
};

const clearStaleSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  const protectedPaths = ["/homepage", "/game", "/pattern-game", "/elder-ai", "/reminder", "/medications", "/profile", "/story", "/patient/activities", "/caretaker", "/caretaker/report", "/caretaker/activities", "/caretaker/reminders", "/caretaker/help", "/caretaker/profile", "/caretaker/settings"];

      window.localStorage.removeItem("access_token");
  window.localStorage.removeItem("user_role");
  window.localStorage.removeItem("user_email");
  window.localStorage.removeItem("user_full_name");
  window.localStorage.removeItem("full_name");
  window.localStorage.removeItem("current_mood");

  /* Notify AuthContext so it can sign out from Supabase too.
     Without this, supabase.auth.getSession() would restore the
     session on the next page load and we'd get a redirect loop. */
  window.dispatchEvent(new CustomEvent("stale-session"));

  if (protectedPaths.includes(window.location.pathname)) {
    window.location.href = "/logsign";
  }
};

const handleResponse = async (response) => {
  const data = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearStaleSession();
    }

    const error =
      typeof data === "object" && data !== null
        ? data.detail || data.message || "Request failed"
        : data || "Request failed";
    throw new Error(error);
  }

  return data;
};

export const api = {
  request: async (path, options = {}) => {
    const token = getStoredAuthToken();
    const headers = {
      ...(options.headers || {}),
    };

    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    return handleResponse(response);
  },

  get: async (path, options = {}) => {
    return api.request(path, {
      ...options,
      method: "GET",
    });
  },

  post: async (path, body, options = {}) => {
    return api.request(path, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  },

  put: async (path, body, options = {}) => {
    return api.request(path, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  },

  delete: async (path, options = {}) => {
    return api.request(path, {
      ...options,
      method: "DELETE",
    });
  },
};

export default api;
