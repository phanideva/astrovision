import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";

const TEX = "/textures/planets";

type PlanetSpec = {
  name: string;
  radius: number;
  distance: number;
  period: number;
  tilt: number;
  selfRotation: number;
  texDay: string;
  texNight?: string;
  color: string;
  description: string;
  rings?: { inner: number; outer: number; texAlpha: string; color: string };
  atmosphere?: string;
  facts: { label: string; value: string }[];
};

const PLANETS: PlanetSpec[] = [
  {
    name: "Mercury", radius: 0.16, distance: 4.2, period: 0.24, tilt: 0.034, selfRotation: 0.2,
    texDay: `${TEX}/2k_mercury.jpg`, color: "#9b9b9b",
    description: "The smallest and fastest planet, orbiting the Sun in just 88 days. Its surface is heavily cratered with extreme temperature swings.",
    facts: [
      { label: "Distance from Sun", value: "57.9 million km" },
      { label: "Day length",        value: "58.6 Earth days" },
      { label: "Diameter",          value: "4,879 km" },
      { label: "Temperature",       value: "\u2212180 \u00b0C to 430 \u00b0C" },
      { label: "Moons",             value: "0" },
    ],
  },
  {
    name: "Venus", radius: 0.25, distance: 5.8, period: 0.62, tilt: 3.10, selfRotation: -0.15,
    texDay: `${TEX}/2k_venus_surface.jpg`, color: "#e8c891", atmosphere: "#f0a000",
    description: "The hottest planet, shrouded in thick sulphuric-acid clouds. It rotates backwards \u2014 the Sun rises in the west.",
    facts: [
      { label: "Distance from Sun", value: "108.2 million km" },
      { label: "Day length",        value: "243 Earth days (retrograde)" },
      { label: "Surface temp",      value: "464 \u00b0C" },
      { label: "Atmosphere",        value: "96% CO\u2082" },
      { label: "Moons",             value: "0" },
    ],
  },
  {
    name: "Earth", radius: 0.30, distance: 7.2, period: 1.00, tilt: 0.41, selfRotation: 1.0,
    texDay: `${TEX}/2k_earth_daymap.jpg`, texNight: `${TEX}/2k_earth_nightmap.jpg`,
    color: "#4a90e2", atmosphere: "#4488ff",
    description: "Our home \u2014 the only planet known to harbour life. Covered 71% by water, with a protective magnetic field and a nitrogen-oxygen atmosphere.",
    facts: [
      { label: "Distance from Sun", value: "149.6 million km" },
      { label: "Day length",        value: "23h 56m 4s" },
      { label: "Diameter",          value: "12,742 km" },
      { label: "Surface temp",      value: "\u221288 \u00b0C to 58 \u00b0C" },
      { label: "Moons",             value: "1 (Luna)" },
    ],
  },
  {
    name: "Mars", radius: 0.20, distance: 9.2, period: 1.88, tilt: 0.44, selfRotation: 0.95,
    texDay: `${TEX}/2k_mars.jpg`, color: "#c1440e", atmosphere: "#c1440e",
    description: "The Red Planet hosts the tallest volcano (Olympus Mons) and deepest canyon (Valles Marineris) in the Solar System. Evidence of ancient riverbeds suggests liquid water once flowed.",
    facts: [
      { label: "Distance from Sun", value: "227.9 million km" },
      { label: "Day length",        value: "24h 37m" },
      { label: "Diameter",          value: "6,779 km" },
      { label: "Highest volcano",   value: "Olympus Mons (22 km)" },
      { label: "Moons",             value: "2 (Phobos, Deimos)" },
    ],
  },
  {
    name: "Jupiter", radius: 0.88, distance: 13.5, period: 11.86, tilt: 0.054, selfRotation: 2.5,
    texDay: `${TEX}/2k_jupiter.jpg`, color: "#d6b283",
    description: "The largest planet \u2014 1,300 Earths would fit inside. The Great Red Spot is a storm larger than Earth, raging for over 350 years.",
    facts: [
      { label: "Distance from Sun", value: "778.5 million km" },
      { label: "Day length",        value: "9h 56m" },
      { label: "Diameter",          value: "139,820 km" },
      { label: "Great Red Spot",    value: "Storm > 350 years old" },
      { label: "Moons",             value: "95 known" },
    ],
  },
  {
    name: "Saturn", radius: 0.75, distance: 17.5, period: 29.45, tilt: 0.47, selfRotation: 2.2,
    texDay: `${TEX}/2k_saturn.jpg`, color: "#e3d39a",
    rings: { inner: 1.05, outer: 1.85, texAlpha: `${TEX}/2k_saturn_ring_alpha.png`, color: "#d4b98a" },
    description: "Famous for its spectacular ring system spanning 282,000 km, yet only 10 m thick in places. Saturn is less dense than water \u2014 it would float!",
    facts: [
      { label: "Distance from Sun", value: "1.43 billion km" },
      { label: "Day length",        value: "10h 33m" },
      { label: "Diameter",          value: "116,460 km" },
      { label: "Ring span",         value: "282,000 km wide" },
      { label: "Moons",             value: "146 known" },
    ],
  },
  {
    name: "Uranus", radius: 0.52, distance: 21.5, period: 84.0, tilt: 1.706, selfRotation: 0.7,
    texDay: `${TEX}/2k_uranus.jpg`, color: "#9fdcdc", atmosphere: "#a0e0e0",
    description: "An ice giant that rotates on its side \u2014 its axial tilt of 98\u00b0 means it experiences 42-year-long polar days and nights.",
    facts: [
      { label: "Distance from Sun", value: "2.87 billion km" },
      { label: "Day length",        value: "17h 14m (retrograde)" },
      { label: "Diameter",          value: "50,724 km" },
      { label: "Axial tilt",        value: "97.8\u00b0" },
      { label: "Moons",             value: "27 known" },
    ],
  },
  {
    name: "Neptune", radius: 0.49, distance: 25.5, period: 164.8, tilt: 0.494, selfRotation: 0.67,
    texDay: `${TEX}/2k_neptune.jpg`, color: "#4267b3", atmosphere: "#3366ff",
    description: "The windiest planet, with storms reaching 2,100 km/h. It took 165 years to complete its first orbit around the Sun since its 1846 discovery.",
    facts: [
      { label: "Distance from Sun", value: "4.50 billion km" },
      { label: "Day length",        value: "16h 6m" },
      { label: "Diameter",          value: "49,244 km" },
      { label: "Wind speed",        value: "up to 2,100 km/h" },
      { label: "Moons",             value: "16 known" },
    ],
  },
];

/* ---- Sun ---- */
function Sun() {
  const sunTex = useTexture(`${TEX}/2k_sun.jpg`);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.06 + 0.02 * Math.sin(clock.elapsedTime * 0.8);
    }
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1.6, 64, 64]} />
        <meshStandardMaterial map={sunTex} emissive="#ff6600" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.1, 32, 32]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.06} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.9, 32, 32]} />
        <meshBasicMaterial color="#ff4400" transparent opacity={0.025} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[4.0, 32, 32]} />
        <meshBasicMaterial color="#ff1100" transparent opacity={0.01} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <pointLight intensity={4.8} distance={240} decay={1.1} color="#fff5d0" />
    </group>
  );
}

/* ---- Orbit ring ---- */
function OrbitRing({ distance }: { distance: number }) {
  const geom = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * distance, 0, Math.sin(a) * distance));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [distance]);
  return (
    // @ts-ignore
    <line>
      <primitive object={geom} attach="geometry" />
      <lineBasicMaterial color="#1a2560" transparent opacity={0.3} />
    </line>
  );
}

/* ---- Asteroid belt ---- */
function AsteroidBelt() {
  const positions = useMemo(() => {
    const count = 2600;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 11.0 + (Math.random() - 0.5) * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 0.4;
      arr[i * 3]     = Math.cos(theta) * r;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = Math.sin(theta) * r;
    }
    return arr;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.045} color="#9e8e7a" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

/* ---- Planet ---- */
function Planet({
  spec, timeScale, onSelect, selected, showLabels,
}: {
  spec: PlanetSpec; timeScale: number; onSelect: (n: string) => void;
  selected: boolean; showLabels: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef  = useRef<THREE.Mesh>(null!);
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const [hovered, setHovered] = useState(false);

  const textures = useTexture(
    spec.texNight ? { map: spec.texDay, emissiveMap: spec.texNight } : { map: spec.texDay }
  ) as { map: THREE.Texture; emissiveMap?: THREE.Texture };

  const ringTex = useTexture(spec.rings ? spec.rings.texAlpha : `${TEX}/2k_saturn_ring_alpha.png`);

  useFrame((_, dt) => {
    angleRef.current += (dt * timeScale) / spec.period;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angleRef.current) * spec.distance;
      groupRef.current.position.z = Math.sin(angleRef.current) * spec.distance;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * spec.selfRotation * 0.4;
    }
  });

  const isEarth = spec.name === "Earth";
  const labelVisible = showLabels || hovered;

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        rotation={[spec.tilt, 0, 0]}
        onClick={() => onSelect(spec.name)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[spec.radius, 48, 48]} />
        <meshStandardMaterial
          map={textures.map}
          emissiveMap={isEarth ? textures.emissiveMap : undefined}
          emissive={isEarth ? "#0044aa" : (selected ? spec.color : "#000000")}
          emissiveIntensity={isEarth ? 0.12 : (selected ? 0.2 : 0.0)}
          roughness={0.85}
          metalness={0.04}
        />
      </mesh>

      {spec.atmosphere && (
        <mesh>
          <sphereGeometry args={[spec.radius * 1.06, 32, 32]} />
          <meshBasicMaterial color={spec.atmosphere} transparent opacity={0.065} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      )}

      {selected && (
        <mesh>
          <sphereGeometry args={[spec.radius * 1.16, 32, 32]} />
          <meshBasicMaterial color={spec.color} transparent opacity={0.1} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      )}

      {spec.rings && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[spec.rings.inner, spec.rings.outer, 128]} />
          <meshBasicMaterial map={ringTex} color={spec.rings.color} side={THREE.DoubleSide} transparent opacity={0.85} depthWrite={false} />
        </mesh>
      )}

      {labelVisible && (
        <Html center distanceFactor={18} zIndexRange={[0, 10]}>
          <div style={{
            color: selected ? "#ffffff" : "#88aadd",
            fontSize: "10px", fontFamily: "monospace",
            textShadow: "0 0 6px #000, 0 0 14px #000",
            whiteSpace: "nowrap", pointerEvents: "none",
            transform: `translateY(${spec.radius * 60 + 14}px)`,
            fontWeight: selected ? 700 : 400,
            letterSpacing: "0.08em",
          }}>
            {spec.name.toUpperCase()}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ---- Scene ---- */
function Scene({ timeScale, selected, setSelected, showLabels }: {
  timeScale: number; selected: string; setSelected: (n: string) => void; showLabels: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.06} />
      <Stars radius={200} depth={90} count={8000} factor={4.5} saturation={0.15} fade speed={0.3} />
      <Sun />
      {PLANETS.map((p) => (
        <group key={p.name}>
          <OrbitRing distance={p.distance} />
          <Planet spec={p} timeScale={timeScale} onSelect={setSelected} selected={selected === p.name} showLabels={showLabels} />
        </group>
      ))}
      <AsteroidBelt />
      <OrbitControls enablePan={false} minDistance={5} maxDistance={95} zoomSpeed={0.7} rotateSpeed={0.5} />
    </>
  );
}

/* ---- Export ---- */
export default function SolarSystem3D() {
  const [timeScale, setTimeScale]   = useState(0.4);
  const [paused, setPaused]         = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [selected, setSelected]     = useState<string>("Earth");

  const effectiveScale = paused ? 0 : timeScale;
  const selectedSpec   = PLANETS.find((p) => p.name === selected) ?? PLANETS[2];

  return (
    <div className="solar-root">
      <div className="solar-canvas">
        <Canvas
          camera={{ position: [0, 16, 32], fov: 52 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => { gl.setClearColor("#020817"); }}
        >
          <Suspense fallback={null}>
            <Scene timeScale={effectiveScale} selected={selected} setSelected={setSelected} showLabels={showLabels} />
          </Suspense>
        </Canvas>
      </div>

      <aside className="solar-panel">
        <div className="solar-nav">
          {PLANETS.map((p) => (
            <button
              key={p.name}
              className={`solar-nav-btn${selected === p.name ? " active" : ""}`}
              style={{ "--dot-color": p.color } as React.CSSProperties}
              onClick={() => setSelected(p.name)}
              title={p.name}
            >
              <span className="solar-nav-dot" style={{ background: p.color }} />
            </button>
          ))}
        </div>

        <h3 className="solar-planet-name">{selectedSpec.name}</h3>
        <p className="solar-planet-desc">{selectedSpec.description}</p>

        <div className="stat-grid">
          {selectedSpec.facts.map((f) => (
            <div key={f.label} className="stat-item">
              <div className="stat-label">{f.label}</div>
              <div className="stat-value">{f.value}</div>
            </div>
          ))}
        </div>

        <div className="solar-controls">
          <div className="solar-speed-row">
            <span className="solar-speed-label">Speed: <b>{paused ? "Paused" : `${timeScale.toFixed(2)}\u00d7`}</b></span>
            <button className="solar-pause-btn" onClick={() => setPaused((v) => !v)}>
              {paused ? "\u25b6 Play" : "\u23f8 Pause"}
            </button>
          </div>
          <input type="range" min={0.05} max={4} step={0.05} value={timeScale} disabled={paused}
            onChange={(e) => setTimeScale(parseFloat(e.target.value))} className="solar-slider" />
          <div className="solar-presets">
            {([0.1, 0.4, 1.0, 2.5] as const).map((s) => (
              <button key={s}
                className={`solar-preset-btn${timeScale === s && !paused ? " active" : ""}`}
                onClick={() => { setTimeScale(s); setPaused(false); }}>
                {s === 0.1 ? "Slow" : s === 0.4 ? "Normal" : s === 1.0 ? "Fast" : "Ultra"}
              </button>
            ))}
          </div>
          <label className="solar-label-toggle">
            <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
            <span>Show labels</span>
          </label>
          <div className="solar-hint">Click a planet \u00b7 drag to orbit \u00b7 scroll to zoom</div>
        </div>
      </aside>
    </div>
  );
}
