import { fetchInitialSystemStatus } from "@/lib/api/server";

import { SystemStatusCard } from "@/features/system/SystemStatusCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const status = await fetchInitialSystemStatus();
  return (
    <main className="page-shell">
      <SystemStatusCard initialStatus={status} />
    </main>
  );
}
