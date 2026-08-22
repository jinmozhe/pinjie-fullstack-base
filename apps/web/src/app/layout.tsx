import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { Providers } from "./providers";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const publicOrigin = process.env.WEB_PUBLIC_ORIGIN ?? "http://localhost:3000";
  return {
    metadataBase: new URL(publicOrigin),
    title: { default: "Pinjie", template: "%s | Pinjie" },
    description: "通用全栈应用基础",
    alternates: { canonical: "/" },
  };
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
