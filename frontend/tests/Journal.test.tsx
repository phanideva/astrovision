import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PortalJournal from "../src/portal/PortalJournal";

const mocks = vi.hoisted(() => ({
  listJournal: vi.fn(async () => ({
    count: 1,
    results: [
      {
        id: 11,
        title: "First Light",
        body_md: "Observed spiral structures.",
        mood: "inspired" as const,
        linked_prediction: null,
        pinned: false,
        created_at: "2026-05-16T00:00:00Z",
        updated_at: "2026-05-16T00:00:00Z",
      },
    ],
  })),
  createJournal: vi.fn(async () => ({ id: 12 })),
}));

vi.mock("../src/api/portal", () => ({
  portalApi: {
    listJournal: mocks.listJournal,
    createJournal: mocks.createJournal,
  },
}));

describe("Portal journal", () => {
  it("loads entries and creates a new one", async () => {
    const { container } = render(<PortalJournal />);

    expect(await screen.findByText(/First Light/i)).toBeInTheDocument();

    const controls = container.querySelectorAll("input, textarea");
    await userEvent.type(controls[0], "Mission Day 2");
    await userEvent.type(controls[1], "Captured more data");
    await userEvent.click(screen.getByRole("button", { name: /Save Entry/i }));

    expect(mocks.createJournal).toHaveBeenCalled();
    expect(mocks.listJournal).toHaveBeenCalledTimes(2);
  });
});
