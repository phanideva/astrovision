import { ChangeEvent, DragEvent, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { predictionsApi, Prediction } from "../api/predictions";
import ResultAnalysis from "../components/ResultAnalysis";

export default function Predict() {
  const location = useLocation();
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

  // Accept file pre-loaded via Samples → "Classify" button
  useEffect(() => {
    const state = location.state as { preloadFile?: File } | null;
    if (state?.preloadFile instanceof File) {
      pick(state.preloadFile);
      window.history.replaceState({}, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <h2>Classify a Galaxy Image</h2>

      {/* ── Upload + quick summary ── */}
      <div className="grid">
        {/* Left: upload */}
        <div className="card">
          <label
            htmlFor="file-input"
            className={`dropzone ${dragOver ? "active" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {preview ? (
              <img
                src={preview}
                alt="preview"
                style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 8 }}
              />
            ) : (
              <>
                <p>Drag &amp; drop a JPEG / PNG, or click to choose</p>
                <p style={{ fontSize: 12 }}>Max 8 MB</p>
              </>
            )}
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/png,image/jpeg"
            style={{ display: "none" }}
            onChange={onChange}
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

        {/* Right: quick result snippet */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Quick Result</h3>
          {!result && (
            <p style={{ color: "var(--muted)" }}>
              {busy ? "Running model inference…" : "Awaiting image upload…"}
            </p>
          )}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <span style={{ fontSize: 28, fontWeight: 800 }}>{result.predicted_class}</span>
                <span style={{ color: "var(--muted)", marginLeft: 10, fontSize: 14 }}>
                  {(result.confidence * 100).toFixed(1)}% confidence
                </span>
              </div>
              {Object.entries(result.probabilities)
                .sort(([, a], [, b]) => b - a)
                .map(([cls, p]) => (
                  <div key={cls}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span>{cls}</span>
                      <span>{(p * 100).toFixed(1)}%</span>
                    </div>
                    <div className="bar" style={{ height: 5 }}>
                      <span style={{ width: `${p * 100}%` }} />
                    </div>
                  </div>
                ))}
              <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>
                ↓ Full analysis below
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Deep-dive analysis panel ── */}
      {result && (
        <ResultAnalysis result={result} localImageUrl={preview ?? undefined} />
      )}
    </div>
  );
}
