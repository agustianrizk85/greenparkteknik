import type { AuthUser, Dashboard, MetaItem, ProgressTrend, Quality } from "../types";

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

  // --- Singletons ---
  /** Read the cumulative plan-vs-actual progress trend. */
  progressTrend: () => request<ProgressTrend>("GET", "/progress-trend"),
  /** Replace the whole progress trend (weeks / plan / actual). */
  updateProgressTrend: (body: ProgressTrend) => request<ProgressTrend>("PUT", "/progress-trend", body),
  /** Read the quality / defect summary singleton. */
  quality: () => request<Quality>("GET", "/quality"),
  /** Replace the quality / defect summary singleton. */
  updateQuality: (body: Quality) => request<Quality>("PUT", "/quality", body),

  // --- Reference / classification lists (read + replace whole list) ---
  vendorStatusMeta: () => request<MetaItem[]>("GET", "/vendor-status-meta"),
  updateVendorStatusMeta: (body: MetaItem[]) => request<MetaItem[]>("PUT", "/vendor-status-meta", body),
  complaintMeta: () => request<MetaItem[]>("GET", "/complaint-meta"),
  updateComplaintMeta: (body: MetaItem[]) => request<MetaItem[]>("PUT", "/complaint-meta", body),
  siteChecklist: () => request<string[]>("GET", "/site-checklist"),
  updateSiteChecklist: (body: string[]) => request<string[]>("PUT", "/site-checklist", body),

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
