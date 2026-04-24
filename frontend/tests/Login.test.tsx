import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Login from "../src/pages/Login";
import { AuthProvider } from "../src/store/auth";

vi.mock("../src/api/client", () => {
  const post = vi.fn(async (url: string) => {
    if (url.endsWith("/auth/login/")) {
      return { data: { access: "a", refresh: "r" } };
    }
    throw new Error("unexpected");
  });
  const get = vi.fn(async () => ({ data: { id: 1, email: "a@b.co" } }));
  return {
    api: { post, get, interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
    tokens: {
      access: null, refresh: null,
      set: vi.fn(), clear: vi.fn(),
    },
  };
});

describe("Login page", () => {
  beforeEach(() => localStorage.clear());

  it("renders the form and submits credentials", async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: /log in/i })
    ).toBeInTheDocument();
    const inputs = container.querySelectorAll("input");
    expect(inputs.length).toBe(2);
    await userEvent.type(inputs[0], "a@b.co");
    await userEvent.type(inputs[1], "Sup3rStrong!");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(
      await screen.findByRole("button", { name: /log in/i })
    ).toBeInTheDocument();
  });
});
