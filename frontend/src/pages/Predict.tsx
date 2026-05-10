import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { IconDownload, IconVolume, IconVolumeOff } from "@tabler/icons-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { predictionsApi, Prediction } from "../api/predictions";
import { gamificationApi } from "../api/gamification";
import ResultAnalysis from "../components/ResultAnalysis";
import GlitchText from "../design/GlitchText";
import HudPanel from "../design/HudPanel";
import Reveal from "../design/Reveal";
import { NeonButton } from "../design/NeonButton";
import { emitToast } from "../design/toast";

const SUMMARIES: Record<string, string> = {
  Spiral: "Spiral galaxy detected. Sweeping arms, active star formation, and a central bulge are characteristic features.",
  Elliptical: "Elliptical galaxy detected. A massive, gas-poor ellipsoid populated with ancient stellar populations.",
  Lenticular: "Lenticular galaxy detected. A disk system that has exhausted its star-forming gas.",
  Irregular: "Irregular galaxy detected. Chaotic morphology with bursty star formation and rich gas content.",
};

export default function Predict() {
  const location = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Prediction | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  function pick(f: File | null) {
    setFile(f);
    setResult(null);
    setErr(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

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
      emitToast({ id: Date.now(), title: `Classified: ${r.predicted_class}`, message: `${(r.confidence * 100).toFixed(1)}% confidence`, tone: "cyan" });
      try {
        const g = await gamificationApi.event("predict");
        g.unlocked.forEach((u) =>
          emitToast({ id: Date.now() + Math.random(), title: u.title, message: u.description, tone: "amber" })
        );
      } catch { /* ignore */ }
    } catch (e: any) {
      setErr(e?.response?.data?.image?.[0] ?? "Prediction failed.");
    } finally {
      setBusy(false);
    }
  }

  function speak() {
    if (!result || typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const summary = SUMMARIES[result.predicted_class] ?? `Classified as ${result.predicted_class}.`;
    const top = Object.entries(result.probabilities).sort(([, a], [, b]) => b - a).slice(0, 3);
    const probLine = top.map(([k, v]) => `${k}: ${(v * 100).toFixed(0)} percent`).join(", ");
    const u = new SpeechSynthesisUtterance(`${summary}. Top probabilities: ${probLine}.`);
    u.rate = 0.95; u.pitch = 1.0;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }

  async function exportPdf() {
    if (!exportRef.current) return;
    emitToast({ id: Date.now(), title: "EXPORTING", message: "Generating mission report PDF…", tone: "cyan" });
    const node = exportRef.current;
    const canvas = await html2canvas(node, { backgroundColor: "#05060a", scale: 1.5, useCORS: true });
    const img = canvas.toDataURL("image/jpeg", 0.85);
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const ratio = canvas.width / canvas.height;
    const w = pw - 40;
    const h = w / ratio;
    let y = 20;
    if (h <= ph - 40) {
      pdf.addImage(img, "JPEG", 20, y, w, h);
    } else {
      // multi-page
      const pageH = ph - 40;
      const totalPages = Math.ceil(h / pageH);
      const sliceH = canvas.height / totalPages;
      for (let i = 0; i < totalPages; i++) {
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceH;
        const ctx = slice.getContext("2d")!;
        ctx.drawImage(canvas, 0, -i * sliceH);
        const sliceImg = slice.toDataURL("image/jpeg", 0.85);
        if (i > 0) pdf.addPage();
        pdf.addImage(sliceImg, "JPEG", 20, 20, w, pageH);
      }
    }
    pdf.save(`astrovision-classification-${result?.id ?? Date.now()}.pdf`);
  }

  const radarData = result
    ? Object.entries(result.probabilities).map(([k, v]) => ({ axis: k, value: +(v * 100).toFixed(1) }))
    : [];

  return (
    <div className="hud-page">
      <Reveal>
        <span className="hud-eyebrow"><span className="dot" />NEURAL CLASSIFIER · v2</span>
        <GlitchText as="h1" text="GALAXY CLASSIFIER" className="hud-title" />
        <p className="hud-subtitle">Upload an image. The model returns morphology + class probability with full mission report.</p>
      </Reveal>

      <div ref={exportRef}>
        <div className="hud-grid-2" style={{ marginTop: 24 }}>
          <Reveal>
            <HudPanel tone="cyan" grid scanlines>
              <label
                htmlFor="file-input"
                className={`dropzone ${dragOver ? "active" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                style={{ position: "relative", overflow: "hidden", border: "1px dashed rgba(92,242,255,0.4)", borderRadius: 8, padding: 18, display: "block", cursor: "pointer", textAlign: "center" }}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="preview" style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 8 }} />
                    {busy && <div className="scan-line" />}
                  </>
                ) : (
                  <>
                    <p style={{ color: "var(--av-cyan)", fontFamily: "var(--font-hud)", letterSpacing: "0.15em" }}>
                      ▶ DROP IMAGE OR CLICK TO BROWSE
                    </p>
                    <p style={{ fontSize: 12, opacity: 0.6 }}>JPEG / PNG · max 8 MB</p>
                  </>
                )}
              </label>
              <input id="file-input" type="file" accept="image/png,image/jpeg" style={{ display: "none" }} onChange={onChange} />
              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <NeonButton onClick={submit} disabled={!file || busy}>
                  {busy ? "ANALYZING…" : "▶ Classify"}
                </NeonButton>
                {file && <NeonButton tone="violet" onClick={() => pick(null)}>Clear</NeonButton>}
              </div>
              {err && <div style={{ color: "var(--av-pink)", marginTop: 10 }}>{err}</div>}
            </HudPanel>
          </Reveal>

          <Reveal delay={0.05}>
            <HudPanel tone="violet" grid>
              <h3 style={{ marginTop: 0, fontFamily: "var(--font-hud)" }}>Quick Result</h3>
              <AnimatePresence mode="wait">
                {!result ? (
                  <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "var(--muted)" }}>
                    {busy ? "Running model inference…" : "Awaiting image upload…"}
                  </motion.p>
                ) : (
                  <motion.div key="ok" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                      <span style={{ fontSize: 30, fontWeight: 800, color: "var(--av-cyan)", fontFamily: "var(--font-hud)" }}>
                        {result.predicted_class}
                      </span>
                      <span style={{ color: "var(--muted)" }}>
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: 220, marginTop: 10 }}>
                      <ResponsiveContainer>
                        <RadarChart data={radarData} outerRadius={75}>
                          <PolarGrid stroke="rgba(168,123,255,0.25)" />
                          <PolarAngleAxis dataKey="axis" stroke="#cfeefb" tick={{ fontSize: 11, fill: "#cfeefb" }} />
                          <Radar dataKey="value" stroke="var(--av-cyan)" fill="var(--av-cyan)" fillOpacity={0.35} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <NeonButton tone="violet" onClick={speak}>
                        {speaking ? <IconVolumeOff size={14} /> : <IconVolume size={14} />} {speaking ? "Stop" : "Narrate"}
                      </NeonButton>
                      <NeonButton tone="amber" onClick={exportPdf}>
                        <IconDownload size={14} /> PDF
                      </NeonButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </HudPanel>
          </Reveal>
        </div>

        {result && (
          <div style={{ marginTop: 24 }}>
            <ResultAnalysis result={result} localImageUrl={preview ?? undefined} />
          </div>
        )}
      </div>
    </div>
  );
}
