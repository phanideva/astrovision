import { useEffect, useMemo, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from "recharts";
import GlitchText from "../design/GlitchText";
import HudPanel from "../design/HudPanel";
import Reveal from "../design/Reveal";
import { spaceMediaApi } from "../api/spaceMedia";

type Exo = {
  pl_name: string;
  hostname: string;
  disc_year: number;
  discoverymethod: string;
  pl_orbper: number;
  pl_rade: number;
  pl_bmasse: number | null;
  sy_dist: number | null;
};

export default function Exoplanets() {
  const [items, setItems] = useState<Exo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    spaceMediaApi.exoplanets(500)
      .then((d) => setItems((d.items ?? []) as Exo[]))
      .catch((e) => setError(e?.message ?? "Failed to load"));
  }, []);

  const methods = useMemo(() => {
    const s = new Set<string>();
    items.forEach((it) => it.discoverymethod && s.add(it.discoverymethod));
    return ["ALL", ...Array.from(s).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    return items
      .filter((it) => method === "ALL" || it.discoverymethod === method)
      .filter((it) => !search || it.pl_name.toLowerCase().includes(search.toLowerCase()) || it.hostname.toLowerCase().includes(search.toLowerCase()));
  }, [items, method, search]);

  const chart = useMemo(
    () => filtered
      .filter((it) => it.pl_orbper > 0 && it.pl_rade > 0 && it.pl_orbper < 1000)
      .map((it) => ({ x: it.pl_orbper, y: it.pl_rade, z: 60, name: it.pl_name, host: it.hostname })),
    [filtered],
  );

  return (
    <div className="hud-page">
      <Reveal>
        <span className="hud-eyebrow violet"><span className="dot" />NASA EXOPLANET ARCHIVE</span>
        <GlitchText as="h1" text="EXOPLANET ATLAS" className="hud-title" />
        <p className="hud-subtitle">5,000+ confirmed worlds beyond our solar system. Filter, search, plot.</p>
      </Reveal>

      <HudPanel tone="violet" grid style={{ marginTop: 20 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            placeholder="Search planet or host star…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: "8px 12px", background: "rgba(0,0,0,0.4)", color: "white", border: "1px solid rgba(168,123,255,0.4)", borderRadius: 4 }}
          />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{ padding: "8px 12px", background: "rgba(0,0,0,0.4)", color: "white", border: "1px solid rgba(168,123,255,0.4)", borderRadius: 4 }}
          >
            {methods.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
            {filtered.length} / {items.length}
          </span>
        </div>
      </HudPanel>

      {error && <div style={{ color: "var(--av-pink)", marginTop: 12 }}>{error}</div>}

      <div className="hud-grid-2" style={{ marginTop: 20 }}>
        <Reveal>
          <HudPanel tone="cyan" grid>
            <h3 style={{ marginTop: 0 }}>Orbit period vs Radius</h3>
            <div style={{ width: "100%", height: 360 }}>
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 12, right: 12, bottom: 24, left: 12 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" dataKey="x" name="Orbit period" unit="d" stroke="#7fc6e0" tick={{ fill: "#7fc6e0", fontSize: 11 }} />
                  <YAxis type="number" dataKey="y" name="Radius" unit="R⊕" stroke="#7fc6e0" tick={{ fill: "#7fc6e0", fontSize: 11 }} />
                  <ZAxis type="number" dataKey="z" range={[40, 80]} />
                  <Tooltip
                    contentStyle={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(92,242,255,0.4)" }}
                    formatter={(value: any, name: string) => [value, name]}
                    labelFormatter={() => ""}
                  />
                  <Scatter data={chart} fill="rgba(92,242,255,0.7)" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </HudPanel>
        </Reveal>
        <Reveal delay={0.1}>
          <HudPanel tone="green" grid style={{ maxHeight: 420, overflow: "auto" }}>
            <h3 style={{ marginTop: 0 }}>Catalog</h3>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ position: "sticky", top: 0, background: "rgba(0,0,0,0.85)", color: "var(--av-green)" }}>
                  <th style={{ textAlign: "left", padding: 6 }}>Name</th>
                  <th style={{ textAlign: "left", padding: 6 }}>Host</th>
                  <th style={{ textAlign: "right", padding: 6 }}>P (d)</th>
                  <th style={{ textAlign: "right", padding: 6 }}>R⊕</th>
                  <th style={{ textAlign: "left", padding: 6 }}>Method</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map((p, i) => (
                  <tr key={`${p.pl_name}-${i}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: 6 }}>{p.pl_name}</td>
                    <td style={{ padding: 6, opacity: 0.7 }}>{p.hostname}</td>
                    <td style={{ padding: 6, textAlign: "right" }}>{p.pl_orbper?.toFixed(2) ?? "—"}</td>
                    <td style={{ padding: 6, textAlign: "right" }}>{p.pl_rade?.toFixed(2) ?? "—"}</td>
                    <td style={{ padding: 6, opacity: 0.7 }}>{p.discoverymethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </HudPanel>
        </Reveal>
      </div>
    </div>
  );
}
