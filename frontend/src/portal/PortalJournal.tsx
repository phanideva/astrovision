import { FormEvent, useEffect, useState } from "react";
import { JournalEntry, portalApi } from "../api/portal";

export default function PortalJournal() {
  const [rows, setRows] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<JournalEntry["mood"]>("curious");
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const data = await portalApi.listJournal();
    setRows(data.results);
  }

  useEffect(() => {
    load().catch(() => setErr("Failed to load journal."));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setErr(null);
    try {
      await portalApi.createJournal({ title, body_md: body, mood });
      setTitle("");
      setBody("");
      setMood("curious");
      await load();
    } catch {
      setErr("Could not create journal entry.");
    }
  }

  return (
    <div>
      <div className="portal-kicker">Mission Journal</div>
      <h2 className="portal-title">Captain's Log</h2>
      <form onSubmit={submit} className="portal-card" style={{ marginBottom: 12 }}>
        <div className="field">
          <label>Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label>Mood</label>
          <select className="input" value={mood} onChange={(e) => setMood(e.target.value as JournalEntry["mood"])}>
            <option value="curious">Curious</option>
            <option value="inspired">Inspired</option>
            <option value="analytical">Analytical</option>
            <option value="celebratory">Celebratory</option>
          </select>
        </div>
        <div className="field">
          <label>Entry</label>
          <textarea className="input" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <button className="btn">Save Entry</button>
        {err && <div className="error">{err}</div>}
      </form>

      <div className="portal-list">
        {rows.map((r) => (
          <div className="portal-item" key={r.id}>
            <h4>{r.title}</h4>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>{r.mood}</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{r.body_md}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
