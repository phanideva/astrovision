import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { predictionsApi } from "../api/predictions";

const CLASSES = ["Spiral", "Elliptical", "Irregular", "Lenticular"] as const;
const COUNT = 50;

// Build exact filenames — matches what the generation script produces
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
  Spiral:     "#6ab0ff",
  Elliptical: "#ffdc82",
  Irregular:  "#7de0a0",
  Lenticular: "#d0aaff",
};

export default function Samples() {
  const navigate = useNavigate();
  const [classifying, setClassifying] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        // continue on individual failure
      }
      done++;
      setProgress({ done, total: SAMPLES.length });
    }
    setClassifying(false);
    setProgress(null);
    navigate("/history");
  }

  return (
    <div className="container">
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12, marginBottom: 8,
      }}>
        <h2 style={{ margin: 0 }}>Sample Galaxy Images</h2>
        <button
          className="btn"
          disabled={classifying}
          onClick={classifyAll}
          title="Submit all samples to the classifier and view results in History"
        >
          {classifying && progress
            ? `Classifying… ${progress.done}/${progress.total}`
            : "⚡ Classify All Samples"}
        </button>
      </div>

      <p style={{ marginBottom: 16, opacity: 0.75 }}>
        Click <b>↓ Download</b> to save an image and drop it on the{" "}
        <Link to="/predict">Classify</Link> page, or hit{" "}
        <b>⚡ Classify All Samples</b> to auto-submit every image — results
        appear in <Link to="/history">History</Link>.
      </p>

      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

      {classifying && progress && (
        <div style={{ marginBottom: 16 }}>
          <div className="bar" style={{ height: 8, borderRadius: 4 }}>
            <span style={{
              width: `${(progress.done / progress.total) * 100}%`,
              borderRadius: 4,
            }} />
          </div>
          <div style={{ fontSize: 12, marginTop: 4, color: "var(--muted)" }}>
            {progress.done} / {progress.total} submitted
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 200px)", gap: 16 }}>
        {SAMPLES.map(({ url, cls, label }) => (
          <div
            key={url}
            style={{
              background: "#0b1422",
              borderRadius: 10,
              overflow: "hidden",
              border: `1px solid ${CLASS_COLORS[cls]}44`,
            }}
          >
            <img
              src={url}
              alt={label}
              draggable
              loading="lazy"
              onDragStart={(e) => {
                const filename = url.split("/").pop() ?? "image.png";
                e.dataTransfer.setData(
                  "DownloadURL",
                  `image/png:${filename}:${window.location.origin}${url}`
                );
              }}
              style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
            />
            <div style={{
              padding: "6px 8px", display: "flex",
              alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: CLASS_COLORS[cls],
                textTransform: "uppercase", letterSpacing: 1,
              }}>
                {cls}
              </span>
              <a href={url} download
                style={{ fontSize: 11, color: "#9fb0ff", textDecoration: "none" }}>
                ↓ Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
