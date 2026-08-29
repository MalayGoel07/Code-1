export const API_BASE_URL = "http://localhost:8000";

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
};

const handleResponse = async (response) => {
  const data = await parseResponse(response);

  if (!response.ok) {
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
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
      },
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
};

export default api;
