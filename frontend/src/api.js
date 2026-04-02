const BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function api(path, options = {}) {
  const headers = { Accept: "application/json", ...options.headers };
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const r = await fetch(`${BASE}${path}`, { ...options, headers });

  if (r.status === 204) return null;

  const text = await r.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || r.statusText };
  }

  if (!r.ok) {
    throw new ApiError(data.error || r.statusText, r.status, data.code);
  }

  return data;
}

export const authApi = {
  login: (email, password) =>
    api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (body) =>
    api("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  me: () => api("/api/auth/me"),
};

export const dashboardApi = {
  summary: (params = {}) => {
    const q = new URLSearchParams(params);
    const s = q.toString();
    return api(`/api/dashboard/summary${s ? `?${s}` : ""}`);
  },
  recent: (params = {}) => {
    const q = new URLSearchParams(params);
    const s = q.toString();
    return api(`/api/dashboard/recent${s ? `?${s}` : ""}`);
  },
  trends: (params = {}) => {
    const q = new URLSearchParams(params);
    const s = q.toString();
    return api(`/api/dashboard/trends${s ? `?${s}` : ""}`);
  },
};

export const recordsApi = {
  list: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
    });
    const s = q.toString();
    return api(`/api/records${s ? `?${s}` : ""}`);
  },
  get: (id) => api(`/api/records/${id}`),
  create: (body) => api("/api/records", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) =>
    api(`/api/records/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id) => api(`/api/records/${id}`, { method: "DELETE" }),
};

export const usersApi = {
  list: () => api("/api/users"),
  create: (body) => api("/api/users", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) =>
    api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id) => api(`/api/users/${id}`, { method: "DELETE" }),
};
