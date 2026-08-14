import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const backendURL = process.env.BACKEND_INTERNAL_URL;
  if (!backendURL) {
    return NextResponse.json(
      { code: "SERVICE_UNAVAILABLE", message: "Backend is not configured", request_id: request.headers.get("x-request-id") ?? "" },
      { status: 503 },
    );
  }
  try {
    const target = new URL("/api/v1/system/status", backendURL);
    const response = await fetch(target, { cache: "no-store", headers: { accept: "application/json" } });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json(
      { code: "SERVICE_UNAVAILABLE", message: "Backend is unavailable", request_id: request.headers.get("x-request-id") ?? "" },
      { status: 503 },
    );
  }
}
