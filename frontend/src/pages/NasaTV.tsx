import { useState } from "react";

type Channel = {
  key: string;
  label: string;
  embedId: string;
  desc: string;
};

const CHANNELS: Channel[] = [
  {
    key: "nasa-live",
    label: "NASA Live",
    embedId: "21X5lGlDOfg",
    desc: "Official NASA TV public channel — launches, mission events, press conferences.",
  },
  {
    key: "iss-hd",
    label: "ISS HD Earth Viewing",
    embedId: "DIgkvm2nmHc",
    desc: "Live high-definition cameras mounted on the International Space Station.",
  },
  {
    key: "esa-tv",
    label: "ESA Web TV",
    embedId: "vc-VmkLD4DA",
    desc: "European Space Agency live programming when broadcasting.",
  },
];

export default function NasaTV() {
  const [active, setActive] = useState<Channel>(CHANNELS[0]);
  return (
    <div className="container">
      <h1 className="page-title">📺 NASA Live TV</h1>
      <div className="tv-tabs">
        {CHANNELS.map((c) => (
          <button
            key={c.key}
            className={`tab-btn ${active.key === c.key ? "active" : ""}`}
            onClick={() => setActive(c)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="tv-frame">
        <iframe
          key={active.key}
          src={`https://www.youtube-nocookie.com/embed/${active.embedId}?autoplay=1&modestbranding=1&rel=0`}
          title={active.label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <p style={{ color: "var(--muted)", marginTop: 12 }}>{active.desc}</p>
      <p style={{ fontSize: 12, color: "var(--muted)" }}>
        Live streams may occasionally be offline between mission events.
        Embedded via YouTube nocookie domain — no tracking cookies are set.
      </p>
    </div>
  );
}
