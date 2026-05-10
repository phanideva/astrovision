import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import GlitchText from "../design/GlitchText";
import HudPanel from "../design/HudPanel";
import Reveal from "../design/Reveal";
import { NeonButton } from "../design/NeonButton";
import { spaceMediaApi } from "../api/spaceMedia";

type Photo = {
  id: number;
  img_src: string;
  earth_date: string;
  sol: number;
  camera: { name: string; full_name: string };
  rover: { name: string; status: string };
};

const ROVERS = ["curiosity", "perseverance", "opportunity", "spirit"] as const;

export default function MarsRover() {
  const [rover, setRover] = useState<(typeof ROVERS)[number]>("curiosity");
  const [sol, setSol] = useState<string>("1000");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Photo | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await spaceMediaApi.marsRover({ rover, sol });
      setPhotos((data.photos ?? []).slice(0, 60));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="hud-page">
      <Reveal>
        <span className="hud-eyebrow amber"><span className="dot" />SOL · MARS</span>
        <GlitchText as="h1" text="MARS ROVER FEED" className="hud-title" />
        <p className="hud-subtitle">Surface imagery from NASA's active and retired Mars rovers.</p>
      </Reveal>

      <HudPanel tone="amber" grid style={{ marginTop: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <label style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--av-amber)" }}>
            Rover
          </label>
          <select
            value={rover}
            onChange={(e) => setRover(e.target.value as any)}
            style={{ padding: "6px 10px", background: "rgba(0,0,0,0.4)", color: "white", border: "1px solid rgba(255,198,107,0.4)", borderRadius: 4 }}
          >
            {ROVERS.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
          </select>
          <label style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--av-amber)" }}>
            Sol
          </label>
          <input
            type="number"
            value={sol}
            onChange={(e) => setSol(e.target.value)}
            style={{ padding: "6px 10px", background: "rgba(0,0,0,0.4)", color: "white", border: "1px solid rgba(255,198,107,0.4)", borderRadius: 4, width: 100 }}
          />
          <NeonButton tone="amber" onClick={load} disabled={loading}>
            {loading ? "Scanning…" : "▶ Fetch"}
          </NeonButton>
          <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
            {photos.length} frames
          </span>
        </div>
      </HudPanel>

      {error && <div className="hud-page" style={{ color: "var(--av-pink)" }}>{error}</div>}

      <div className="hud-grid-3" style={{ marginTop: 20 }}>
        {photos.map((p, i) => (
          <Reveal key={p.id} delay={(i % 12) * 0.03}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              onClick={() => setActive(p)}
              className="holo-card"
              style={{ padding: 8, background: "transparent" }}
            >
              <img src={p.img_src} alt={p.camera.full_name} loading="lazy" style={{ width: "100%", borderRadius: 4 }} />
              <div style={{ marginTop: 6, fontSize: 11, fontFamily: "var(--font-hud)", display: "flex", justifyContent: "space-between", color: "var(--av-amber)" }}>
                <span>{p.camera.name}</span>
                <span>SOL {p.sol}</span>
              </div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{p.earth_date}</div>
            </motion.button>
          </Reveal>
        ))}
      </div>

      {active && (
        <div
          onClick={() => setActive(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <img src={active.img_src} alt={active.camera.full_name} style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 6 }} />
        </div>
      )}
    </div>
  );
}
