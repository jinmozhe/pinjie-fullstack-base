import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/AuthForm";

export const metadata: Metadata = { title: "注册 | Pinjie", robots: { index: false, follow: false } };
export default function RegisterPage() { return <AuthForm mode="register" />; }
