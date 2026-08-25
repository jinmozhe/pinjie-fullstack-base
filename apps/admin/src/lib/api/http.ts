type ApiEnvelope<T> = {
  code: string;
  message: string;
  data: T;
  request_id: string;
};

type ApiErrorBody = {
  code?: string;
  message?: string;
  request_id?: string;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
    public readonly retryAfter?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const API_BASE = (process.env.VITE_API_URL || window.location.origin).replace(/\/$/, "");
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const AUTH_RETRY_EXCLUDED = new Set([
  "/api/v1/admin/auth/login",
  "/api/v1/admin/auth/refresh",
  "/api/v1/admin/auth/logout",
]);
let refreshPromise: Promise<boolean> | null = null;

function readCookie(name: string): string | undefined {
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie.split("; ").find((value) => value.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : undefined;
}

async function parseError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody = {};
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = {};
  }
  return new ApiError(
    response.status,
    body.code ?? "REQUEST_FAILED",
    body.message ?? "请求未完成，请稍后重试",
    body.request_id,
    response.headers.get("retry-after") ?? undefined,
  );
}

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const csrf = readCookie("pinjie_admin_csrf");
      const response = await fetch(`${API_BASE}/api/v1/admin/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: csrf ? { "X-CSRF-Token": csrf } : undefined,
      });
      return response.ok;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { retryAuth?: boolean; confirmationToken?: string } = {},
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  const isFormData = typeof globalThis.FormData !== "undefined" && init.body instanceof globalThis.FormData;
  if (init.body && !isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (!SAFE_METHODS.has(method)) {
    const csrf = readCookie("pinjie_admin_csrf");
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }
  if (options.confirmationToken) headers.set("X-Admin-Confirmation", options.confirmationToken);

  const response = await fetch(`${API_BASE}${path}`, { ...init, method, headers, credentials: "include" });
  if (response.status === 401 && options.retryAuth !== false && !AUTH_RETRY_EXCLUDED.has(path)) {
    if (await refreshSession()) return apiRequest<T>(path, init, { ...options, retryAuth: false });
  }
  if (!response.ok) throw await parseError(response);
  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

export function jsonBody(value: unknown): string {
  return JSON.stringify(value);
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "请求未完成，请稍后重试";
}
