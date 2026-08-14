import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { SystemStatusPage } from "./SystemStatusPage";
import { server } from "../../test/setup";

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SystemStatusPage />
    </QueryClientProvider>,
  );
}

describe("SystemStatusPage", () => {
  it("shows a loading state and then the real backend status", async () => {
    renderPage();
    expect(screen.getByLabelText("Loading system status")).toBeInTheDocument();
    expect(await screen.findByText("Available")).toBeInTheDocument();
  });

  it("shows an error and recovers after retry", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/system/status", () => HttpResponse.json({ message: "down" }, { status: 503 })),
    );
    renderPage();

    expect(await screen.findByText("Backend is unavailable")).toBeInTheDocument();
    server.use(
      http.get("http://localhost:3000/api/v1/system/status", () =>
        HttpResponse.json({ code: "OK", message: "OK", data: { status: "available" }, request_id: "retry-request" }),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry status" }));

    expect(await screen.findByText("Available")).toBeInTheDocument();
  });
});
