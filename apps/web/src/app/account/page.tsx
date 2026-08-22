import type { Metadata } from "next";
import { AccountCenter } from "@/features/account/AccountCenter";
import { AccountSessionRecovery } from "@/features/account/AccountSessionRecovery";
import { ServerAuthError, fetchCurrentUser } from "@/lib/api/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "用户中心", robots: { index: false, follow: false } };

export default async function AccountPage() {
  try { return <AccountCenter initialUser={await fetchCurrentUser()} />; }
  catch (error) { if (error instanceof ServerAuthError && error.status === 401) return <AccountSessionRecovery />; throw error; }
}
