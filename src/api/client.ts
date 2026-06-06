import type { AuthUser, Dashboard } from "../types";

/** Backend base URL — override with VITE_API_BASE at build/dev time. */
const BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8083") + "/api";
const TOKEN_KEY = "gp_token";

/** Error carrying the HTTP status so callers can branch on it. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let token = localStorage.getItem(TOKEN_KEY) ?? "";

// Called when the server reports the session is no longer valid (401).
let onUnauthorized: () => void = () => {};

function setToken(value: string) {
  token = value;
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = "Bearer " + token;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    setToken("");
    onUnauthorized();
    throw new ApiError("Sesi berakhir — silakan login kembali.", 401);
  }
  if (!res.ok) {
    let detail = "";
    try {
      detail = ((await res.json()) as { error?: string }).error ?? "";
    } catch {
      /* no JSON body */
    }
    throw new ApiError(detail || `HTTP ${res.status}`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const api = {
  base: BASE,
  hasToken: () => !!token,
  setUnauthorizedHandler: (fn: () => void) => {
    onUnauthorized = fn;
  },

  // --- Auth ---
  login: async (username: string, password: string): Promise<AuthUser> => {
    const r = await request<LoginResponse>("POST", "/auth/login", { username, password });
    setToken(r.token);
    return r.user;
  },
  me: () => request<AuthUser>("GET", "/auth/me"),
  logout: async (): Promise<void> => {
    try {
      await request<void>("POST", "/auth/logout");
    } finally {
      setToken("");
    }
  },

  // --- Aggregate ---
  dashboard: () => request<Dashboard>("GET", "/dashboard"),

  // --- AI insight (OpenRouter, server-side key) ---
  insight: (scope: string) =>
    request<{ configured: boolean; insight: string; model?: string }>(
      "GET",
      `/insight?scope=${encodeURIComponent(scope)}`,
    ),
  aiConfig: () => request<{ configured: boolean; model: string }>("GET", "/ai/config"),
  aiModels: () => request<{ id: string; name: string }[]>("GET", "/ai/models"),
  setAiModel: (model: string) => request<{ model: string }>("PUT", "/ai/model", { model }),

  // --- Generic master-data CRUD ---
  list: <T>(resource: string) => request<T[]>("GET", `/${resource}`),
  create: <T>(resource: string, body: unknown) => request<T>("POST", `/${resource}`, body),
  update: <T>(resource: string, id: string, body: unknown) =>
    request<T>("PUT", `/${resource}/${encodeURIComponent(id)}`, body),
  remove: (resource: string, id: string) =>
    request<void>("DELETE", `/${resource}/${encodeURIComponent(id)}`),

  // --- Maintenance ---
  /** Restore the built-in example data set (collections + singletons). */
  reseed: () => request<{ status: string }>("POST", "/admin/seed"),
  /** Delete every editable record (singleton aggregates are kept). */
  clearData: () => request<{ status: string }>("POST", "/admin/clear"),
};
