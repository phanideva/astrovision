import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

interface Props {
  galaxyClass: string;
  particles?: number;
}

// Per-class colour palette: [core, arm/body, halo]
const PALETTES: Record<string, [string, string, string]> = {
  Spiral:     ["#fff8e0", "#88c4ff", "#1a3a88"],
  Elliptical: ["#fff8d0", "#ffd580", "#7a4a00"],
  Lenticular: ["#f0f8ff", "#b8ddff", "#1a4a88"],
  Irregular:  ["#e0fff0", "#55ffaa", "#0a3020"],
};

/**
 * Gaussian soft-glow texture — fixes the "square pixel" appearance when zoomed.
 * Each star renders as a smooth circular blob instead of a hard-edged square.
 */
function makeStarTexture(): THREE.CanvasTexture {
  const sz = 128;
  const canvas = document.createElement("canvas");
  canvas.width = sz;
  canvas.height = sz;
  const ctx = canvas.getContext("2d")!;
  const r = sz / 2;
  const grd = ctx.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0.00, "rgba(255,255,255,1.00)");
  grd.addColorStop(0.10, "rgba(255,255,255,0.95)");
  grd.addColorStop(0.30, "rgba(255,255,255,0.60)");
  grd.addColorStop(0.60, "rgba(255,255,255,0.15)");
  grd.addColorStop(1.00, "rgba(255,255,255,0.00)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, sz, sz);
  return new THREE.CanvasTexture(canvas);
}

// Module-level singleton — created once, shared by every viewer instance
let _starTex: THREE.CanvasTexture | null = null;
function getStarTexture() {
  if (!_starTex) _starTex = makeStarTexture();
  return _starTex;
}

function buildGeometry(
  galaxyClass: string,
  n: number
): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(n * 3);
  const colors = new Float32Array(n * 3);

  const palette = PALETTES[galaxyClass] ?? PALETTES["Irregular"];
  const coreCol  = new THREE.Color(palette[0]);
  const bodyCol  = new THREE.Color(palette[1]);
  const haloCol  = new THREE.Color(palette[2]);

  const rand = (a: number, b: number) => a + Math.random() * (b - a);

  for (let i = 0; i < n; i++) {
    let x = 0, y = 0, z = 0, t = 0;

    switch (galaxyClass) {
      case "Spiral": {
        const armCount = 2;
        const arm = i % armCount;
        t = Math.pow(Math.random(), 0.5); // bias toward centre
        const r = 0.08 + t * 3.2;
        const twist = r * 1.6;
        const spread = rand(-0.18, 0.18) * (1 + t);
        const angle = (arm / armCount) * Math.PI * 2 + twist + spread;
        x = r * Math.cos(angle);
        z = r * Math.sin(angle);
        y = rand(-0.04, 0.04) * Math.pow(1 - t, 0.5);
        // thin dust-lane particles
        if (i % 12 === 0) y *= 3;
        break;
      }
      case "Elliptical": {
        // King-like radial profile (concentrated centre)
        t = Math.pow(Math.random(), 2);
        const u = Math.acos(2 * Math.random() - 1);
        const v = Math.random() * Math.PI * 2;
        const r = 0.1 + t * 2.6;
        x = r * Math.sin(u) * Math.cos(v);
        y = r * 0.65 * Math.sin(u) * Math.sin(v);
        z = r * 0.9 * Math.cos(u);
        break;
      }
      case "Lenticular": {
        // Thin disk + bright bulge
        if (Math.random() < 0.2) {
          // bulge
          t = Math.pow(Math.random(), 2);
          const u = Math.acos(2 * Math.random() - 1);
          const v = Math.random() * Math.PI * 2;
          const r = t * 0.9;
          x = r * Math.sin(u) * Math.cos(v);
          y = r * 0.9 * Math.sin(u) * Math.sin(v);
          z = r * Math.cos(u);
        } else {
          t = Math.sqrt(Math.random());
          const r = 0.1 + t * 3.0;
          const a = Math.random() * Math.PI * 2;
          x = r * Math.cos(a);
          z = r * Math.sin(a);
          y = rand(-0.06, 0.06);
        }
        break;
      }
      default: { // Irregular — multiple clumps
        const clumps = [
          { cx: 0, cy: 0, cz: 0, s: 1.2 },
          { cx: 1.5, cy: 0.4, cz: 0.8, s: 0.7 },
          { cx: -1.2, cy: -0.3, cz: -0.6, s: 0.6 },
          { cx: 0.5, cy: -0.8, cz: 1.4, s: 0.5 },
        ];
        const c = clumps[Math.floor(Math.random() * clumps.length)];
        t = Math.pow(Math.random(), 1.5);
        x = c.cx + rand(-c.s, c.s) * t;
        y = c.cy + rand(-c.s * 0.4, c.s * 0.4) * t;
        z = c.cz + rand(-c.s, c.s) * t;
      }
    }

    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Colour: core→body→halo by t (0=centre, 1=edge)
    const dist = Math.sqrt(x * x + y * y * 4 + z * z);
    const maxR = 3.3;
    const frac = Math.min(dist / maxR, 1);
    const col = new THREE.Color();
    if (frac < 0.2) {
      col.lerpColors(coreCol, bodyCol, frac / 0.2);
    } else {
      col.lerpColors(bodyCol, haloCol, (frac - 0.2) / 0.8);
    }
    colors[i * 3]     = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  return { positions, colors };
}

function ParticleGalaxy({ galaxyClass, particles = 22000 }: Props) {
  const groupRef  = useRef<THREE.Group>(null);
  const starTex   = useMemo(() => getStarTexture(), []);

  const { positions, colors } = useMemo(
    () => buildGeometry(galaxyClass, particles),
    [galaxyClass, particles]
  );

  // Dense bright core particles
  const coreGeo = useMemo(() => {
    const n = 900;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = Math.pow(Math.random(), 3) * 0.28;
      const u = Math.acos(2 * Math.random() - 1);
      const v = Math.random() * Math.PI * 2;
      pos[i * 3]     = r * Math.sin(u) * Math.cos(v);
      pos[i * 3 + 1] = r * 0.5 * Math.sin(u) * Math.sin(v);
      pos[i * 3 + 2] = r * Math.cos(u);
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.06;
  });

  const coreColor = PALETTES[galaxyClass]?.[0] ?? "#ffffff";

  return (
    <group ref={groupRef}>
      {/* main body — Gaussian texture + additive blending → realistic star glow */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particles}
            array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={particles}
            array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          map={starTex}
          size={0.024}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.90}
          depthWrite={false}
          alphaTest={0.001}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {/* bright nucleus */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={coreGeo.length / 3}
            array={coreGeo} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          map={starTex}
          size={0.055}
          sizeAttenuation
          color={coreColor}
          transparent
          opacity={0.98}
          depthWrite={false}
          alphaTest={0.001}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function GalaxyViewer3D({ galaxyClass, particles }: Props) {
  return (
    <Canvas camera={{ position: [0, 2.5, 6], fov: 50 }}>
      <color attach="background" args={["#020510"]} />
      <ambientLight intensity={0.1} />
      <Stars radius={100} depth={50} count={6000} factor={5} fade saturation={0.7} />
      <ParticleGalaxy galaxyClass={galaxyClass} particles={particles} />
      <OrbitControls
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.35}
        minDistance={1.5}
        maxDistance={14}
      />
    </Canvas>
  );
}
