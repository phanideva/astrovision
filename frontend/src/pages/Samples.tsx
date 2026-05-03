import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { predictionsApi } from "../api/predictions";
import {
  spaceMediaApi,
  CuratedItem,
  NasaSearchItem,
} from "../api/spaceMedia";

const CLASSES = ["Spiral", "Elliptical", "Irregular", "Lenticular"] as const;
const COUNT = 50;

const SAMPLES: { url: string; cls: string; label: string }[] = Array.from(
  { length: COUNT },
  (_, i) => {
    const cls = CLASSES[i % CLASSES.length];
    const idx = i.toString().padStart(4, "0");
    return {
      url: `/samples/placeholder_${idx}_${cls}.png`,
      cls,
      label: `#${idx} ${cls}`,
    };
  }
);

const CLASS_COLORS: Record<string, string> = {
  Spiral: "#6ab0ff",
  Elliptical: "#ffdc82",
  Irregular: "#7de0a0",
  Lenticular: "#d0aaff",
};

type Tab = "samples" | "curated" | "nasa";

export default function Samples() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("samples");
  const [classifying, setClassifying] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [curated, setCurated] = useState<CuratedItem[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<NasaSearchItem[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (tab === "curated" && curated.length === 0) {
      spaceMediaApi.curated().then(setCurated).catch(() => {});
    }
  }, [tab, curated.length]);

  async function classifyAll() {
    setClassifying(true);
    setError(null);
    setProgress({ done: 0, total: SAMPLES.length });
    let done = 0;
    for (const s of SAMPLES) {
      try {
        const resp = await fetch(s.url);
        const blob = await resp.blob();
        const filename = s.url.split("/").pop() ?? "sample.png";
        const file = new File([blob], filename, { type: blob.type || "image/png" });
        await predictionsApi.create(file);
      } catch {
        /* continue */
      }
      done++;
      setProgress({ done, total: SAMPLES.length });
    }
    setClassifying(false);
    setProgress(null);
    navigate("/history");
  }

  async function useImageForPrediction(url: string, label: string) {
    try {
      const proxied = spaceMediaApi.proxyUrl(url);
      const r = await fetch(proxied);
      if (!r.ok) throw new Error("download failed");
      const blob = await r.blob();
      const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const filename = `${label.replace(/[^a-z0-9]+/gi, "_").slice(0, 40)}.${ext}`;
      const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
      navigate("/predict", { state: { preloadFile: file } });
    } catch {
      setError("Could not fetch this image. Try downloading and uploading manually.");
    }
  }

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const r = await spaceMediaApi.search(searchQ.trim());
      setSearchResults(r.collection.items.filter((i) => i.links?.length));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="container">
      <h1 className="page-title">Image Library</h1>

      <div className="tab-bar" style={{ marginBottom: 16 }}>
        <button className={`tab-btn ${tab === "samples" ? "active" : ""}`} onClick={() => setTab("samples")}>
          🧪 Classify Samples (50)
        </button>
        <button className={`tab-btn ${tab === "curated" ? "active" : ""}`} onClick={() => setTab("curated")}>
          🌌 Hubble &amp; JWST Highlights
        </button>
        <button className={`tab-btn ${tab === "nasa" ? "active" : ""}`} onClick={() => setTab("nasa")}>
          🔍 Search NASA Library
        </button>
      </div>

      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

      {tab === "samples" && (
        <>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12, marginBottom: 8,
          }}>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Drag a thumbnail onto the <Link to="/predict">Classify</Link> page,
              or hit <b>⚡ Classify All Samples</b> to bulk-submit every image.
            </p>
            <button className="btn" disabled={classifying} onClick={classifyAll}>
              {classifying && progress
                ? `Classifying… ${progress.done}/${progress.total}`
                : "⚡ Classify All Samples"}
            </button>
          </div>

          {classifying && progress && (
            <div style={{ marginBottom: 16 }}>
              <div className="bar" style={{ height: 8, borderRadius: 4 }}>
                <span style={{ width: `${(progress.done / progress.total) * 100}%`, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 12, marginTop: 4, color: "var(--muted)" }}>
                {progress.done} / {progress.total} submitted
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 200px)", gap: 16 }}>
            {SAMPLES.map(({ url, cls, label }) => (
              <div key={url} style={{
                background: "#0b1422", borderRadius: 10, overflow: "hidden",
                border: `1px solid ${CLASS_COLORS[cls]}44`,
              }}>
                <img src={url} alt={label} draggable loading="lazy"
                  style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                <div style={{ padding: "6px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: CLASS_COLORS[cls],
                    textTransform: "uppercase", letterSpacing: 1,
                  }}>{cls}</span>
                  <a href={url} download style={{ fontSize: 11, color: "#9fb0ff", textDecoration: "none" }}>
                    ↓ Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "curated" && (
        <div className="gallery-grid">
          {curated.map((c) => (
            <div key={c.id} className="gallery-card">
              <img src={c.thumb} alt={c.title} loading="lazy" />
              <div className="gallery-meta">
                <div style={{ fontWeight: 700, fontSize: 13 }}>{c.title}</div>
                <div className="gallery-handle">{c.credit}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }}
                    onClick={() => useImageForPrediction(c.full, c.id)}>
                    📥 Classify
                  </button>
                  <a className="btn secondary" href={c.source_url} target="_blank" rel="noreferrer noopener"
                     style={{ padding: "4px 10px", fontSize: 12 }}>
                    Source
                  </a>
                </div>
              </div>
            </div>
          ))}
          {curated.length === 0 && <p style={{ color: "var(--muted)" }}>Loading curated set…</p>}
        </div>
      )}

      {tab === "nasa" && (
        <>
          <form onSubmit={runSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input className="input" placeholder='Search NASA: "Andromeda", "Mars", "Crab Nebula"…'
              value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
            <button className="btn" disabled={searching || !searchQ.trim()}>
              {searching ? "Searching…" : "Search"}
            </button>
          </form>
          <div className="gallery-grid">
            {searchResults.map((it) => {
              const meta = it.data[0];
              const thumb = it.links?.[0]?.href;
              if (!thumb || !meta) return null;
              return (
                <div key={meta.nasa_id} className="gallery-card">
                  <img src={thumb} alt={meta.title} loading="lazy" />
                  <div className="gallery-meta">
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{meta.title}</div>
                    <div className="gallery-handle">
                      {meta.center} · {meta.date_created?.slice(0, 10)}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                      <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }}
                        onClick={() => useImageForPrediction(thumb, meta.nasa_id)}>
                        📥 Classify
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {searchResults.length === 0 && !searching && (
            <p style={{ color: "var(--muted)" }}>Try a query above to see results.</p>
          )}
        </>
      )}
    </div>
  );
}
