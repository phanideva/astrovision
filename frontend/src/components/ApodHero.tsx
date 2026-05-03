import { useEffect, useState } from "react";
import { spaceMediaApi, ApodResponse } from "../api/spaceMedia";

/**
 * NASA Astronomy Picture of the Day hero used on the Home page.
 * Auto-falls back to a gradient if the API call fails.
 */
export default function ApodHero() {
  const [apod, setApod] = useState<ApodResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    spaceMediaApi
      .apod()
      .then((d) => !cancelled && setApod(d))
      .catch(() => !cancelled && setErr("APOD unavailable"));
    return () => {
      cancelled = true;
    };
  }, []);

  const isImage = apod?.media_type === "image";
  const bg =
    apod && isImage
      ? `url("${apod.url}")`
      : "radial-gradient(ellipse at top, #1a1f4a 0%, #05060d 70%)";

  return (
    <section
      className="apod-hero"
      style={{
        backgroundImage: bg,
      }}
    >
      <div className="apod-hero-overlay" />
      <div className="apod-hero-inner">
        <span className="apod-eyebrow">NASA · Astronomy Picture of the Day</span>
        <h1 className="apod-title">{apod?.title ?? "Classify Galaxies. Visualize the Cosmos."}</h1>
        {apod ? (
          <p className="apod-explanation">
            {apod.explanation.length > 320
              ? apod.explanation.slice(0, 320) + "…"
              : apod.explanation}
          </p>
        ) : (
          <p className="apod-explanation">
            AstroVision is a deep-learning powered web app that classifies
            deep-space galaxies and renders the universe in real-time 3D.
          </p>
        )}
        {apod?.copyright && (
          <p className="apod-credit">© {apod.copyright.trim()}</p>
        )}
        {err && <p className="apod-credit">{err}</p>}
      </div>
    </section>
  );
}
