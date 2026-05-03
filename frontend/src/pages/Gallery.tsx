import { useEffect, useState } from "react";
import { galleryApi, PublicPrediction } from "../api/spaceMedia";

const CLASS_COLORS: Record<string, string> = {
  Spiral: "#6ab0ff",
  Elliptical: "#ffdc82",
  Lenticular: "#d0aaff",
  Irregular: "#7de0a0",
};

export default function Gallery() {
  const [items, setItems] = useState<PublicPrediction[]>([]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [board, setBoard] = useState<{ handle: string; total: number }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    galleryApi
      .publicList(page)
      .then((d) => {
        setItems(d.results);
        setCount(d.count);
      })
      .catch(() => setErr("Could not load public gallery."))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    galleryApi.leaderboard().then((d) => setBoard(d.results)).catch(() => {});
  }, []);

  const totalPages = Math.max(1, Math.ceil(count / 24));

  return (
    <div className="container">
      <h1 className="page-title">🌠 Public Gallery</h1>
      <p style={{ color: "var(--muted)", marginTop: -10 }}>
        Recent classifications shared publicly by the AstroVision community.
        Toggle "share publicly" on any of your predictions in History to add
        them here.
      </p>

      {board.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Top classifiers · last 30 days</h3>
          <ol style={{ paddingLeft: 20, margin: 0 }}>
            {board.map((b) => (
              <li key={b.handle} style={{ padding: "4px 0", color: "var(--muted)" }}>
                <span style={{ color: "var(--fg)", fontWeight: 600 }}>{b.handle}</span>{" "}
                — {b.total} classifications
              </li>
            ))}
          </ol>
        </div>
      )}

      {err && <div className="error">{err}</div>}
      {loading && <p style={{ color: "var(--muted)" }}>Loading…</p>}

      {!loading && items.length === 0 && !err && (
        <div className="card">
          <p style={{ color: "var(--muted)", margin: 0 }}>
            No public classifications yet — be the first to share!
          </p>
        </div>
      )}

      <div className="gallery-grid">
        {items.map((it) => (
          <div key={it.id} className="gallery-card" style={{
            borderColor: (CLASS_COLORS[it.predicted_class] || "#1f2545") + "55",
          }}>
            <img src={it.image} alt={it.predicted_class} loading="lazy" />
            <div className="gallery-meta">
              <span className="galaxy-badge" style={{
                background: (CLASS_COLORS[it.predicted_class] || "#888") + "33",
                color: CLASS_COLORS[it.predicted_class] || "var(--fg)",
              }}>
                {it.predicted_class}
              </span>
              <div className="gallery-conf">{(it.confidence * 100).toFixed(1)}%</div>
              <div className="gallery-handle">by {it.handle}</div>
            </div>
          </div>
        ))}
      </div>

      {count > 24 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
          <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </button>
          <span style={{ alignSelf: "center", color: "var(--muted)" }}>
            Page {page} / {totalPages}
          </span>
          <button className="btn secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
