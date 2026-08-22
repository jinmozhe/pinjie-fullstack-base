import { getSystemStatusApiV1SystemStatusGet } from "@pinjie/api-client";
import type { SystemStatus } from "@pinjie/api-client";
import type { UserPrincipalOut } from "@pinjie/api-client";
import { createClient } from "@pinjie/api-client/client";
import { cookies } from "next/headers";

const WEB_COOKIE_NAMES = new Set(["pinjie_web_access", "pinjie_web_refresh", "pinjie_web_csrf"]);

function webCookies(cookieHeader: string): string {
  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .filter((item) => WEB_COOKIE_NAMES.has(item.split("=", 1)[0] ?? ""))
    .join("; ");
}

export async function fetchInitialSystemStatus(): Promise<SystemStatus> {
  const baseURL = process.env.BACKEND_INTERNAL_URL;
  if (!baseURL) {
    return { status: "unavailable" };
  }
  const serverClient = createClient({ baseURL });
  try {
    const result = await getSystemStatusApiV1SystemStatusGet({ client: serverClient, throwOnError: true });
    return result.data.data;
  } catch {
    return { status: "unavailable" };
  }
}

export class ServerAuthError extends Error {
  constructor(public readonly status: number) {
    super("Server authentication request failed");
  }
}

export type ServerAuthenticationState = "authenticated" | "anonymous" | "unavailable";

export async function fetchCurrentUser(): Promise<UserPrincipalOut> {
  const baseURL = process.env.BACKEND_INTERNAL_URL;
  if (!baseURL) throw new ServerAuthError(503);
  const cookieStore = await cookies();
  const response = await fetch(new URL("/api/v1/users/me", baseURL), {
    cache: "no-store",
    headers: { accept: "application/json", cookie: webCookies(cookieStore.toString()) },
  });
  if (!response.ok) throw new ServerAuthError(response.status);
  const payload = (await response.json()) as { data: UserPrincipalOut };
  return payload.data;
}

export async function fetchAuthenticationState(): Promise<ServerAuthenticationState> {
  try {
    await fetchCurrentUser();
    return "authenticated";
  } catch (error) {
    if (error instanceof ServerAuthError && error.status === 401) return "anonymous";
    return "unavailable";
  }
}
