"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { webAuthApi } from "@/features/auth";

export function AccountSessionRecovery() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void webAuthApi.refresh().then(
      () => router.refresh(),
      () => {
        router.replace("/login?reason=session-required");
        router.refresh();
      },
    );
  }, [router]);

  return (
    <main className="loading-page" role="status" aria-live="polite">
      <LoaderCircle aria-hidden="true" />
      <span>正在恢复会话</span>
    </main>
  );
}
