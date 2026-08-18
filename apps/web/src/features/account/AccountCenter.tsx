"use client";

import type { SessionRead, UserPrincipalOut } from "@pinjie/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, KeyRound, Laptop, LogOut, ShieldCheck, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { webAuthApi } from "@/features/auth";
import { errorMessage } from "@/lib/api/http";

type Section = "profile" | "security" | "sessions" | "danger";
const sections: Array<{ id: Section; label: string; icon: ReactNode }> = [
  { id: "profile", label: "个人资料", icon: <UserRound size={17} /> },
  { id: "security", label: "密码安全", icon: <KeyRound size={17} /> },
  { id: "sessions", label: "登录设备", icon: <Laptop size={17} /> },
  { id: "danger", label: "注销账户", icon: <AlertTriangle size={17} /> },
];

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function StatusMessage({ error, success }: { error?: unknown; success?: string }) {
  if (error) return <div className="form-alert" role="alert">{errorMessage(error)}</div>;
  if (success) return <div className="form-success" role="status"><Check size={17} />{success}</div>;
  return null;
}

export function AccountCenter({ initialUser }: { initialUser: UserPrincipalOut }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<Section>("profile");
  const [notice, setNotice] = useState<string>();
  const logout = useMutation({
    mutationFn: webAuthApi.logout,
    onMutate: () => queryClient.cancelQueries(),
    onSettled: () => { queryClient.clear(); router.replace("/login"); router.refresh(); },
  });
  const user = useQuery({ queryKey: ["web-me"], queryFn: webAuthApi.me, initialData: initialUser, enabled: !logout.isPending });
  const sessions = useQuery({ queryKey: ["web-sessions"], queryFn: webAuthApi.sessions, enabled: section === "sessions" && !logout.isPending });
  const update = useMutation({ mutationFn: webAuthApi.update, onSuccess: (next) => { queryClient.setQueryData(["web-me"], next); setNotice("个人资料已保存"); router.refresh(); } });
  const password = useMutation({ mutationFn: ({ current, next }: { current: string; next: string }) => webAuthApi.changePassword(current, next), onSuccess: () => { queryClient.clear(); router.replace("/login?reason=password-changed"); router.refresh(); } });
  const remove = useMutation({ mutationFn: webAuthApi.revokeSession, onSuccess: () => void sessions.refetch() });
  const removeOthers = useMutation({ mutationFn: webAuthApi.revokeOthers, onSuccess: () => void sessions.refetch() });
  const deleteAccount = useMutation({ mutationFn: webAuthApi.deleteAccount, onSuccess: () => { queryClient.clear(); router.replace("/login?reason=account-deleted"); router.refresh(); } });

  return (
    <main className="account-shell">
      <header className="account-header">
        <Link className="wordmark" href="/">PINJIE</Link>
        <div className="account-identity"><div className="avatar">{(user.data.display_name || user.data.username).slice(0, 1).toUpperCase()}</div><div><strong>{user.data.display_name || user.data.username}</strong><span>@{user.data.username}</span></div></div>
        <button className="icon-text-button" type="button" disabled={logout.isPending} onClick={() => logout.mutate()}><LogOut size={17} />退出</button>
      </header>
      <div className="account-layout">
        <aside className="account-nav" aria-label="用户中心导航">
          <div><p className="kicker">ACCOUNT</p><h1>用户中心</h1></div>
          <nav>{sections.map((item) => <button className={section === item.id ? "active" : ""} key={item.id} type="button" onClick={() => { setSection(item.id); setNotice(undefined); }}>{item.icon}{item.label}</button>)}</nav>
          <div className="security-note"><ShieldCheck size={20} /><div><strong>会话受保护</strong><span>凭据不会写入本地存储</span></div></div>
        </aside>
        <section className="account-content">
          {section === "profile" && <div className="content-section"><div className="section-heading"><p className="kicker">PROFILE</p><h2>个人资料</h2><p>用户名是固定登录标识，显示名称和邮箱可以修改。</p></div><StatusMessage error={update.error} success={notice} /><form className="settings-form" onSubmit={(event) => { event.preventDefault(); setNotice(undefined); const data = new FormData(event.currentTarget); update.mutate({ display_name: String(data.get("display_name") ?? "") || null, email: String(data.get("email") ?? "") || null }); }}><label htmlFor="profile-username">用户名</label><input id="profile-username" disabled value={user.data.username} /><label htmlFor="display-name">显示名称</label><input id="display-name" name="display_name" defaultValue={user.data.display_name ?? ""} maxLength={100} /><label htmlFor="profile-email">邮箱 <span>尚未验证</span></label><input id="profile-email" name="email" type="email" defaultValue={user.data.email ?? ""} maxLength={320} /><button className="primary-action compact" disabled={update.isPending} type="submit">{update.isPending ? "正在保存" : "保存资料"}</button></form></div>}
          {section === "security" && <div className="content-section"><div className="section-heading"><p className="kicker">SECURITY</p><h2>修改密码</h2><p>修改成功后会撤销所有登录会话，需要重新登录。</p></div><StatusMessage error={password.error} /><form className="settings-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); password.mutate({ current: String(data.get("current_password")), next: String(data.get("new_password")) }); }}><label htmlFor="current-password">当前密码</label><input id="current-password" name="current_password" type="password" autoComplete="current-password" maxLength={64} required /><label htmlFor="new-password">新密码</label><input id="new-password" name="new_password" type="password" autoComplete="new-password" minLength={6} maxLength={64} required /><p className="field-hint">至少 6 个字符，最多 64 个字符。</p><button className="primary-action compact" disabled={password.isPending} type="submit">确认修改</button></form></div>}
          {section === "sessions" && <div className="content-section"><div className="section-heading section-heading--action"><div><p className="kicker">SESSIONS</p><h2>登录设备</h2><p>查看最近活动并撤销不再使用的设备。</p></div><button className="secondary-action" disabled={removeOthers.isPending} type="button" onClick={() => removeOthers.mutate()}>撤销其他设备</button></div><StatusMessage error={sessions.error || remove.error || removeOthers.error} />{sessions.isLoading && <p className="loading-text" role="status">正在加载会话</p>}{sessions.data?.length === 0 && <p className="empty-state">暂无会话</p>}<div className="session-list">{sessions.data?.map((item: SessionRead) => <article className="session-item" key={item.id}><div className="session-icon"><Laptop size={20} /></div><div><strong>{item.device_name || "未知设备"}{item.is_current && <span className="current-label">当前设备</span>}</strong><p>{item.ip_masked || "未知地址"} · 最近活动 {formatTime(item.last_seen_at)}</p><p>绝对到期 {formatTime(item.absolute_expires_at)}</p></div>{!item.is_current && !item.revoked_at && <button type="button" onClick={() => remove.mutate(item.id)}>撤销</button>}{item.revoked_at && <span className="revoked-label">已撤销</span>}</article>)}</div></div>}
          {section === "danger" && <div className="content-section danger-section"><div className="section-heading"><p className="kicker">DANGER ZONE</p><h2>注销账户</h2><p>账户会被停用，个人资料和登录标识将匿名化，安全审计记录按保留策略继续保存。</p></div><StatusMessage error={deleteAccount.error} /><form className="settings-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); if (String(data.get("confirmation")) !== user.data.username) return; deleteAccount.mutate(String(data.get("current_password"))); }}><label htmlFor="delete-confirm">输入用户名 <strong>{user.data.username}</strong> 确认</label><input id="delete-confirm" name="confirmation" required pattern={user.data.username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} /><label htmlFor="delete-password">当前密码</label><input id="delete-password" name="current_password" type="password" autoComplete="current-password" maxLength={64} required /><button className="danger-action" disabled={deleteAccount.isPending} type="submit"><Trash2 size={17} />永久注销账户</button></form></div>}
        </section>
      </div>
    </main>
  );
}
