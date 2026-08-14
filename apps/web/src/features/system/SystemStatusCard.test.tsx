import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/test/setup";

import { SystemStatusCard } from "./SystemStatusCard";

describe("SystemStatusCard", () => {
  it("renders the server status and provides an accessible retry action", () => {
    render(<SystemStatusCard initialStatus={{ status: "available" }} />);
    expect(screen.getByRole("heading", { name: "System status" })).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check again" })).toBeInTheDocument();
  });

  it("refreshes the status when the user retries", async () => {
    render(<SystemStatusCard initialStatus={{ status: "unavailable" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Check again" }));

    await waitFor(() => expect(screen.getByText("Available")).toBeInTheDocument());
  });

  it("reports an unavailable backend when retry fails", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/system/status", () => HttpResponse.json({ message: "down" }, { status: 503 })),
    );
    render(<SystemStatusCard initialStatus={{ status: "available" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Check again" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Backend is unavailable"));
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });
});
