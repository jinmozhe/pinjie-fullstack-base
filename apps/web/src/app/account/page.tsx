import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountCenter } from "@/features/account/AccountCenter";
import { ServerAuthError, fetchCurrentUser } from "@/lib/api/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "用户中心", robots: { index: false, follow: false } };

export default async function AccountPage() {
  try { return <AccountCenter initialUser={await fetchCurrentUser()} />; }
  catch (error) { if (error instanceof ServerAuthError && error.status === 401) redirect("/login?reason=session-required"); throw error; }
}
