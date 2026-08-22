import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/AuthForm";

export const metadata: Metadata = { title: "登录", robots: { index: false, follow: false } };
export default function LoginPage() { return <AuthForm mode="login" />; }
