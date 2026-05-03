import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GalaxyViewer3D from "../components/GalaxyViewer3D";
import ApodHero from "../components/ApodHero";
import { useAuth } from "../store/auth";

const CLASSES = ["Spiral", "Elliptical", "Lenticular", "Irregular"] as const;
const CLASS_COLORS: Record<string, string> = {
  Spiral:     "#6ab0ff",
  Elliptical: "#ffdc82",
  Lenticular: "#d0aaff",
  Irregular:  "#7de0a0",
};

const FEATURE_CARDS: { to: string; icon: string; title: string; desc: string }[] = [
  { to: "/predict",       icon: "🔭", title: "Classify a Galaxy",  desc: "Upload an image and let our ResNet-18 model identify its morphology in real time." },
  { to: "/solar-system",  icon: "🪐", title: "3D Solar System",    desc: "Walk through the planets in interactive 3D with realistic orbits and textures." },
  { to: "/iss-live",      icon: "🛰️", title: "ISS Live Tracker",   desc: "Watch the International Space Station orbit Earth in real time on a 3D globe." },
  { to: "/nasa-tv",       icon: "📺", title: "NASA Live TV",       desc: "Stream NASA's live broadcasts and the ISS HD Earth-viewing experiment." },
  { to: "/sky-map",       icon: "✨", title: "Sky Map",             desc: "See the constellations currently overhead from your location." },
  { to: "/space-weather", icon: "☀️", title: "Space Weather",      desc: "Live solar imagery from NASA SDO and the latest geomagnetic Kp-index." },
  { to: "/gallery",       icon: "🌠", title: "Public Gallery",     desc: "Explore recent classifications from the AstroVision community." },
  { to: "/samples",       icon: "🖼️", title: "Image Library",      desc: "Browse curated Hubble & JWST imagery and search NASA's archive." },
];

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
      <ApodHero />

      <div className="container">
        <div className="cta-row">
          {!loading &&
            (user ? (
              <>
                <Link to="/predict" className="btn">Classify a Galaxy</Link>
                <Link to="/samples" className="btn secondary">Browse Samples</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn">Get started</Link>
                <Link to="/login" className="btn secondary">Log in</Link>
              </>
            ))}
        </div>
      </div>

      <div className="container">
        <h2 className="page-title">Explore the cosmos</h2>
        <div className="feature-grid">
          {FEATURE_CARDS.map((c) => (
            <Link key={c.to} to={c.to} className="feature-card">
              <div className="feature-icon">{c.icon}</div>
              <div className="feature-title">{c.title}</div>
              <div className="feature-desc">{c.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="container">
        <h2 className="page-title">Live galaxy preview</h2>
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
