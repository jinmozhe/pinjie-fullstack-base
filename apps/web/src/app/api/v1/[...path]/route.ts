import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FORWARDED_HEADERS = ["accept", "content-type", "cookie", "origin", "user-agent", "x-csrf-token", "x-request-id"];

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const backendURL = process.env.BACKEND_INTERNAL_URL;
  if (!backendURL) return NextResponse.json({ code: "SERVICE_UNAVAILABLE", message: "后端服务尚未配置", request_id: request.headers.get("x-request-id") ?? "" }, { status: 503 });
  const { path } = await context.params;
  const source = new URL(request.url);
  const target = new URL(`/api/v1/${path.join("/")}${source.search}`, backendURL);
  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });
    const outgoing = new Headers();
    for (const name of ["cache-control", "content-type", "retry-after", "x-request-id", "x-trace-id"]) {
      const value = response.headers.get(name);
      if (value) outgoing.set(name, value);
    }
    const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] };
    for (const cookie of responseHeaders.getSetCookie?.() ?? []) outgoing.append("set-cookie", cookie);
    return new NextResponse(response.body, { status: response.status, headers: outgoing });
  } catch {
    return NextResponse.json({ code: "SERVICE_UNAVAILABLE", message: "后端服务不可用", request_id: request.headers.get("x-request-id") ?? "" }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
