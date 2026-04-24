import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

interface Props {
  galaxyClass: string;
  particles?: number;
}

/** Generate a Float32Array of particle XYZ for the given morphology. */
function buildPositions(galaxyClass: string, n: number): Float32Array {
  const out = new Float32Array(n * 3);
  const rand = (a: number, b: number) => a + Math.random() * (b - a);

  for (let i = 0; i < n; i++) {
    let x = 0, y = 0, z = 0;
    switch (galaxyClass) {
      case "Spiral": {
        // logarithmic spiral with 2 arms
        const arm = i % 2 === 0 ? 0 : Math.PI;
        const t = Math.random();
        const r = 0.2 + t * 3.0;
        const angle = arm + r * 1.4 + rand(-0.15, 0.15);
        x = r * Math.cos(angle);
        z = r * Math.sin(angle);
        y = rand(-0.05, 0.05) * (1 - t);
        break;
      }
      case "Elliptical": {
        // ellipsoid shell
        const u = Math.acos(2 * Math.random() - 1);
        const v = Math.random() * Math.PI * 2;
        const r = 1.5 + rand(-0.3, 0.3);
        x = r * Math.sin(u) * Math.cos(v);
        y = r * 0.7 * Math.sin(u) * Math.sin(v);
        z = r * Math.cos(u);
        break;
      }
      case "Lenticular": {
        // flat disk with central bulge
        const r = Math.sqrt(Math.random()) * 2.5;
        const a = Math.random() * Math.PI * 2;
        x = r * Math.cos(a);
        z = r * Math.sin(a);
        y = rand(-0.1, 0.1) + (Math.random() < 0.15 ? rand(-0.4, 0.4) : 0);
        break;
      }
      default: // Irregular
        x = rand(-2, 2); y = rand(-1, 1); z = rand(-2, 2);
        // clump pull
        const k = Math.random();
        x *= k; y *= k; z *= k;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

function ParticleGalaxy({ galaxyClass, particles = 6000 }: Props) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(
    () => buildPositions(galaxyClass, particles),
    [galaxyClass, particles]
  );

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        sizeAttenuation
        color="#9ec5ff"
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}

export default function GalaxyViewer3D({ galaxyClass, particles }: Props) {
  return (
    <Canvas camera={{ position: [0, 2.5, 6], fov: 55 }}>
      <ambientLight intensity={0.4} />
      <Stars radius={50} depth={20} count={3000} factor={3} fade />
      <ParticleGalaxy galaxyClass={galaxyClass} particles={particles} />
      <OrbitControls enablePan={false} />
    </Canvas>
  );
}
