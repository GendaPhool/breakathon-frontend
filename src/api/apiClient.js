// ============================================================
// src/api/apiClient.js
// Direct HTTP client for the Breakathon backend API.
// All calls go to {API_BASE_URL}/api/apps/{APP_ID}/*
// ============================================================

const BASE_URL  = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const APP_ID    = import.meta.env.VITE_APP_ID || "default";
const TOKEN_KEY = "bat_marshal_token";

// ── Token helpers ─────────────────────────────────────────────
export const getToken   = ()  => localStorage.getItem(TOKEN_KEY);
export const setToken   = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = ()  => localStorage.removeItem(TOKEN_KEY);

// ── Core fetch wrapper ────────────────────────────────────────
async function request(method, path, body, multipart = false) {
  const token = getToken();
  // Marshal (has JWT) → /admin namespace. Participant/anonymous → /user namespace.
  const namespace = token ? "admin" : "user";
  const url = `${BASE_URL}/api/apps/${APP_ID}/${namespace}${path}`;

  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!multipart) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: multipart ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  // Backend wraps most responses as { success, message, data }.
  // Unwrap to `data` automatically so callers get the payload directly.
  // Endpoints that return raw arrays/objects (no `success` key) pass through unchanged.
  if (json && typeof json === "object" && !Array.isArray(json) && "success" in json && "data" in json) {
    return json.data;
  }

  return json;
}

// ── Auth ──────────────────────────────────────────────────────
export const auth = {
  login: async (email, password) => {
    const data = await request("POST", "/auth/login", { email, password });
    // backend returns { access_token, user } — not { token }
    if (data?.access_token) setToken(data.access_token);
    return data;
  },
  // Marshal-only login — same as login() but hits /admin/login, which
  // rejects non-MARSHAL accounts server-side.
  adminLogin: async (email, password) => {
    const data = await request("POST", "/admin/login", { email, password });
    if (data?.access_token) setToken(data.access_token);
    return data;
  },
  register: async ({ name, email, password }) => {
    const data = await request("POST", "/auth/register", { name, email, password });
    if (data?.access_token) setToken(data.access_token);
    return data;
  },
  me: async () => {
    // /auth/me returns the raw user object directly (not wrapped in { user: ... })
    return await request("GET", "/auth/me");
  },
  logout: () => { clearToken(); window.location.href = "/user/login"; },
  marshalLogout: () => { clearToken(); window.location.href = "/admin/login"; },
};

// ── Participant (user) auth ──────────────────────────────────
// No JWT issued — backend just validates email+phone against a checked-in,
// verified Registration and returns participant_id/name/registration_id.
export const userAuth = {
  login: (email, phone) => request("POST", "/user/login", { email, phone }),
};

// ── Entity helpers ────────────────────────────────────────────
function buildQueryString(filter, sort, limit) {
  const params = new URLSearchParams();
  if (filter) params.set("q", JSON.stringify(filter));
  if (sort)   params.set("sort", sort);
  if (limit)  params.set("limit", String(limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function entity(name) {
  const base = `/entities/${name}`;
  return {
    list:   (sort, limit)          => request("GET",   `${base}${buildQueryString(null, sort, limit)}`),
    filter: (filter, sort, limit)  => request("GET",   `${base}${buildQueryString(filter, sort, limit)}`),
    get:    (id)                   => request("GET",   `${base}/${id}`),
    create: (data)                 => request("POST",  base, data),
    update: (id, data)             => request("PATCH", `${base}/${id}`, data),
    delete: (id)                   => request("DELETE",`${base}/${id}`),
  };
}

export const entities = {
  Registration:  entity("Registration"),
  BugReport:     entity("BugReport"),
  EventSettings: entity("EventSettings"),
};

// ── Functions ─────────────────────────────────────────────────
export const functions = {
  invoke: (name, payload) => request("POST", `/functions/${name}`, payload),
};

// ── File upload ───────────────────────────────────────────────
export const uploadFile = async (file) => {
  const form = new FormData();
  form.append("file", file);
  const data = await request("POST", "/integrations/Core/UploadFile", form, true);
  return { file_url: data.file_url };
};
