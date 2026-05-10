import { useEffect, useMemo, useState } from "react";
import GlitchText from "../design/GlitchText";
import HudPanel from "../design/HudPanel";
import Reveal from "../design/Reveal";
import { NeonButton } from "../design/NeonButton";
import { emitToast } from "../design/toast";
import { gamificationApi } from "../api/gamification";
import { useAuth } from "../store/auth";

type Star = { x: number; y: number };
type Puzzle = { name: string; stars: Star[]; lines: [number, number][] };

const PUZZLES: Puzzle[] = [
  {
    name: "ORION",
    stars: [
      { x: 30, y: 20 }, { x: 50, y: 25 }, { x: 70, y: 22 },
      { x: 35, y: 50 }, { x: 50, y: 50 }, { x: 65, y: 50 },
      { x: 32, y: 80 }, { x: 70, y: 78 },
    ],
    lines: [[0, 3], [1, 4], [2, 5], [3, 6], [5, 7], [3, 4], [4, 5]],
  },
  {
    name: "URSA MAJOR",
    stars: [
      { x: 15, y: 45 }, { x: 28, y: 42 }, { x: 40, y: 38 }, { x: 52, y: 48 },
      { x: 60, y: 55 }, { x: 75, y: 52 }, { x: 88, y: 60 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
  },
  {
    name: "CASSIOPEIA",
    stars: [
      { x: 18, y: 30 }, { x: 35, y: 55 }, { x: 50, y: 30 }, { x: 65, y: 55 }, { x: 82, y: 30 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
];

export default function ConstellationGame() {
  const { user } = useAuth();
  const [pi, setPi] = useState(0);
  const [drawn, setDrawn] = useState<[number, number][]>([]);
  const [first, setFirst] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);

  const puzzle = PUZZLES[pi];
  const target = useMemo(
    () => new Set(puzzle.lines.map((l) => l.slice().sort((a, b) => a - b).join("-"))),
    [puzzle],
  );
  const drawnKeys = useMemo(
    () => new Set(drawn.map((l) => l.slice().sort((a, b) => a - b).join("-"))),
    [drawn],
  );

  useEffect(() => {
    if (!solved && drawn.length === puzzle.lines.length) {
      const ok = [...target].every((k) => drawnKeys.has(k));
      if (ok) {
        setSolved(true);
        emitToast({ id: Date.now(), title: "STELLAR ALIGNMENT", message: `${puzzle.name} solved`, tone: "green" });
        if (user) {
          gamificationApi.event("constellation_solved")
            .then((r) => r.unlocked.forEach((u) =>
              emitToast({ id: Date.now() + Math.random(), title: u.title, message: u.description, tone: "amber" })
            )).catch(() => undefined);
        }
      }
    }
  }, [drawn, puzzle, target, drawnKeys, solved, user]);

  function tap(i: number) {
    if (solved) return;
    if (first === null) { setFirst(i); return; }
    if (first === i) { setFirst(null); return; }
    const key = [first, i].sort((a, b) => a - b).join("-");
    if (!drawnKeys.has(key)) {
      setDrawn((d) => [...d, [first, i]]);
    }
    setFirst(null);
  }

  function next() {
    setPi((x) => (x + 1) % PUZZLES.length);
    setDrawn([]); setFirst(null); setSolved(false);
  }

  function reset() { setDrawn([]); setFirst(null); setSolved(false); }

  return (
    <div className="hud-page">
      <Reveal>
        <span className="hud-eyebrow"><span className="dot" />SKY-PUZZLE</span>
        <GlitchText as="h1" text="CONNECT THE STARS" className="hud-title" />
        <p className="hud-subtitle">Tap two stars to draw a line. Recreate the constellation outline.</p>
      </Reveal>

      <HudPanel tone="cyan" grid scanlines style={{ marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: solved ? "var(--av-green)" : "var(--av-cyan)" }}>
            {puzzle.name} {solved && "✓"}
          </h3>
          <div style={{ display: "flex", gap: 10 }}>
            <NeonButton onClick={reset} tone="violet">Reset</NeonButton>
            <NeonButton onClick={next} tone="cyan">Next →</NeonButton>
          </div>
        </div>
        <svg viewBox="0 0 100 100" style={{ width: "100%", aspectRatio: "1.6 / 1", background: "radial-gradient(ellipse at center, rgba(40,12,80,0.4), rgba(0,0,0,0.9))", borderRadius: 8 }}>
          {drawn.map(([a, b], i) => {
            const sa = puzzle.stars[a], sb = puzzle.stars[b];
            return <line key={i} x1={sa.x} y1={sa.y} x2={sb.x} y2={sb.y} stroke="var(--av-cyan)" strokeWidth={0.4} />;
          })}
          {puzzle.stars.map((s, i) => (
            <g key={i} onClick={() => tap(i)} style={{ cursor: "pointer" }}>
              <circle cx={s.x} cy={s.y} r={first === i ? 2 : 1.2} fill={first === i ? "var(--av-amber)" : "white"}>
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle cx={s.x} cy={s.y} r={3} fill="none" stroke={first === i ? "var(--av-amber)" : "rgba(255,255,255,0.2)"} strokeWidth={0.2} />
            </g>
          ))}
        </svg>
      </HudPanel>
    </div>
  );
}
