import { useEffect, useState } from "react";
import GlitchText from "../design/GlitchText";
import HudPanel from "../design/HudPanel";
import Reveal from "../design/Reveal";
import { spaceMediaApi } from "../api/spaceMedia";

type EpicItem = {
  identifier: string;
  caption: string;
  image: string;
  date: string;
  centroid_coordinates: { lat: number; lon: number };
  dscovr_j2000_position: { x: number; y: number; z: number };
};

function epicImageUrl(item: EpicItem) {
  const date = item.date.slice(0, 10).replace(/-/g, "/");
  return `https://epic.gsfc.nasa.gov/archive/natural/${date}/jpg/${item.image}.jpg`;
}

export default function EpicEarth() {
  const [items, setItems] = useState<EpicItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    spaceMediaApi.epic()
      .then((d) => setItems(d.items ?? []))
      .catch((e) => setError(e?.message ?? "Failed to load"));
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % items.length), 1800);
    return () => clearInterval(id);
  }, [items]);

  const current = items[idx];

  return (
    <div className="hud-page">
      <Reveal>
        <span className="hud-eyebrow"><span className="dot" />DSCOVR · L1</span>
        <GlitchText as="h1" text="EPIC EARTH OBSERVATORY" className="hud-title" />
        <p className="hud-subtitle">Full-disk imagery of Earth from 1.5 million km — the L1 Lagrange point.</p>
      </Reveal>

      {error && <div style={{ color: "var(--av-pink)", marginTop: 20 }}>{error}</div>}

      {current && (
        <div className="hud-grid-2" style={{ marginTop: 24 }}>
          <Reveal>
            <HudPanel tone="cyan" grid scanlines>
              <img
                src={epicImageUrl(current)}
                alt={current.caption}
                style={{ width: "100%", borderRadius: 6, display: "block" }}
              />
              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontFamily: "var(--font-hud)", color: "var(--av-cyan)" }}>
                  FRAME {idx + 1} / {items.length}
                </span>
                <input
                  type="range"
                  min={0}
                  max={items.length - 1}
                  value={idx}
                  onChange={(e) => setIdx(parseInt(e.target.value))}
                  style={{ flex: 1, marginLeft: 14 }}
                />
              </div>
            </HudPanel>
          </Reveal>
          <Reveal delay={0.1}>
            <HudPanel tone="violet" grid>
              <h3 style={{ marginTop: 0 }}>Telemetry</h3>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>{current.caption}</p>
              <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                <Row k="DATE" v={current.date} />
                <Row k="LAT" v={`${current.centroid_coordinates.lat.toFixed(2)}°`} />
                <Row k="LON" v={`${current.centroid_coordinates.lon.toFixed(2)}°`} />
                <Row k="DSCOVR X" v={`${current.dscovr_j2000_position.x.toFixed(0)} km`} />
                <Row k="DSCOVR Y" v={`${current.dscovr_j2000_position.y.toFixed(0)} km`} />
                <Row k="DSCOVR Z" v={`${current.dscovr_j2000_position.z.toFixed(0)} km`} />
              </div>
            </HudPanel>
          </Reveal>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.08)", paddingBottom: 4 }}>
      <span style={{ fontSize: 11, fontFamily: "var(--font-hud)", color: "var(--av-violet)" }}>{k}</span>
      <span style={{ fontSize: 13 }}>{v}</span>
    </div>
  );
}
