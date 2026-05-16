import { useEffect, useState } from "react";
import GlitchText from "../design/GlitchText";
import HudPanel from "../design/HudPanel";
import Reveal from "../design/Reveal";
import { NeonButton } from "../design/NeonButton";
import { api } from "../api/client";
import { useAuth } from "../store/auth";

type Mine = {
  id: number;
  image: string;
  predicted_class: string;
  confidence: number;
  probabilities: Record<string, number>;
  created_at: string;
};

export default function Compare() {
  const { user } = useAuth();
  const [items, setItems] = useState<Mine[]>([]);
  const [a, setA] = useState<Mine | null>(null);
  const [b, setB] = useState<Mine | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get<Mine[]>("/predictions/").then((r) => setItems(r.data)).catch(() => undefined);
  }, [user]);

  if (!user) {
    return (
      <div className="hud-page">
        <Reveal>
          <GlitchText as="h1" text="COMPARE GALAXIES" className="hud-title" />
          <p className="hud-subtitle">Sign in to compare your classifications side by side.</p>
        </Reveal>
      </div>
    );
  }

  const allClasses = Array.from(new Set(items.flatMap((m) => Object.keys(m.probabilities ?? {})))).sort();

  return (
    <div className="hud-page">
      <Reveal>
        <span className="hud-eyebrow violet"><span className="dot" />A · B COMPARATOR</span>
        <GlitchText as="h1" text="COMPARE CLASSIFICATIONS" className="hud-title" />
        <p className="hud-subtitle">Pick two predictions to inspect class probability deltas.</p>
      </Reveal>

      <HudPanel tone="violet" grid style={{ marginTop: 20 }}>
        <div className="hud-grid-2">
          <Picker label="A" items={items} value={a} onChange={setA} tone="cyan" />
          <Picker label="B" items={items} value={b} onChange={setB} tone="violet" />
        </div>
      </HudPanel>

      {a && b && (
        <div className="hud-grid-2" style={{ marginTop: 20 }}>
          <Reveal>
            <HudPanel tone="cyan" grid>
              <h3 style={{ marginTop: 0 }}>A · {a.predicted_class}</h3>
              <img src={absoluteUrl(a.image)} alt="A" style={{ width: "100%", borderRadius: 6 }} />
            </HudPanel>
          </Reveal>
          <Reveal delay={0.05}>
            <HudPanel tone="violet" grid>
              <h3 style={{ marginTop: 0 }}>B · {b.predicted_class}</h3>
              <img src={absoluteUrl(b.image)} alt="B" style={{ width: "100%", borderRadius: 6 }} />
            </HudPanel>
          </Reveal>
          <Reveal delay={0.1}>
            <HudPanel tone="green" grid style={{ gridColumn: "1 / -1" }}>
              <h3 style={{ marginTop: 0 }}>Probability delta</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {allClasses.map((c) => {
                  const va = (a.probabilities?.[c] ?? 0) * 100;
                  const vb = (b.probabilities?.[c] ?? 0) * 100;
                  return (
                    <div key={c}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span>{c}</span>
                        <span><span style={{ color: "var(--av-cyan)" }}>{va.toFixed(1)}%</span> · <span style={{ color: "var(--av-violet)" }}>{vb.toFixed(1)}%</span></span>
                      </div>
                      <div style={{ position: "relative", height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${va}%`, background: "var(--av-cyan)", opacity: 0.7 }} />
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${vb}%`, background: "var(--av-violet)", mixBlendMode: "screen" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </HudPanel>
          </Reveal>
        </div>
      )}
    </div>
  );
}

function Picker({
  label, items, value, onChange,
}: { label: string; items: Mine[]; value: Mine | null; onChange: (m: Mine | null) => void; tone: string }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-hud)", fontSize: 12, marginBottom: 8 }}>SLOT {label}</div>
      <select
        value={value?.id ?? ""}
        onChange={(e) => onChange(items.find((m) => m.id === parseInt(e.target.value)) ?? null)}
        style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.4)", color: "white", border: "1px solid rgba(168,123,255,0.4)", borderRadius: 4 }}
      >
        <option value="">— select —</option>
        {items.map((m) => (
          <option key={m.id} value={m.id}>
            #{m.id} · {m.predicted_class} ({(m.confidence * 100).toFixed(0)}%)
          </option>
        ))}
      </select>
      {!value && <NeonButton style={{ marginTop: 8 }} onClick={() => items[0] && onChange(items[0])} tone="violet">Auto-pick</NeonButton>}
    </div>
  );
}

function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  const base = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
