import { useState } from "react";
import { Prediction } from "../api/predictions";
import GalaxyViewer3D from "./GalaxyViewer3D";

const API_BASE  = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const MEDIA_BASE = API_BASE.replace(/\/api\/?$/, "");

const CLASS_COLORS: Record<string, string> = {
  Spiral:     "#6ab0ff",
  Elliptical: "#ffdc82",
  Lenticular: "#d0aaff",
  Irregular:  "#7de0a0",
};

interface GalaxyInfo {
  tagline: string;
  description: string;
  characteristics: string[];
  formation: string;
  properties: { label: string; value: string }[];
  examples: string;
}

const GALAXY_INFO: Record<string, GalaxyInfo> = {
  Spiral: {
    tagline: "A rotating disk galaxy with sweeping stellar arms",
    description:
      "Spiral galaxies are among the most visually striking objects in the universe. They feature a bright central bulge surrounded by a flat rotating disk of stars, gas, and dust organized into sweeping spiral arms. The arms are density waves — like traffic jams in space — where stars, gas, and interstellar dust compress, triggering new generations of star formation. Our own Milky Way is a barred spiral.",
    characteristics: [
      "Well-defined spiral arms traced by bright, young blue O/B stars",
      "Active star-forming HII regions scattered throughout the arms",
      "Dark dust lanes running along the inner edges of spiral arms",
      "Central bulge dominated by older, redder stellar populations",
      "~70 % of spirals possess a central bar structure (SB types)",
      "Flat rotation curve indicates a massive dark matter halo",
    ],
    formation:
      "Spiral structure arises from self-sustaining density waves that propagate around the galactic disk. The galaxy itself assembled 5–10 Gyr ago through hierarchical merging of smaller proto-galactic clumps. As cold gas accretes from the cosmic web, it settles into a rotating disk where differential rotation and gravitational instabilities conspire to produce the spiral pattern. Isolated spirals tend to preserve their structure; mergers destroy it.",
    properties: [
      { label: "Mass range",    value: "10⁹ – 10¹² M☉" },
      { label: "Diameter",      value: "15,000 – 300,000 ly" },
      { label: "Star count",    value: "10 billion – 1 trillion" },
      { label: "Typical age",   value: "5 – 12 Gyr" },
      { label: "Gas fraction",  value: "10 – 25 % of disk mass" },
      { label: "Hubble type",   value: "Sa → Sc  /  SBa → SBc" },
      { label: "Colour (B–V)",  value: "0.4 – 0.7 (blue-ish)" },
      { label: "SFR",           value: "0.5 – 10 M☉ / yr" },
    ],
    examples: "Milky Way (SBbc), Andromeda M31 (Sb), Whirlpool M51 (Sc), Pinwheel M101 (Scd), NGC 1232",
  },
  Elliptical: {
    tagline: "A massive, gas-poor ellipsoid of ancient stars",
    description:
      "Elliptical galaxies are the most massive galaxies in the universe, appearing as smooth, featureless ellipses of starlight. They consist almost entirely of old, red Population II stars with minimal ongoing star formation. Rather than a flat rotating disk, their stars follow randomly-oriented orbits — the remnant signature of a violent merger history. The giant elliptical M87 at the core of the Virgo Cluster hosts the first black hole ever directly imaged.",
    characteristics: [
      "Smooth, featureless surface-brightness profile (Sérsic law, n ≈ 4)",
      "Dominated by old, red-orange stars (low-mass K/M giants)",
      "Virtually no cold HI gas or molecular clouds",
      "Stellar orbits randomly oriented — pressure-supported system",
      "Often surrounded by extended hot X-ray gas halos",
      "Frequently host supermassive black holes (M_BH ∝ σ⁵)",
    ],
    formation:
      "The leading theory is that most large ellipticals form through major mergers of disk galaxies. The violent collision randomises orbital angular momentum, creating the pressure-supported spheroidal shape. A brief, intense starburst consumes the remaining cold gas. After quenching, the galaxy passively evolves as stars age and redden. Compact ellipticals may also form through tidal stripping of larger spirals.",
    properties: [
      { label: "Mass range",    value: "10⁷ – 10¹³ M☉" },
      { label: "Diameter",      value: "3,000 – 700,000 ly" },
      { label: "Star count",    value: "1 million – 100 trillion" },
      { label: "Typical age",   value: "8 – 13 Gyr" },
      { label: "Gas fraction",  value: "< 1 % (hot X-ray only)" },
      { label: "Hubble type",   value: "E0 (round) → E7 (flat)" },
      { label: "Colour (B–V)",  value: "0.8 – 1.0 (red)" },
      { label: "SFR",           value: "< 0.1 M☉ / yr" },
    ],
    examples: "M87 (Virgo A), M49, M60, NGC 1399, Maffei 1, IC 1101 (largest known galaxy)",
  },
  Lenticular: {
    tagline: "A disk galaxy that has exhausted its star-forming gas",
    description:
      "Lenticular (S0) galaxies are a transitional morphological class between spirals and ellipticals. They retain a flattened disk and prominent central bulge like spiral galaxies, but lack the distinctive spiral arm pattern and contain little cold star-forming gas. They are the most common galaxy type in dense cluster environments, where ram-pressure stripping or galaxy harassment has stripped away their fuel supply.",
    characteristics: [
      "Flattened disk component without spiral arm structure",
      "Prominent central bulge, sometimes with a bar or lens feature",
      "Gas-poor — mostly old, evolved stellar populations",
      "Some show faint outer rings, polar rings, or dust lanes",
      "Kinematics range from fast-rotating disks to slow rotators",
      "Over-represented in rich galaxy clusters (Butcher-Oemler effect)",
    ],
    formation:
      "Lenticulars are predominantly 'retired' spirals. In dense cluster environments, intergalactic ram pressure can strip a spiral of its cold gas in 100–500 Myr, halting star formation while preserving the stellar disk — producing a lenticular. In lower-density field environments, slow internal processes (AGN feedback, stellar winds) can achieve the same result over longer timescales. Gravitational harassment by multiple small encounters also plays a role.",
    properties: [
      { label: "Mass range",    value: "10⁹ – 10¹² M☉" },
      { label: "Diameter",      value: "10,000 – 100,000 ly" },
      { label: "Star count",    value: "1 – 500 billion" },
      { label: "Typical age",   value: "6 – 12 Gyr" },
      { label: "Gas fraction",  value: "1 – 5 %" },
      { label: "Hubble type",   value: "S0a → S0c" },
      { label: "Colour (B–V)",  value: "0.7 – 0.9 (orange-red)" },
      { label: "SFR",           value: "0.01 – 0.5 M☉ / yr" },
    ],
    examples: "NGC 1023, NGC 2787, Sombrero Galaxy M104, NGC 5866 (edge-on), NGC 4111",
  },
  Irregular: {
    tagline: "A chaotic, star-bursting galaxy defying classification",
    description:
      "Irregular galaxies are the cosmic wild cards — they lack the smooth elliptical profile or ordered spiral structure of conventional galaxy types. Instead they appear as chaotic, asymmetric assemblies of bright star clusters, nebulae, and dust, often dominated by the blue-white glow of massive young stars. They span an enormous range, from tiny dwarf irregulars to enormous interacting systems caught mid-collision.",
    characteristics: [
      "No defined elliptical or disk-spiral structure",
      "Intense, spatially distributed star formation activity",
      "High neutral hydrogen (HI) and molecular gas content",
      "Blue colour dominated by short-lived O and B supergiants",
      "Often show tidal streams, plumes, and distortions from interactions",
      "Rich in HII regions, supernova remnants, and young star clusters",
    ],
    formation:
      "Irregular galaxies arise through several distinct pathways: (1) Primordial dwarf irregulars that never attained sufficient mass to organise into a disk; (2) Former spiral or elliptical galaxies whose morphology was disrupted by close gravitational encounters with massive neighbours; (3) Active merger systems caught mid-interaction, where tidal forces have shredded the original structure. The Magellanic Clouds are classic examples of dwarf irregulars being tidally perturbed by the Milky Way.",
    properties: [
      { label: "Mass range",    value: "10⁷ – 10¹⁰ M☉" },
      { label: "Diameter",      value: "1,000 – 30,000 ly" },
      { label: "Star count",    value: "100 million – 10 billion" },
      { label: "Typical age",   value: "mixed  (1 – 10 Gyr)" },
      { label: "Gas fraction",  value: "25 – 60 % of total mass" },
      { label: "Hubble type",   value: "Irr I (structured) / Irr II (chaotic)" },
      { label: "Colour (B–V)",  value: "0.1 – 0.5 (very blue)" },
      { label: "SFR",           value: "0.01 – 5 M☉ / yr (bursty)" },
    ],
    examples:
      "Large Magellanic Cloud, Small Magellanic Cloud, NGC 1427A, IC 3583, NGC 4449, NGC 6822 (Barnard's Galaxy)",
  },
};

type Tab = "overview" | "formation" | "properties";

interface Props {
  result: Prediction;
  /** Local blob: URL from Predict page, or undefined when used from History */
  localImageUrl?: string;
}

export default function ResultAnalysis({ result, localImageUrl }: Props) {
  const [tab, setTab] = useState<Tab>("overview");

  const info   = GALAXY_INFO[result.predicted_class] ?? GALAXY_INFO["Spiral"];
  const accent = CLASS_COLORS[result.predicted_class] ?? "#6ab0ff";
  const confPct = (result.confidence * 100).toFixed(1);

  // Resolve image URL: local blob > backend relative/absolute path
  const rawImg = localImageUrl ?? result.image;
  const imgSrc =
    rawImg.startsWith("blob:") || rawImg.startsWith("http")
      ? rawImg
      : `${MEDIA_BASE}${rawImg}`;

  const sortedProbs = Object.entries(result.probabilities).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div className="analysis-panel">
      {/* ── Header ── */}
      <div className="analysis-header" style={{ borderBottom: `2px solid ${accent}33` }}>
        <div>
          <span
            className="galaxy-badge"
            style={{ background: `${accent}1a`, color: accent, border: `1px solid ${accent}88` }}
          >
            {result.predicted_class} Galaxy
          </span>
          <div className="analysis-confidence" style={{ color: accent }}>
            {confPct}%
            <span style={{ color: "var(--muted)", fontSize: 14, fontWeight: 400, marginLeft: 8 }}>
              confidence
            </span>
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{info.tagline}</div>
        </div>
        <div className="analysis-meta">
          <span style={{ color: "var(--muted)", fontSize: 12 }}>
            Classified {new Date(result.created_at).toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── Image + 3D Viewer ── */}
      <div className="analysis-visual">
        <div className="analysis-img-col">
          <img src={imgSrc} alt="Submitted galaxy" className="analysis-img" />
          <div className="analysis-img-label">Submitted Image</div>
        </div>
        <div className="analysis-viewer-col">
          <GalaxyViewer3D galaxyClass={result.predicted_class} particles={24000} />
          <div className="analysis-img-label" style={{ textAlign: "center", paddingTop: 4 }}>
            3D Simulation · drag to orbit · scroll to zoom
          </div>
        </div>
      </div>

      {/* ── Classification scores ── */}
      <div className="analysis-probs">
        <div className="section-label">Classification Scores</div>
        {sortedProbs.map(([cls, p]) => (
          <div key={cls} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
              <span
                style={{
                  color: CLASS_COLORS[cls] ?? "var(--fg)",
                  fontWeight: cls === result.predicted_class ? 700 : 400,
                }}
              >
                {cls}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: 12 }}>
                {(p * 100).toFixed(2)}%
              </span>
            </div>
            <div className="bar" style={{ height: 6 }}>
              <span
                style={{
                  width: `${p * 100}%`,
                  background: CLASS_COLORS[cls] ?? "var(--accent)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="tab-bar">
        {(["overview", "formation", "properties"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`tab-btn${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
            style={{ "--tab-color": accent } as React.CSSProperties}
          >
            {{ overview: "Overview", formation: "Formation", properties: "Properties" }[t]}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {tab === "overview" && (
          <>
            <p style={{ lineHeight: 1.75, marginBottom: 18 }}>{info.description}</p>
            <div className="section-label">Key Characteristics</div>
            <ul className="analysis-list">
              {info.characteristics.map((c, j) => (
                <li key={j} style={{ borderLeft: `3px solid ${accent}` }}>{c}</li>
              ))}
            </ul>
            <p style={{ marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
              <strong style={{ color: "var(--fg)" }}>Notable examples: </strong>
              {info.examples}
            </p>
          </>
        )}
        {tab === "formation" && (
          <p style={{ lineHeight: 1.85, fontSize: 14 }}>{info.formation}</p>
        )}
        {tab === "properties" && (
          <div className="stat-grid">
            {info.properties.map(({ label, value }) => (
              <div key={label} className="stat-item">
                <div className="stat-label">{label}</div>
                <div className="stat-value" style={{ color: accent }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
