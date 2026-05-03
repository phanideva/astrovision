import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

type PlanetSpec = {
  name: string;
  radius: number;        // visual radius (units)
  distance: number;      // semi-major axis (units)
  period: number;        // orbital period (Earth years)
  color: string;
  facts: { label: string; value: string }[];
  rings?: { inner: number; outer: number; color: string };
};

const PLANETS: PlanetSpec[] = [
  { name: "Mercury", radius: 0.15, distance: 4.0,  period: 0.24,  color: "#a9a9a9",
    facts: [
      { label: "Distance from Sun", value: "57.9 million km" },
      { label: "Day length",        value: "58.6 Earth days" },
      { label: "Diameter",          value: "4,879 km" },
      { label: "Moons",             value: "0" },
    ] },
  { name: "Venus",   radius: 0.27, distance: 5.5,  period: 0.62,  color: "#e8c891",
    facts: [
      { label: "Distance from Sun", value: "108.2 million km" },
      { label: "Day length",        value: "243 Earth days (retrograde)" },
      { label: "Surface temp",      value: "464 °C" },
      { label: "Moons",             value: "0" },
    ] },
  { name: "Earth",   radius: 0.30, distance: 7.0,  period: 1.00,  color: "#4a90e2",
    facts: [
      { label: "Distance from Sun", value: "149.6 million km" },
      { label: "Day length",        value: "23h 56m 4s" },
      { label: "Diameter",          value: "12,742 km" },
      { label: "Moons",             value: "1 (Luna)" },
    ] },
  { name: "Mars",    radius: 0.20, distance: 9.0,  period: 1.88,  color: "#d35a3c",
    facts: [
      { label: "Distance from Sun", value: "227.9 million km" },
      { label: "Day length",        value: "24h 37m" },
      { label: "Diameter",          value: "6,779 km" },
      { label: "Moons",             value: "2 (Phobos, Deimos)" },
    ] },
  { name: "Jupiter", radius: 0.85, distance: 13.0, period: 11.86, color: "#d6b283",
    facts: [
      { label: "Distance from Sun", value: "778.5 million km" },
      { label: "Day length",        value: "9h 56m" },
      { label: "Diameter",          value: "139,820 km" },
      { label: "Moons",             value: "95+" },
    ] },
  { name: "Saturn",  radius: 0.72, distance: 17.0, period: 29.45, color: "#e3d39a",
    rings: { inner: 0.95, outer: 1.55, color: "#c9b78a" },
    facts: [
      { label: "Distance from Sun", value: "1.43 billion km" },
      { label: "Day length",        value: "10h 33m" },
      { label: "Diameter",          value: "116,460 km" },
      { label: "Moons",             value: "146+" },
    ] },
  { name: "Uranus",  radius: 0.50, distance: 21.0, period: 84.0,  color: "#9fdcdc",
    facts: [
      { label: "Distance from Sun", value: "2.87 billion km" },
      { label: "Day length",        value: "17h 14m (retrograde)" },
      { label: "Diameter",          value: "50,724 km" },
      { label: "Moons",             value: "27" },
    ] },
  { name: "Neptune", radius: 0.48, distance: 25.0, period: 164.8, color: "#4267b3",
    facts: [
      { label: "Distance from Sun", value: "4.50 billion km" },
      { label: "Day length",        value: "16h 6m" },
      { label: "Diameter",          value: "49,244 km" },
      { label: "Moons",             value: "14" },
    ] },
];

function Sun() {
  return (
    <mesh>
      <sphereGeometry args={[1.6, 48, 48]} />
      <meshBasicMaterial color="#ffd76b" />
      <pointLight intensity={3} distance={120} decay={1.4} color="#fff2c8" />
    </mesh>
  );
}

function OrbitRing({ distance }: { distance: number }) {
  const points = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      arr.push(new THREE.Vector3(Math.cos(a) * distance, 0, Math.sin(a) * distance));
    }
    return arr;
  }, [distance]);
  const geom = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  return (
    // @ts-ignore -- three primitive
    <line>
      <primitive object={geom} attach="geometry" />
      <lineBasicMaterial color="#2a3160" transparent opacity={0.5} />
    </line>
  );
}

function Planet({
  spec,
  timeScale,
  onSelect,
  selected,
}: {
  spec: PlanetSpec;
  timeScale: number;
  onSelect: (n: string) => void;
  selected: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const angleRef = useRef(Math.random() * Math.PI * 2);

  useFrame((_, dt) => {
    angleRef.current += (dt * timeScale) / spec.period;
    if (ref.current) {
      ref.current.position.x = Math.cos(angleRef.current) * spec.distance;
      ref.current.position.z = Math.sin(angleRef.current) * spec.distance;
      ref.current.rotation.y += dt * 0.5;
    }
  });

  return (
    <mesh ref={ref} onClick={() => onSelect(spec.name)}>
      <sphereGeometry args={[spec.radius, 32, 32]} />
      <meshStandardMaterial
        color={spec.color}
        emissive={selected ? spec.color : "#000"}
        emissiveIntensity={selected ? 0.4 : 0}
        roughness={0.85}
      />
      {spec.rings && (
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <ringGeometry args={[spec.rings.inner, spec.rings.outer, 64]} />
          <meshBasicMaterial color={spec.rings.color} side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>
      )}
    </mesh>
  );
}

export default function SolarSystem3D() {
  const [timeScale, setTimeScale] = useState(0.4);
  const [selected, setSelected] = useState<string>("Earth");
  const selectedSpec = PLANETS.find((p) => p.name === selected) ?? PLANETS[2];

  return (
    <div className="solar-wrap">
      <div className="solar-canvas">
        <Canvas camera={{ position: [0, 14, 28], fov: 55 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.18} />
            <Stars radius={120} depth={50} count={4000} factor={4} fade />
            <Sun />
            {PLANETS.map((p) => (
              <group key={p.name}>
                <OrbitRing distance={p.distance} />
                <Planet
                  spec={p}
                  timeScale={timeScale}
                  onSelect={setSelected}
                  selected={selected === p.name}
                />
              </group>
            ))}
            <OrbitControls enablePan minDistance={6} maxDistance={80} />
          </Suspense>
        </Canvas>
      </div>

      <aside className="solar-panel">
        <h3>{selectedSpec.name}</h3>
        <div className="solar-color-dot" style={{ background: selectedSpec.color }} />
        <div className="stat-grid">
          {selectedSpec.facts.map((f) => (
            <div key={f.label} className="stat-item">
              <div className="stat-label">{f.label}</div>
              <div className="stat-value">{f.value}</div>
            </div>
          ))}
        </div>
        <div className="solar-controls">
          <label>Time scale: <b>{timeScale.toFixed(2)}×</b></label>
          <input
            type="range"
            min={0}
            max={3}
            step={0.05}
            value={timeScale}
            onChange={(e) => setTimeScale(parseFloat(e.target.value))}
          />
          <div className="solar-hint">
            Click a planet to inspect · drag to rotate · scroll to zoom
          </div>
        </div>
      </aside>
    </div>
  );
}
