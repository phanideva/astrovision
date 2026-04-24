import { useEffect, useState } from "react";
import { predictionsApi, Prediction } from "../api/predictions";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const MEDIA_BASE = API_BASE.replace(/\/api\/?$/, "");

export default function History() {
  const [items, setItems] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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
  }

  if (loading) return <div className="container">Loading…</div>;
  if (err) return <div className="container error">{err}</div>;

  return (
    <div className="container">
      <h2>Prediction History</h2>
      {items.length === 0 && (
        <p style={{ color: "var(--muted)" }}>
          No predictions yet — head to <a href="/predict">Classify</a>.
        </p>
      )}
      <div className="card" style={{ padding: 0 }}>
        {items.map((p) => (
          <div key={p.id} className="history-row">
            <img
              src={p.image.startsWith("http") ? p.image : `${MEDIA_BASE}${p.image}`}
              alt=""
            />
            <div className="meta">
              <strong>{p.predicted_class}</strong>{" "}
              <span style={{ color: "var(--muted)" }}>
                {(p.confidence * 100).toFixed(1)}%
              </span>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {new Date(p.created_at).toLocaleString()}
              </div>
            </div>
            <button className="btn danger" onClick={() => remove(p.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
