export const API_BASE_URL = "http://localhost:8000";

export const api = {
  get: async (path, options = {}) => {const response = await fetch(`${API_BASE_URL}${path}`, {...options,headers: {  ...(options.headers || {}),},});
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      const error = typeof data === "object" && data !== null ? data.detail || data.message || "Request failed" : data;
      throw new Error(error || "Request failed");
    }
    return data;
  },

  post: async (path, body, options = {}) => {const response = await fetch(`${API_BASE_URL}${path}`, {method: "POST",headers: {"Content-Type": "application/json",...(options.headers || {}),},body: JSON.stringify(body),...options,});
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      const error = typeof data === "object" && data !== null ? data.detail || data.message || "Request failed" : data;
      throw new Error(error || "Request failed");
    }
    return data;
  },

  put: async (path, body, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {method: "PUT",headers: {"Content-Type": "application/json",...(options.headers || {}),},body: JSON.stringify(body),...options,});
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      const error = typeof data === "object" && data !== null ? data.detail || data.message || "Request failed" : data;
      throw new Error(error || "Request failed");
    }
    return data;
  },
};

export default api;
