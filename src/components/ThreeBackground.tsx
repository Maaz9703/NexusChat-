"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import styles from "./Background.module.css";

function Particles(props: any) {
  const ref = useRef<any>(null);
  
  // Use useMemo to generate random positions for performance
  const sphere = useMemo(() => {
    const data = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
      const radius = 1.5;
      const r = radius * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      data[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      data[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      data[i * 3 + 2] = r * Math.cos(phi);
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#8a2be2" // Vibrant purple
          size={0.005} // Small particles
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

export default function ThreeBackground() {
  return (
    <div className={styles.canvasContainer}>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <color attach="background" args={["#050505"]} /> {/* Dark sleek background */}
        <Particles />
      </Canvas>
      <div className={styles.overlay} />
    </div>
  );
}
