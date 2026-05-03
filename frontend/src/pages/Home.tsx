import { Link } from "react-router-dom";
import GalaxyShowcase from "../components/GalaxyShowcase";
import ApodHero from "../components/ApodHero";
import { useAuth } from "../store/auth";

const FEATURE_CARDS: { to: string; icon: string; title: string; desc: string }[] = [
  { to: "/predict",       icon: "🔭", title: "Classify a Galaxy",  desc: "Upload a galaxy photo and let the AI identify its shape in seconds." },
  { to: "/solar-system",  icon: "🪐", title: "3D Solar System",    desc: "Explore all major planets in interactive 3D and compare their key facts." },
  { to: "/iss-live",      icon: "🛰️", title: "ISS Live Tracker",   desc: "Watch the International Space Station orbit Earth in real time on a 3D globe." },
  { to: "/nasa-tv",       icon: "📺", title: "NASA Live TV",       desc: "Stream NASA's live broadcasts and the ISS HD Earth-viewing experiment." },
  { to: "/sky-map",       icon: "✨", title: "Sky Map",             desc: "See the constellations currently overhead from your location." },
  { to: "/space-weather", icon: "☀️", title: "Space Weather",      desc: "Live solar imagery from NASA SDO and the latest geomagnetic Kp-index." },
  { to: "/gallery",       icon: "🌠", title: "Public Gallery",     desc: "Explore recent classifications from the AstroVision community." },
  { to: "/samples",       icon: "🖼️", title: "Image Library",      desc: "Browse curated space imagery and search NASA's public archive." },
];

export default function Home() {
  const { user, loading } = useAuth();

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
        <section className="learning-section">
          <div className="learning-head">
            <h2 className="page-title learning-title">Learn space science in one place</h2>
            <p className="learning-subtitle">
              One guided experience for real NASA data, galaxy-type classification,
              and interactive 3D exploration.
            </p>
            <div className="learning-pills">
              <span>Real Observatory Imagery</span>
              <span>AI Galaxy Typing</span>
              <span>Live Space Feeds</span>
              <span>Interactive 3D</span>
            </div>
          </div>

        <div className="feature-grid">
          {FEATURE_CARDS.map((c) => (
            <Link key={c.to} to={c.to} className="feature-card">
              <div className="feature-icon">{c.icon}</div>
              <div className="feature-title">{c.title}</div>
              <div className="feature-desc">{c.desc}</div>
            </Link>
          ))}
        </div>
        </section>
      </div>

      <div className="container">
        <h2 className="page-title">Real galaxy examples by type</h2>
        <GalaxyShowcase />
      </div>
    </>
  );
}
