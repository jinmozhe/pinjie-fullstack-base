import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("http://localhost:3000/api/v1/system/status", () =>
    HttpResponse.json({ code: "OK", message: "OK", data: { status: "available" }, request_id: "test-request" }),
  ),
];
