import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture } from "@react-three/drei";
import * as THREE from "three";

type ISSPos = { latitude: number; longitude: number; altitude: number; velocity: number; timestamp: number };

const EARTH_R = 2;
const ISS_ALT_FACTOR = 1.05; // visual offset above surface
const TRAIL_MAX = 200;
const EARTH_TEX = "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";
const WORLD_MAP_TEX = "https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg";

function latLonToVec3(lat: number, lon: number, r: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function Earth() {
  const earthMap = useTexture(EARTH_TEX);
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.02;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[EARTH_R, 64, 64]} />
      <meshStandardMaterial map={earthMap} color="#ffffff" emissive="#0a1a3a" emissiveIntensity={0.18} roughness={0.92} />
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.02, 32, 32]} />
        <meshBasicMaterial color="#88aaff" transparent opacity={0.08} />
      </mesh>
    </mesh>
  );
}

function ISSMarker({ pos }: { pos: ISSPos | null }) {
  const ref = useRef<THREE.Mesh>(null!);
  useEffect(() => {
    if (pos && ref.current) {
      const v = latLonToVec3(pos.latitude, pos.longitude, EARTH_R * ISS_ALT_FACTOR);
      ref.current.position.copy(v);
    }
  }, [pos]);
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshBasicMaterial color="#ff5060" />
      <pointLight color="#ff7080" intensity={1} distance={1} />
    </mesh>
  );
}

function Trail({ points }: { points: THREE.Vector3[] }) {
  const geom = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  if (points.length < 2) return null;
  // @ts-ignore
  return (
    <line>
      <primitive object={geom} attach="geometry" />
      <lineBasicMaterial color="#ff8090" transparent opacity={0.7} />
    </line>
  );
}

function toMapPoint(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
}

export default function ISSLive() {
  const [pos, setPos] = useState<ISSPos | null>(null);
  const [trail, setTrail] = useState<THREE.Vector3[]>([]);
  const [groundTrack, setGroundTrack] = useState<{ lat: number; lon: number }[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const r = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
        if (!r.ok) throw new Error("fetch failed");
        const d = (await r.json()) as ISSPos;
        if (cancelled) return;
        setErr(null);
        setPos(d);
        setTrail((prev) => {
          const v = latLonToVec3(d.latitude, d.longitude, EARTH_R * ISS_ALT_FACTOR);
          const next = [...prev, v];
          return next.length > TRAIL_MAX ? next.slice(next.length - TRAIL_MAX) : next;
        });
        setGroundTrack((prev) => {
          const next = [...prev, { lat: d.latitude, lon: d.longitude }];
          return next.length > TRAIL_MAX ? next.slice(next.length - TRAIL_MAX) : next;
        });
      } catch (e) {
        if (!cancelled) setErr("Could not reach the ISS tracking API.");
      }
    }
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const markerPoint = pos ? toMapPoint(pos.latitude, pos.longitude) : null;
  const trailPoints = groundTrack.map((p) => toMapPoint(p.lat, p.lon));
  const trailPath = trailPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="container">
      <h1 className="page-title">🛰️ ISS Live Tracker</h1>
      <p style={{ color: "var(--muted)", marginTop: -10 }}>
        Real-time position of the International Space Station, polled every 5 seconds
        from <a href="https://wheretheiss.at" target="_blank" rel="noreferrer noopener">wheretheiss.at</a>.
      </p>

      <div className="iss-video card">
        <h3 style={{ marginTop: 0 }}>Live NASA stream</h3>
        <div className="tv-frame">
          <iframe
            src="https://www.youtube-nocookie.com/embed/21X5lGlDOfg"
            title="NASA Live Stream"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>

      <div className="iss-map card">
        <h3 style={{ marginTop: 0 }}>ISS ground track map</h3>
        <div className="iss-map-board">
          <img src={WORLD_MAP_TEX} alt="World map for ISS ground track" />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="iss-map-overlay">
            {trailPath && <path d={trailPath} fill="none" stroke="#ff6f88" strokeWidth="0.35" opacity="0.85" />}
          </svg>
          {markerPoint && (
            <div
              className="iss-map-marker"
              style={{ left: `${markerPoint.x}%`, top: `${markerPoint.y}%` }}
              title="Current ISS location"
            />
          )}
        </div>
      </div>

      <div className="iss-wrap">
        <div className="iss-canvas">
          <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.28} />
              <directionalLight position={[5, 3, 5]} intensity={1.2} />
              <Stars radius={60} depth={24} count={3200} factor={3.1} fade />
              <Earth />
              <ISSMarker pos={pos} />
              <Trail points={trail} />
              <OrbitControls minDistance={3.2} maxDistance={15} />
            </Suspense>
          </Canvas>
        </div>

        <aside className="iss-panel">
          <h3>Current position</h3>
          {err && <div className="error">{err}</div>}
          {pos ? (
            <div className="stat-grid">
              <div className="stat-item">
                <div className="stat-label">Latitude</div>
                <div className="stat-value">{pos.latitude.toFixed(3)}°</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Longitude</div>
                <div className="stat-value">{pos.longitude.toFixed(3)}°</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Altitude</div>
                <div className="stat-value">{pos.altitude.toFixed(1)} km</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Velocity</div>
                <div className="stat-value">{Math.round(pos.velocity)} km/h</div>
              </div>
            </div>
          ) : (
            !err && <p style={{ color: "var(--muted)" }}>Locating ISS…</p>
          )}
          <p style={{ marginTop: 16, fontSize: 12, color: "var(--muted)" }}>
            The ISS orbits Earth every ~92 minutes at roughly 408 km altitude.
            One full orbit traces a ground track of about 40,000 km.
          </p>
        </aside>
      </div>
    </div>
  );
}
