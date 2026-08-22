import type { SystemStatus } from "@pinjie/api-client";

import { apiRequest } from "@/lib/api/http";

export async function fetchSystemStatus(): Promise<SystemStatus> {
  return apiRequest<SystemStatus>("/api/v1/system/status");
}
