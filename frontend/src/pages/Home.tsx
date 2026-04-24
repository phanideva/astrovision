import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GalaxyViewer3D from "../components/GalaxyViewer3D";
import { useAuth } from "../store/auth";

const CLASSES = ["Spiral", "Elliptical", "Lenticular", "Irregular"] as const;
const CLASS_COLORS: Record<string, string> = {
  Spiral:     "#6ab0ff",
  Elliptical: "#ffdc82",
  Lenticular: "#d0aaff",
  Irregular:  "#7de0a0",
};

export default function Home() {
  const { user, loading } = useAuth();
  const [activeClass, setActiveClass] = useState<string>("Spiral");

  // Auto-cycle every 6 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setActiveClass((prev) => {
        const idx = CLASSES.indexOf(prev as typeof CLASSES[number]);
        return CLASSES[(idx + 1) % CLASSES.length];
      });
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <section className="hero">
        <h1>Classify Galaxies. Visualize the Cosmos.</h1>
        <p>
          AstroVision is a deep-learning powered web app that classifies
          deep-space galaxy images into morphological types — Spiral,
          Elliptical, Irregular, and Lenticular — and renders an
          interactive 3D representation of the prediction.
        </p>
        {!loading && (
          <p style={{ marginTop: 16 }}>
            {user ? (
              <>
                <Link to="/predict" className="btn" style={{ marginRight: 12 }}>
                  Classify a Galaxy
                </Link>
                <Link to="/samples" className="btn secondary">Browse Samples</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn" style={{ marginRight: 12 }}>
                  Get started
                </Link>
                <Link to="/login" className="btn secondary">Log in</Link>
              </>
            )}
          </p>
        )}
      </section>

      <div className="container">
        {/* Class selector tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {CLASSES.map((cls) => (
            <button
              key={cls}
              onClick={() => setActiveClass(cls)}
              style={{
                padding: "6px 18px",
                borderRadius: 20,
                border: `1.5px solid ${CLASS_COLORS[cls]}`,
                background: activeClass === cls ? CLASS_COLORS[cls] + "33" : "transparent",
                color: CLASS_COLORS[cls],
                fontWeight: activeClass === cls ? 700 : 400,
                cursor: "pointer",
                fontSize: 13,
                transition: "all 0.2s",
              }}
            >
              {cls}
            </button>
          ))}
        </div>

        <div className="card" style={{ height: 460 }}>
          <GalaxyViewer3D galaxyClass={activeClass} particles={16000} />
        </div>
        <p style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
          Interactive 3D simulation · drag to rotate · scroll to zoom
        </p>
      </div>
    </>
  );
}
