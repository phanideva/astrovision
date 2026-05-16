import { useEffect, useMemo, useState } from "react";
import GlitchText from "../design/GlitchText";
import HudPanel from "../design/HudPanel";
import Reveal from "../design/Reveal";
import { spaceMediaApi } from "../api/spaceMedia";

type Neo = {
  id: string;
  name: string;
  is_potentially_hazardous_asteroid: boolean;
  estimated_diameter: { meters: { estimated_diameter_max: number; estimated_diameter_min: number } };
  close_approach_data: Array<{
    close_approach_date_full: string;
    relative_velocity: { kilometers_per_second: string };
    miss_distance: { kilometers: string; lunar: string };
  }>;
};

const MAX_DIST_KM = 7_500_000; // ~20 LD

function todayISO() { return new Date().toISOString().slice(0, 10); }
function plusDaysISO(d: number) {
  const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10);
}

export default function NeoRadar() {
  const [items, setItems] = useState<Neo[]>([]);
  const [t, setT] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    spaceMediaApi.neoFeed(todayISO(), plusDaysISO(7))
      .then((d) => {
        const arr = Object.values(d.near_earth_objects ?? {}).flat() as Neo[];
        setItems(arr.sort((a, b) =>
          parseFloat(a.close_approach_data[0]?.miss_distance?.kilometers ?? "0") -
          parseFloat(b.close_approach_data[0]?.miss_distance?.kilometers ?? "0")
        ));
      })
      .catch((e) => setError(e?.message ?? "Failed"));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setT((x) => (x + 1) % 360), 60);
    return () => clearInterval(id);
  }, []);

  const dots = useMemo(() => items.map((n, i) => {
    const km = parseFloat(n.close_approach_data[0]?.miss_distance?.kilometers ?? "0");
    const r = Math.min(km / MAX_DIST_KM, 1) * 47 + 3;
    const ang = (i * 137.5 + t) * Math.PI / 180;
    return {
      cx: 50 + r * Math.cos(ang),
      cy: 50 + r * Math.sin(ang),
      hazard: n.is_potentially_hazardous_asteroid,
      name: n.name,
      km,
    };
  }), [items, t]);

  return (
    <div className="hud-page">
      <Reveal>
        <span className="hud-eyebrow amber"><span className="dot" />NEAR-EARTH OBJECT WATCH</span>
        <GlitchText as="h1" text="NEO RADAR" className="hud-title" />
        <p className="hud-subtitle">Asteroids passing within ~20 lunar distances over the next 7 days.</p>
      </Reveal>

      <div className="hud-grid-2" style={{ marginTop: 24 }}>
        <Reveal>
          <HudPanel tone="amber" grid scanlines style={{ aspectRatio: "1 / 1", padding: 0, position: "relative", overflow: "hidden" }}>
            <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
              {[15, 30, 45].map((r) => (
                <circle key={r} cx={50} cy={50} r={r} fill="none" stroke="rgba(255,198,107,0.25)" strokeDasharray="1 1.6" />
              ))}
              <line x1={50} y1={3} x2={50} y2={97} stroke="rgba(255,198,107,0.2)" />
              <line x1={3} y1={50} x2={97} y2={50} stroke="rgba(255,198,107,0.2)" />
              <line
                x1={50}
                y1={50}
                x2={50 + 47 * Math.cos((t * Math.PI) / 180)}
                y2={50 + 47 * Math.sin((t * Math.PI) / 180)}
                stroke="rgba(255,198,107,0.7)"
                strokeWidth={0.4}
              />
              <circle cx={50} cy={50} r={2} fill="var(--av-cyan)" />
              {dots.map((d, i) => (
                <circle
                  key={i}
                  cx={d.cx}
                  cy={d.cy}
                  r={d.hazard ? 1.4 : 0.9}
                  fill={d.hazard ? "var(--av-pink)" : "var(--av-amber)"}
                >
                  <title>{d.name} · {Math.round(d.km).toLocaleString()} km</title>
                </circle>
              ))}
            </svg>
          </HudPanel>
        </Reveal>
        <Reveal delay={0.1}>
          <HudPanel tone="cyan" grid style={{ maxHeight: 520, overflow: "auto" }}>
            <h3 style={{ marginTop: 0 }}>Closest approaches · 7d</h3>
            {error && <div style={{ color: "var(--av-pink)" }}>{error}</div>}
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "var(--av-cyan)" }}>
                  <th style={{ textAlign: "left", padding: 6 }}>Name</th>
                  <th style={{ textAlign: "right", padding: 6 }}>Miss (LD)</th>
                  <th style={{ textAlign: "right", padding: 6 }}>v (km/s)</th>
                  <th style={{ textAlign: "right", padding: 6 }}>Ø (m)</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 60).map((n) => {
                  const ca = n.close_approach_data[0];
                  const dia = ((n.estimated_diameter.meters.estimated_diameter_max + n.estimated_diameter.meters.estimated_diameter_min) / 2);
                  return (
                    <tr key={n.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", color: n.is_potentially_hazardous_asteroid ? "var(--av-pink)" : undefined }}>
                      <td style={{ padding: 6 }}>{n.name}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>{parseFloat(ca?.miss_distance?.lunar ?? "0").toFixed(2)}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>{parseFloat(ca?.relative_velocity?.kilometers_per_second ?? "0").toFixed(1)}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>{dia.toFixed(0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </HudPanel>
        </Reveal>
      </div>
    </div>
  );
}
