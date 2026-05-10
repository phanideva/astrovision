import { useEffect, useState } from "react";
import {
  IconBolt, IconCompass, IconRocket, IconSatellite, IconSparkles,
  IconStars, IconTelescope, IconTrophy,
} from "@tabler/icons-react";
import GlitchText from "../design/GlitchText";
import HudPanel from "../design/HudPanel";
import Reveal from "../design/Reveal";
import Stat from "../design/Stat";
import { gamificationApi, GamificationMe } from "../api/gamification";

const ICONS: Record<string, React.ComponentType<any>> = {
  rocket: IconRocket,
  telescope: IconTelescope,
  stars: IconStars,
  trophy: IconTrophy,
  satellite: IconSatellite,
  compass: IconCompass,
  sparkles: IconSparkles,
  bolt: IconBolt,
};

export default function Achievements() {
  const [data, setData] = useState<GamificationMe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gamificationApi.me().then(setData).catch((e) => setError(e?.message ?? "Failed"));
  }, []);

  return (
    <div className="hud-page">
      <Reveal>
        <span className="hud-eyebrow amber"><span className="dot" />MISSION ACHIEVEMENTS</span>
        <GlitchText as="h1" text="BADGE LOCKER" className="hud-title" />
        <p className="hud-subtitle">Unlock badges by exploring AstroVision and classifying galaxies.</p>
      </Reveal>

      {error && <div style={{ color: "var(--av-pink)", marginTop: 12 }}>{error}</div>}

      {data && (
        <>
          <div className="hud-grid-4" style={{ marginTop: 24 }}>
            <Reveal><Stat label="CLASSIFICATIONS" value={data.stat.predictions_count} /></Reveal>
            <Reveal delay={0.05}><Stat label="SAMPLES" value={data.stat.samples_explored} tone="violet" /></Reveal>
            <Reveal delay={0.1}><Stat label="SECTORS VISITED" value={data.stat.pages_visited} tone="green" /></Reveal>
            <Reveal delay={0.15}><Stat label="STARS CONNECTED" value={data.stat.constellations_solved} tone="amber" /></Reveal>
          </div>

          <div className="hud-grid-3" style={{ marginTop: 24 }}>
            {data.catalog.map((b, i) => {
              const Icon = ICONS[b.icon] ?? IconTrophy;
              return (
                <Reveal key={b.code} delay={(i % 9) * 0.04}>
                  <HudPanel tone={b.unlocked ? "green" : "cyan"} grid style={{ opacity: b.unlocked ? 1 : 0.55 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{
                        width: 44, height: 44, borderRadius: 8,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        border: `1px solid ${b.unlocked ? "rgba(109,255,177,0.5)" : "rgba(92,242,255,0.3)"}`,
                        background: b.unlocked ? "rgba(109,255,177,0.12)" : "rgba(92,242,255,0.06)",
                        color: b.unlocked ? "var(--av-green)" : "var(--av-cyan)",
                      }}>
                        <Icon size={22} stroke={1.6} />
                      </span>
                      <div>
                        <div style={{ fontFamily: "var(--font-hud)", fontSize: 14 }}>
                          {b.title} {b.unlocked && "✓"}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.75 }}>{b.description}</div>
                      </div>
                    </div>
                  </HudPanel>
                </Reveal>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
