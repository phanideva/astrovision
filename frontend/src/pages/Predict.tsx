import { ChangeEvent, DragEvent, useState } from "react";
import { predictionsApi, Prediction } from "../api/predictions";
import GalaxyViewer3D from "../components/GalaxyViewer3D";

export default function Predict() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Prediction | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function pick(f: File | null) {
    setFile(f);
    setResult(null);
    setErr(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    pick(e.dataTransfer.files[0] ?? null);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    pick(e.target.files?.[0] ?? null);
  }

  async function submit() {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await predictionsApi.create(file);
      setResult(r);
    } catch (e: any) {
      setErr(e?.response?.data?.image?.[0] ?? "Prediction failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <h2>Classify a galaxy image</h2>
      <div className="grid">
        <div className="card">
          <label
            htmlFor="file-input"
            className={`dropzone ${dragOver ? "active" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {preview ? (
              <img src={preview} alt="preview"
                style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 8 }} />
            ) : (
              <>
                <p>Drag & drop a JPEG/PNG, or click to choose</p>
                <p style={{ fontSize: 12 }}>Max 8 MB</p>
              </>
            )}
          </label>
          <input
            id="file-input" type="file" accept="image/png,image/jpeg"
            style={{ display: "none" }} onChange={onChange}
          />
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button className="btn" onClick={submit} disabled={!file || busy}>
              {busy ? "Analyzing…" : "Classify"}
            </button>
            {file && (
              <button className="btn secondary" onClick={() => pick(null)}>
                Clear
              </button>
            )}
          </div>
          {err && <div className="error">{err}</div>}
        </div>

        <div className="card">
          <h3>Result</h3>
          {!result && <p style={{ color: "var(--muted)" }}>Awaiting image…</p>}
          {result && (
            <>
              <p>
                <strong style={{ fontSize: 22 }}>{result.predicted_class}</strong>
                <span style={{ color: "var(--muted)", marginLeft: 8 }}>
                  {(result.confidence * 100).toFixed(1)}% confidence
                </span>
              </p>
              {Object.entries(result.probabilities).map(([cls, p]) => (
                <div key={cls} style={{ marginBottom: 8 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", fontSize: 13,
                  }}>
                    <span>{cls}</span>
                    <span>{(p * 100).toFixed(1)}%</span>
                  </div>
                  <div className="bar">
                    <span style={{ width: `${p * 100}%` }} />
                  </div>
                </div>
              ))}
              <div style={{ height: 280, marginTop: 16 }}>
                <GalaxyViewer3D galaxyClass={result.predicted_class} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
