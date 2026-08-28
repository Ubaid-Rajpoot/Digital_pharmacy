"use client";

// ============================================================
// MEDORA CONTROL CENTRE — client data layer
// Every page talks to the API through these hooks; nothing is
// hardcoded in the UI. Swap the backend later without touching
// components.
// ============================================================

/* eslint-disable react-hooks/set-state-in-effect */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "./ui";

export type ListParams = {
  search?: string;
  filters?: Record<string, unknown>;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export function qstring(params?: ListParams): string {
  if (!params) return "?q={}";
  const clean: Record<string, unknown> = {};
  if (params.search) clean.search = params.search;
  if (params.filters && Object.keys(params.filters).length) clean.filters = params.filters;
  if (params.sort) clean.sort = params.sort;
  if (params.dir) clean.dir = params.dir;
  if (params.page && params.page > 1) clean.page = params.page;
  if (params.pageSize && params.pageSize !== 10) clean.pageSize = params.pageSize;
  return "?q=" + encodeURIComponent(JSON.stringify(clean));
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
      // Never let a request hang the UI indefinitely; callers may pass
      // their own signal to override the 30 s default.
      signal: init?.signal ?? AbortSignal.timeout(30_000),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      throw new ApiError("Request timed out. The server took too long to respond.", 408);
    }
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError("Network error. Please check your connection and try again.", 0);
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* empty */
  }
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: string }).error)
        : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return body as T;
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ------------------------------------------------------------
// Auth context
// ------------------------------------------------------------

type AuthUser = { id: number; name: string; email: string; role: string; avatar: string };
type SummaryCounts = {
  pendingOrders: number; lowStock: number; dealerPending: number; refundRequests: number;
  reviewsPending: number; supportOpen: number; unread: number;
};
type SummaryNotification = { id: number; type: string; title: string; body: string; at: string; read: boolean; href: string };

type AuthValue = {
  user: AuthUser | null;
  modules: string[];
  counts: SummaryCounts | null;
  notifications: SummaryNotification[];
  loading: boolean;
  can: (action: string) => boolean;
  canModule: (module: string) => boolean;
  logout: () => Promise<void>;
  refreshSummary: () => void;
};

const AuthCtx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [modules, setModules] = useState<string[]>([]);
  const [counts, setCounts] = useState<SummaryCounts | null>(null);
  const [notifications, setNotifications] = useState<SummaryNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchSummary = useCallback(async () => {
    try {
      const s = await api<{ signedIn: boolean; counts: SummaryCounts; notifications: SummaryNotification[]; user: AuthUser }>("/api/admin/summary");
      if (s.signedIn) {
        setCounts(s.counts);
        setNotifications(s.notifications);
        setUser((u) => u ?? s.user);
      }
    } catch {
      /* summary is best-effort */
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await api<{ signedIn: boolean; user: AuthUser; modules: string[] }>("/api/admin/auth/me");
        if (me.signedIn) {
          setUser(me.user);
          setModules(me.modules);
        }
      } catch {
        /* 401 */
      } finally {
        setLoading(false);
      }
      fetchSummary();
    })();
  }, [fetchSummary]);

  const canModule = useCallback(
    (module: string) => user === null || modules.length === 0 || modules.includes(module),
    [user, modules]
  );
  const can = useCallback((action: string) => modules.includes(action.split(".")[0]), [modules]);

  const logout = useCallback(async () => {
    try {
      await api("/api/admin/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    toast("Signed out. See you soon!", "info");
    window.location.href = "/admin/login";
  }, [toast]);

  const value = useMemo<AuthValue>(
    () => ({ user, modules, counts, notifications, loading, can, canModule, logout, refreshSummary: fetchSummary }),
    [user, modules, counts, notifications, loading, can, canModule, logout, fetchSummary]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ------------------------------------------------------------
// List / item hooks
// ------------------------------------------------------------

export function useList<T extends { id: number }>(resource: string, params?: ListParams) {
  const [data, setData] = useState<ListResult<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const toast = useToast();

  const debounced = useDebounce(params, 250);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api<ListResult<T>>(`/api/admin/${resource}${qstring(debounced)}`)
      .then((d) => {
        if (alive) {
          setData(d);
          setError(null);
        }
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [resource, JSON.stringify(debounced), tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  const updateLocal = useCallback(
    (mut: (rows: T[]) => T[]) => {
      setData((d) => (d ? { ...d, items: mut(d.items) } : d));
    },
    []
  );

  const toastError = useCallback(
    (e: unknown) => toast(e instanceof Error ? e.message : "Something went wrong", "error"),
    [toast]
  );

  return { data, loading, error, refetch, updateLocal, toastError };
}

export function useItem<T>(resource: string, id: number | null, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!id || !enabled) {
      setData(null);
      return;
    }
    let alive = true;
    setLoading(true);
    api<T>(`/api/admin/${resource}/${id}`)
      .then((d) => alive && (setData(d), setError(null)))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [resource, id, enabled, tick]);

  return { data, loading, error, refetch: () => setTick((t) => t + 1) };
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [JSON.stringify(value), delay]);
  return debounced;
}

// ------------------------------------------------------------
// Mutations
// ------------------------------------------------------------

export function useMutate(resource: string, opts?: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const run = useCallback(
    async (method: string, path: string, body?: unknown, successMsg?: string) => {
      setLoading(true);
      try {
        const res = await api<unknown>(path, {
          method,
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        if (successMsg) toast(successMsg);
        opts?.onSuccess?.();
        return { ok: true as const, data: res };
      } catch (e) {
        toast(e instanceof Error ? e.message : "Something went wrong", "error");
        return { ok: false as const, error: e instanceof Error ? e.message : "error" };
      } finally {
        setLoading(false);
      }
    },
    [toast, opts]
  );

  const create = useCallback(
    (payload: Record<string, unknown>, msg = "Created successfully") =>
      run("POST", `/api/admin/${resource}`, payload, msg),
    [resource, run]
  );
  const update = useCallback(
    (id: number, payload: Record<string, unknown>, msg = "Changes saved") =>
      run("PATCH", `/api/admin/${resource}/${id}`, payload, msg),
    [resource, run]
  );
  const remove = useCallback(
    (id: number, msg = "Deleted") => run("DELETE", `/api/admin/${resource}/${id}`, undefined, msg),
    [resource, run]
  );
  const bulk = useCallback(
    (action: string, ids: number[], payload?: Record<string, unknown>, msg?: string) =>
      run("POST", `/api/admin/${resource}/bulk`, { action, ids, payload }, msg ?? `Updated ${ids.length} records`),
    [resource, run]
  );

  return { create, update, remove, bulk, run, loading };
}

// ------------------------------------------------------------
// Stats & summary
// ------------------------------------------------------------

export type DashboardStats = {
  kpis: Record<string, number>;
  charts: {
    salesByMonth: { label: string; revenue: number; orders: number }[];
    revenue: { label: string; actual: number; target: number }[];
    ordersByDay: { label: string; orders: number; revenue: number }[];
    topProducts: { id: number; name: string; image: string; sold: number; revenue: number; stock: number; sku: string }[];
    topCategories: { id: number; name: string; revenue: number; orders: number }[];
    customerGrowth: { label: string; newCustomers: number; total: number }[];
    ordersByStatus: Record<string, number>;
    warehouseUtil: { id: number; name: string; city: string; used: number; capacity: number; pct: number; status: string }[];
  };
  alerts: {
    stockAlerts: { id: number; name: string; sku: string; image: string; stock: number; lowStockAlert: number }[];
    reviewsPending: number; refundRequests: number; supportOpen: number; dealerPending: number; unreadNotifications: number;
  };
  recentOrders: { id: number; number: string; customerName: string; total: number; status: string; paymentMethod: string; createdAt: string }[];
};

export function useStats() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    api<DashboardStats>("/api/admin/stats")
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tick]);
  return { data, loading, refetch: () => setTick((t) => t + 1) };
}

// ------------------------------------------------------------
// CSV / Excel export helper
// ------------------------------------------------------------

export async function exportResource(resource: string, format: "csv" | "xlsx", params?: ListParams) {
  const url = `/api/admin/export?resource=${resource}&format=${format}${qstring(params ?? {})}`;
  const res = await fetch(url);
  if (!res.ok) {
    let msg = "Export failed";
    try {
      const b = await res.json();
      msg = b.error ?? msg;
    } catch {
      /* empty */
    }
    throw new ApiError(msg, res.status);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match?.[1] ?? `medora-${resource}.${format === "xlsx" ? "xls" : "csv"}`;
  const urlObj = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = urlObj;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(urlObj);
}