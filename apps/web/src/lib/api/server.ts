import { getSystemStatusApiV1SystemStatusGet } from "@pinjie/api-client";
import type { SystemStatus } from "@pinjie/api-client";
import { createClient } from "@pinjie/api-client/client";

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
