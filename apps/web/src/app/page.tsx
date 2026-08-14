import { fetchInitialSystemStatus } from "@/lib/api/server";

import { SystemStatusCard } from "@/features/system/SystemStatusCard";
import { ArrowRight, LogIn, UserRoundPlus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const status = await fetchInitialSystemStatus();
  return (
    <main className="home-shell">
      <header className="home-header"><span className="wordmark">PINJIE</span><Link href="/account">用户中心 <ArrowRight size={16} /></Link></header>
      <section className="home-main" aria-labelledby="home-title">
        <div className="home-intro"><p className="kicker">FULLSTACK FOUNDATION</p><h1 id="home-title">通用账户与管理基础</h1><p>注册账户后进入用户中心，管理个人资料、密码和登录设备。管理能力通过独立控制台提供。</p><div className="home-actions"><Link className="primary-action" href="/login"><LogIn size={18} />登录</Link><Link className="secondary-action" href="/register"><UserRoundPlus size={18} />创建账户</Link></div></div>
        <SystemStatusCard initialStatus={status} />
      </section>
    </main>
  );
}
