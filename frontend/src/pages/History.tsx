import { useEffect, useState } from "react";
import { predictionsApi, Prediction } from "../api/predictions";
import ResultAnalysis from "../components/ResultAnalysis";

const CLASS_COLORS: Record<string, string> = {
  Spiral: "#6ab0ff", Elliptical: "#ffdc82",
  Lenticular: "#d0aaff", Irregular: "#7de0a0",
};

const API_BASE   = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const MEDIA_BASE = API_BASE.replace(/\/api\/?$/, "");

export default function History() {
  const [items, setItems]       = useState<Prediction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function load() {
    try {
      const r = await predictionsApi.list();
      setItems(r.results);
    } catch {
      setErr("Failed to load history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(id: number) {
    await predictionsApi.remove(id);
    setItems((xs) => xs.filter((x) => x.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  if (loading) return <div className="container">Loading…</div>;
  if (err)     return <div className="container error">{err}</div>;

  return (
    <div className="container">
      <h2>Prediction History</h2>
      {items.length === 0 && (
        <p style={{ color: "var(--muted)" }}>
          No predictions yet — head to <a href="/predict">Classify</a>.
        </p>
      )}

      {items.map((p) => {
        const accent  = CLASS_COLORS[p.predicted_class] ?? "#6ab0ff";
        const imgSrc  = p.image.startsWith("http") ? p.image : `${MEDIA_BASE}${p.image}`;
        const isOpen  = expandedId === p.id;

        return (
          <div
            key={p.id}
            className="card"
            style={{ padding: 0, marginBottom: 12, border: isOpen ? `1px solid ${accent}55` : undefined }}
          >
            {/* Summary row — click to expand */}
            <div
              className="history-row"
              style={{ cursor: "pointer", padding: "12px 16px" }}
              onClick={() => setExpandedId(isOpen ? null : p.id)}
            >
              <img src={imgSrc} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />
              <div className="meta" style={{ flex: 1 }}>
                <strong style={{ color: accent }}>{p.predicted_class}</strong>
                <span style={{ color: "var(--muted)", marginLeft: 8, fontSize: 13 }}>
                  {(p.confidence * 100).toFixed(1)}% confidence
                </span>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  {new Date(p.created_at).toLocaleString()}
                </div>
              </div>
              <span style={{ color: "var(--muted)", fontSize: 20, marginRight: 8, userSelect: "none" }}>
                {isOpen ? "▲" : "▼"}
              </span>
              <button
                className="btn danger"
                style={{ flexShrink: 0 }}
                onClick={(e) => { e.stopPropagation(); remove(p.id); }}
              >
                Delete
              </button>
            </div>

            {/* Expanded deep-dive */}
            {isOpen && (
              <div style={{ borderTop: `1px solid ${accent}33` }}>
                <ResultAnalysis result={p} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
