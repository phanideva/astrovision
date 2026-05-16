import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import {
  IconBrandTelegram,
  IconRocket,
  IconSatellite,
  IconStars,
  IconTelescope,
  IconUfo,
  IconWorld,
  IconChartRadar,
} from "@tabler/icons-react";

import GalaxyShowcase from "../components/GalaxyShowcase";
import ApodHero from "../components/ApodHero";
import { spaceMediaApi } from "../api/spaceMedia";
import { useAuth } from "../store/auth";
import GlitchText from "../design/GlitchText";
import Reveal from "../design/Reveal";
import { NeonLink } from "../design/NeonButton";
import Wormhole from "../three/Wormhole";

const FEATURES = [
  { to: "/predict",            icon: IconTelescope,  title: "Classify Galaxy",     desc: "Upload a galaxy image — neural classifier returns morphological type in seconds." },
  { to: "/dashboard",          icon: IconChartRadar, title: "Mission Control",     desc: "Live cockpit: APOD · ISS · Sun · Kp · NEO · launches in one HUD." },
  { to: "/solar-system",       icon: IconRocket,     title: "3D Solar System",     desc: "Real texture maps, accurate tilts, asteroid belt, free-flight camera." },
  { to: "/iss-live",           icon: IconSatellite,  title: "ISS Live Tracker",    desc: "Watch the station orbit Earth on a 3D globe, real-time telemetry." },
  { to: "/mars-rover",         icon: IconUfo,        title: "Mars Rover Photos",   desc: "Curiosity / Perseverance — filterable feed straight from Mars." },
  { to: "/epic-earth",         icon: IconWorld,      title: "EPIC Earth",          desc: "Daily DSCOVR L1 imagery — Earth as seen from 1.5 million km away." },
  { to: "/exoplanets",         icon: IconStars,      title: "Exoplanet Archive",   desc: "Filter 5,000+ confirmed worlds, visualize their orbit in 3D." },
  { to: "/neo-radar",          icon: IconChartRadar, title: "NEO Radar",           desc: "Animated sweep of asteroids passing close to Earth this week." },
  { to: "/sky-map",            icon: IconStars,      title: "Sky Map",             desc: "Live planetarium centered on your coordinates." },
  { to: "/space-weather",      icon: IconRocket,     title: "Space Weather",       desc: "Live SDO solar imagery + planetary K-index." },
  { to: "/nasa-tv",            icon: IconBrandTelegram, title: "NASA Live TV",     desc: "Stream NASA, ESA and ISS HD Earth-viewing channels." },
  { to: "/gallery",            icon: IconStars,      title: "Public Gallery",      desc: "Recent classifications shared by the AstroVision community." },
];

function MarqueeData() {
  const [items, setItems] = useState<string[]>([
    "TRANSMISSION OPEN", "AWAITING TELEMETRY", "ALL SYSTEMS NOMINAL",
  ]);
  useEffect(() => {
    spaceMediaApi.apod()
      .then((d) => setItems((xs) => [...xs, `APOD: ${d.title}`]))
      .catch(() => { /* ignore */ });
    fetch("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json")
      .then((r) => r.json())
      .then((rows: string[][]) => {
        const v = rows.at(-1)?.[1];
        if (v) setItems((xs) => [...xs, `KP INDEX: ${parseFloat(v).toFixed(1)}`]);
      })
      .catch(() => { /* ignore */ });
  }, []);
  const all = [...items, ...items];
  return (
    <div className="hud-marquee">
      <div className="track">
        {all.map((t, i) => (
          <span key={i}>◆ {t}</span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const reduced = useReducedMotion();

  if (!loading && user) {
    return <Navigate to="/portal" replace />;
  }

  // Cinematic scroll sequence
  const wormholeRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wormholeRef,
    offset: ["start start", "end start"],
  });
  const wormholeOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0]);
  const wormholeScale = useTransform(scrollYProgress, [0, 1], [1, 1.6]);
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);

  return (
    <>
      {/* ── 1. APOD intro hero ── */}
      <ApodHero />

      <div className="hud-page" style={{ paddingTop: 16 }}>
        <Reveal>
          <div style={{ textAlign: "center" }}>
            <span className="hud-eyebrow violet"><span className="dot" />OPERATIONAL · v2</span>
            <GlitchText
              as="h1"
              text="ASTROVISION // FUTURE COSMOS LAB"
              className="hud-title"
              style={{ marginTop: 14 }}
            />
            <p className="hud-subtitle" style={{ margin: "12px auto 0" }}>
              A futuristic, AI-powered command deck for the universe — classify galaxies,
              fly the solar system, watch the Sun erupt, and track every NEO close approach.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 22, flexWrap: "wrap" }}>
              {!loading && (user ? (
                <>
                  <NeonLink to="/predict">▶ Begin Classification</NeonLink>
                  <NeonLink to="/dashboard" tone="violet">↗ Mission Control</NeonLink>
                </>
              ) : (
                <>
                  <NeonLink to="/register">▶ Enlist Now</NeonLink>
                  <NeonLink to="/dashboard" tone="violet">↗ Open Mission Deck</NeonLink>
                </>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── 2. Wormhole travel sequence (skip if reduced) ── */}
      {!reduced && (
        <div ref={wormholeRef} style={{ position: "relative", height: "200vh" }}>
          <motion.div
            style={{
              position: "sticky",
              top: 0,
              width: "100%",
              height: "100vh",
              opacity: wormholeOpacity,
              scale: wormholeScale,
            }}
          >
            <Wormhole height="100vh" />
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 14,
                pointerEvents: "none",
                y: titleY,
              }}
            >
              <span className="hud-eyebrow"><span className="dot" />WARP SEQUENCE ENGAGED</span>
              <GlitchText as="h2" text="ENTERING DEEP SPACE" className="hud-title" />
              <p className="hud-subtitle" style={{ textAlign: "center" }}>
                Scroll to traverse the cosmos.
              </p>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* ── 3. Live data marquee ── */}
      <MarqueeData />

      {/* ── 4. Feature grid ── */}
      <div className="hud-page">
        <Reveal>
          <div style={{ marginBottom: 20 }}>
            <span className="hud-eyebrow"><span className="dot" />MODULES ONLINE</span>
            <h2 className="hud-title" style={{ fontSize: 30, marginTop: 10 }}>System Modules</h2>
            <p className="hud-subtitle">Twelve interactive instruments. Pick a vector.</p>
          </div>
        </Reveal>
        <div className="hud-grid-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.to} delay={i * 0.04}>
                <Link to={f.to} className="holo-card" style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 38, height: 38, borderRadius: 8,
                      border: "1px solid rgba(92,242,255,0.4)",
                      background: "rgba(92,242,255,0.08)",
                      color: "var(--av-cyan)",
                    }}>
                      <Icon size={20} stroke={1.6} />
                    </span>
                    <div className="ttl">{f.title}</div>
                  </div>
                  <div className="desc">{f.desc}</div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* ── 5. Original galaxy showcase ── */}
      <div className="hud-page">
        <Reveal>
          <div style={{ marginBottom: 12 }}>
            <span className="hud-eyebrow violet"><span className="dot" />REFERENCE TARGETS</span>
            <h2 className="hud-title" style={{ fontSize: 26, marginTop: 10 }}>Real Galaxy Examples</h2>
          </div>
        </Reveal>
        <GalaxyShowcase />
      </div>
    </>
  );
}
