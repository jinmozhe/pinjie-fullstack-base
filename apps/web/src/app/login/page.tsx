import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/AuthForm";

export const metadata: Metadata = { title: "登录 | Pinjie", robots: { index: false, follow: false } };
export default function LoginPage() { return <AuthForm mode="login" />; }
