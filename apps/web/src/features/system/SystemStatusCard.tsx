"use client";

import { useState } from "react";
import type { SystemStatus } from "@pinjie/api-client";

import { fetchSystemStatus } from "@/lib/api/client";

type Props = { initialStatus: SystemStatus };

export function SystemStatusCard({ initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function retry() {
    setLoading(true);
    setError(false);
    try {
      const nextStatus = await fetchSystemStatus();
      setStatus(nextStatus.status);
    } catch {
      setError(true);
      setStatus("unavailable");
    } finally {
      setLoading(false);
    }
  }

  const available = status === "available" && !error;
  return (
    <section className="status-panel" aria-labelledby="status-heading">
      <div className="status-panel__header">
        <div>
          <p className="eyebrow">Runtime foundation</p>
          <h1 id="status-heading">System status</h1>
        </div>
        <span className={`status-pill ${available ? "status-pill--ok" : "status-pill--error"}`}>
          {available ? "Available" : "Unavailable"}
        </span>
      </div>
      <p className="status-panel__copy">
        This business-neutral shell reports the shared application foundation before a derived project adds its own experience.
      </p>
      {error ? <p className="status-message status-message--error" role="alert">Backend is unavailable. Retry when the service is ready.</p> : null}
      <button className="status-action" type="button" onClick={retry} disabled={loading}>
        {loading ? "Checking..." : "Check again"}
      </button>
    </section>
  );
}
