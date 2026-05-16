import { Link } from "react-router-dom";

const MODULES = [
  { to: "/dashboard", title: "Mission Control" },
  { to: "/solar-system", title: "Solar System" },
  { to: "/iss-live", title: "ISS Live" },
  { to: "/sky-map", title: "Sky Map" },
  { to: "/mars-rover", title: "Mars Rover" },
  { to: "/epic-earth", title: "EPIC Earth" },
  { to: "/exoplanets", title: "Exoplanets" },
  { to: "/neo-radar", title: "NEO Radar" },
  { to: "/space-weather", title: "Space Weather" },
  { to: "/nasa-tv", title: "NASA TV" },
  { to: "/gallery", title: "Community Gallery" },
  { to: "/compare", title: "Compare" },
];

export default function PortalModules() {
  return (
    <div>
      <div className="portal-kicker">All Activities</div>
      <h2 className="portal-title">Module Access Deck</h2>
      <div className="portal-list">
        {MODULES.map((m) => (
          <Link to={m.to} className="portal-item" key={m.to} style={{ textDecoration: "none", color: "inherit" }}>
            <h4 style={{ marginBottom: 0 }}>{m.title}</h4>
          </Link>
        ))}
      </div>
    </div>
  );
}
