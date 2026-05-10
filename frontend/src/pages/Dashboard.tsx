import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconAlertTriangle,
  IconRocket,
  IconSatellite,
  IconSun,
  IconWorld,
} from "@tabler/icons-react";
import GlitchText from "../design/GlitchText";
import HudPanel from "../design/HudPanel";
import Reveal from "../design/Reveal";
import Stat from "../design/Stat";
import { spaceMediaApi, ApodResponse } from "../api/spaceMedia";

type Iss = { latitude: number; longitude: number; altitude: number; velocity: number } | null;

export default function Dashboard() {
  const [apod, setApod] = useState<ApodResponse | null>(null);
  const [iss, setIss] = useState<Iss>(null);
  const [kp, setKp] = useState<number | null>(null);
  const [neoCount, setNeoCount] = useState<number | null>(null);
  const [neoHaz, setNeoHaz] = useState<number>(0);
  const [launch, setLaunch] = useState<{ name: string; net: string; provider: string } | null>(null);
  const [eonet, setEonet] = useState<any[]>([]);

  useEffect(() => {
    spaceMediaApi.apod().then(setApod).catch(() => undefined);
    const issTimer = setInterval(() => {
      fetch("https://api.wheretheiss.at/v1/satellites/25544")
        .then((r) => r.json())
        .then(setIss).catch(() => undefined);
    }, 5000);
    fetch("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json")
      .then((r) => r.json())
      .then((rows: string[][]) => {
        const v = rows.at(-1)?.[1];
        if (v) setKp(parseFloat(v));
      }).catch(() => undefined);
    spaceMediaApi.neoFeed()
      .then((d) => {
        const els: any[] = Object.values(d.near_earth_objects ?? {}).flat() as any[];
        setNeoCount(els.length);
        setNeoHaz(els.filter((n: any) => n.is_potentially_hazardous_asteroid).length);
      }).catch(() => undefined);
    spaceMediaApi.launchNext(1)
      .then((d) => {
        const r = d.results?.[0];
        if (r) setLaunch({ name: r.name, net: r.net, provider: r.launch_service_provider?.name ?? "" });
      }).catch(() => undefined);
    spaceMediaApi.eonet(8)
      .then((d) => setEonet(d.events ?? [])).catch(() => undefined);
    return () => clearInterval(issTimer);
  }, []);

  return (
    <div className="hud-page">
      <Reveal>
        <span className="hud-eyebrow"><span className="dot" />MISSION CONTROL · LIVE</span>
        <GlitchText as="h1" text="OPERATIONS DECK" className="hud-title" />
        <p className="hud-subtitle">Unified telemetry across NASA, NOAA, and orbital tracking sources.</p>
      </Reveal>

      <div className="hud-grid-4" style={{ marginTop: 24 }}>
        <Reveal><Stat label="ISS LAT" value={iss ? `${iss.latitude.toFixed(2)}°` : "—"} /></Reveal>
        <Reveal delay={0.05}><Stat label="ISS LON" value={iss ? `${iss.longitude.toFixed(2)}°` : "—"} tone="violet" /></Reveal>
        <Reveal delay={0.1}><Stat label="VELOCITY" value={iss ? `${(iss.velocity / 1000).toFixed(1)} km/s` : "—"} tone="green" /></Reveal>
        <Reveal delay={0.15}><Stat label="ALTITUDE" value={iss ? `${iss.altitude.toFixed(0)} km` : "—"} tone="amber" /></Reveal>
        <Reveal delay={0.2}><Stat label="KP INDEX" value={kp != null ? kp.toFixed(1) : "—"} tone={kp != null && kp >= 5 ? "amber" : "cyan"} /></Reveal>
        <Reveal delay={0.25}><Stat label="NEO TODAY" value={neoCount != null ? `${neoCount}` : "—"} tone="violet" /></Reveal>
        <Reveal delay={0.3}><Stat label="HAZARDOUS" value={`${neoHaz}`} tone={neoHaz > 0 ? "amber" : "green"} /></Reveal>
        <Reveal delay={0.35}><Stat label="EVENTS · OPEN" value={`${eonet.length}`} tone="green" /></Reveal>
      </div>

      <div className="hud-grid-2" style={{ marginTop: 28 }}>
        <Reveal>
          <HudPanel tone="violet" grid>
            <span className="hud-eyebrow violet"><span className="dot" /><IconSun size={12} /> APOD</span>
            <h3 style={{ margin: "10px 0 8px" }}>{apod?.title ?? "Loading…"}</h3>
            {apod?.media_type === "image" && apod.url && (
              <img src={apod.url} alt={apod.title} style={{ width: "100%", borderRadius: 6, marginBottom: 8 }} />
            )}
            <p style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.85 }}>
              {apod?.explanation?.slice(0, 240)}…
            </p>
          </HudPanel>
        </Reveal>
        <Reveal delay={0.1}>
          <HudPanel tone="amber" grid>
            <span className="hud-eyebrow amber"><span className="dot" /><IconRocket size={12} /> NEXT LAUNCH</span>
            <h3 style={{ margin: "10px 0 8px" }}>{launch?.name ?? "—"}</h3>
            <div style={{ fontSize: 13 }}>{launch?.provider}</div>
            <div style={{ marginTop: 8, fontFamily: "var(--font-hud)" }}>
              {launch?.net ? new Date(launch.net).toUTCString() : ""}
            </div>
          </HudPanel>
        </Reveal>
        <Reveal delay={0.15}>
          <HudPanel tone="cyan" grid>
            <span className="hud-eyebrow"><span className="dot" /><IconAlertTriangle size={12} /> NATURAL EVENTS</span>
            <ul style={{ listStyle: "none", padding: 0, margin: 10, display: "grid", gap: 6 }}>
              {eonet.slice(0, 6).map((e) => (
                <li key={e.id} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span>{e.title}</span>
                  <span style={{ opacity: 0.6 }}>{e.categories?.[0]?.title}</span>
                </li>
              ))}
            </ul>
          </HudPanel>
        </Reveal>
        <Reveal delay={0.2}>
          <HudPanel tone="green" grid>
            <span className="hud-eyebrow green"><span className="dot" /><IconSatellite size={12} /> JUMP TO SECTOR</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <Link to="/iss-live" className="holo-card"><IconSatellite size={16} /> ISS Tracker</Link>
              <Link to="/mars-rover" className="holo-card"><IconWorld size={16} /> Mars Rover</Link>
              <Link to="/epic-earth" className="holo-card"><IconWorld size={16} /> EPIC Earth</Link>
              <Link to="/exoplanets" className="holo-card"><IconRocket size={16} /> Exoplanets</Link>
              <Link to="/neo-radar" className="holo-card"><IconAlertTriangle size={16} /> NEO Radar</Link>
              <Link to="/space-weather" className="holo-card"><IconSun size={16} /> Sun Live</Link>
            </div>
          </HudPanel>
        </Reveal>
      </div>
    </div>
  );
}
