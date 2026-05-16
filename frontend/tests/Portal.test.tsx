import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import PortalLayout from "../src/portal/PortalLayout";

const refreshMe = vi.fn(async () => undefined);
const logout = vi.fn();

vi.mock("../src/store/auth", () => {
  return {
    useAuth: () => ({
      user: {
        id: 1,
        email: "pilot@astrovision.io",
        persona: "enthusiast",
        display_name: "Pilot",
        avatar_seed: "pilot-seed",
        bio: "",
        timezone: "UTC",
        onboarded_at: null,
      },
      refreshMe,
      logout,
    }),
  };
});

describe("Portal layout", () => {
  it("renders rail links and onboarding on first visit", () => {
    render(
      <MemoryRouter initialEntries={["/portal"]}>
        <Routes>
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<div>Overview Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Welcome to Mission Portal/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: /Portal onboarding/i })).toBeInTheDocument();
  });
});
