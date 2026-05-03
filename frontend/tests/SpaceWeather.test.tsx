import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import SpaceWeather from "../src/pages/SpaceWeather";

describe("SpaceWeather page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not render NaN when NOAA feed contains invalid values", async () => {
    const mockRows = [
      ["time_tag", "kp_index", "a_running", "station_count"],
      ["2026-05-03 10:00:00", "", "x", "x"],
      ["2026-05-03 13:00:00", "4.67", "x", "x"],
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => mockRows,
      })
    );

    render(<SpaceWeather />);

    await waitFor(() => {
      expect(screen.getByText("4.67")).toBeInTheDocument();
    });

    expect(screen.queryByText("NaN")).not.toBeInTheDocument();
  });
});
