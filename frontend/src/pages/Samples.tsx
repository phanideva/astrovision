import { Link } from "react-router-dom";

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
  return (
    <div className="container">
      <h2 style={{ marginBottom: 6 }}>Sample Galaxy Images</h2>
      <p style={{ marginBottom: 20, opacity: 0.75 }}>
        Click <b>Download</b> to save an image, then drop it on the{" "}
        <Link to="/predict">Classify</Link> page to test the model.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 200px)", gap: 16 }}>
        {SAMPLES.map(({ url, cls, label }) => (
          <div
            key={url}
            style={{
              background: "#0b1422",
              borderRadius: 10,
              overflow: "hidden",
              border: `1px solid ${CLASS_COLORS[cls]}33`,
            }}
          >
            <img
              src={url}
              alt={label}
              draggable
              loading="lazy"
              onDragStart={(e) => {
                const filename = url.split("/").pop() ?? "image.png";
                e.dataTransfer.setData("DownloadURL", `image/png:${filename}:${window.location.origin}${url}`);
              }}
              style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
            />
            <div style={{ padding: "6px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: CLASS_COLORS[cls],
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {cls}
              </span>
              <a
                href={url}
                download
                style={{ fontSize: 11, color: "#9fb0ff", textDecoration: "none" }}
              >
                ↓ Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
