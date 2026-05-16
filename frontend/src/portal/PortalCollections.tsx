import { FormEvent, useEffect, useState } from "react";
import { Collection, portalApi } from "../api/portal";

export default function PortalCollections() {
  const [rows, setRows] = useState<Collection[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await portalApi.listCollections();
    setRows(data.results);
  }

  useEffect(() => {
    load().catch(() => setError("Could not load collections."));
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    try {
      await portalApi.createCollection({
        name,
        description,
        cover_url: "",
        is_public: false,
      });
      setName("");
      setDescription("");
      await load();
    } catch {
      setError("Could not create collection.");
    }
  }

  return (
    <div>
      <div className="portal-kicker">Saved Collections</div>
      <h2 className="portal-title">Curated Artifacts</h2>

      <form onSubmit={onCreate} className="portal-card" style={{ marginBottom: 12 }}>
        <div className="field">
          <label>Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button className="btn">Create Collection</button>
      </form>

      {error && <div className="error">{error}</div>}

      <div className="portal-list">
        {rows.map((row) => (
          <div className="portal-item" key={row.id}>
            <h4>{row.name}</h4>
            <div style={{ opacity: 0.8 }}>{row.description || "No description"}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              {row.items_count} item(s)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
