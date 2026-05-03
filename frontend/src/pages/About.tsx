import { CREATOR } from "../config";

export default function About() {
  return (
    <div className="container about-page">
      <h1 className="page-title">About AstroVision</h1>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>What AstroVision is for</h2>
        <p>
          AstroVision is an education-first space app for students, hobbyists,
          and curious learners. You can upload a galaxy image and the AI will
          classify it as <b>Spiral</b>, <b>Elliptical</b>, <b>Lenticular</b>, or
          <b> Irregular</b>. You can also explore real NASA imagery, track the ISS,
          view live space-weather feeds, and interact with a 3D Solar System.
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Who should use it</h2>
        <ul>
          <li>Students learning astronomy, image classification, and AI basics.</li>
          <li>Space enthusiasts who want one place for NASA-driven visual tools.</li>
          <li>Developers who want a reference full-stack ML web application.</li>
        </ul>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>How the AI works</h2>
        <ul>
          <li>
            <b>Model</b> — ResNet-18 trained on the Galaxy10 SDSS dataset,
            reduced to a 4-class galaxy-type output.
          </li>
          <li>
            <b>Backend</b> — Django 5 + Django REST Framework + SimpleJWT, with
            a thread-safe singleton inference service running PyTorch on CPU.
          </li>
          <li>
            <b>Frontend</b> — React 18 + Vite + TypeScript, three.js / R3F for
            real-time 3D galaxy and Solar-System rendering.
          </li>
          <li>
            <b>Imagery</b> — NASA APOD, NASA Image &amp; Video Library, ESA /
            Hubble public-domain releases, plus a curated bundled set.
          </li>
        </ul>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          Note: if demo weights are being used, predictions are for product flow
          demonstration and may not match scientific-grade accuracy.
        </p>
      </div>

      <div className="card creator-card">
        <h2 style={{ marginTop: 0 }}>Creator</h2>
        <div className="creator-grid">
          <div className="creator-avatar" aria-hidden>
            {CREATOR.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 3)
              .join("")}
          </div>
          <div>
            <div className="creator-name">{CREATOR.name}</div>
            <div className="creator-role">{CREATOR.role} · AstroVision</div>
            <div className="creator-links">
              <a href={`mailto:${CREATOR.email}`}>✉ {CREATOR.email}</a>
              <a href={CREATOR.linkedin} target="_blank" rel="noreferrer noopener">
                🔗 LinkedIn
              </a>
            </div>
            <p style={{ marginTop: 12, color: "var(--muted)" }}>
              Designer and developer of the full AstroVision stack: dataset
              pipeline, model training, REST API, React UI, 3D visualizations,
              NASA integrations and Render deployment.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Credits &amp; data sources</h2>
        <ul>
          <li>NASA Astronomy Picture of the Day (APOD) — public domain.</li>
          <li>NASA Image and Video Library — public domain unless noted.</li>
          <li>ESA / Hubble — Creative Commons Attribution 4.0.</li>
          <li>Galaxy10 SDSS dataset — Leung &amp; Bovy (2019).</li>
          <li>Open Notify / wheretheiss.at — ISS positional data.</li>
          <li>NOAA SWPC — space-weather indices.</li>
        </ul>
      </div>
    </div>
  );
}
