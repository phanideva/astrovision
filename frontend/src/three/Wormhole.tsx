import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function StarField({ count = 1500 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color("#5cf2ff"),
      new THREE.Color("#a87bff"),
      new THREE.Color("#ffffff"),
      new THREE.Color("#ff5b8a"),
    ];
    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.5) * 18 + 0.5;
      const theta = Math.random() * Math.PI * 2;
      const z = -Math.random() * 60;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.sin(theta) * r;
      positions[i * 3 + 2] = z;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, [count]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 2] += dt * 14;
      if (arr[i * 3 + 2] > 4) arr[i * 3 + 2] = -60;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.z += dt * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.95}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

interface Props {
  height?: number | string;
  count?: number;
}

/** Travelling wormhole/star tunnel — used in cinematic landing. */
export default function Wormhole({ height = "100vh", count = 1500 }: Props) {
  return (
    <Canvas
      style={{ width: "100%", height, background: "transparent" }}
      camera={{ position: [0, 0, 5], fov: 70 }}
      dpr={[1, 1.6]}
    >
      <color attach="background" args={["#03040a"]} />
      <ambientLight intensity={0.3} />
      <StarField count={count} />
    </Canvas>
  );
}
