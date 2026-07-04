import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, ContactShadows } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function GoldenOrb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.4, 1), []);
  const wireGeometry = useMemo(() => new THREE.IcosahedronGeometry(1.55, 1), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.12;
      meshRef.current.rotation.z = t * 0.06;
      const scale = 1 + Math.sin(t * 0.8) * 0.02;
      meshRef.current.scale.setScalar(scale);
    }
    if (ringRef.current) {
      ringRef.current.rotation.y = -t * 0.2;
      ringRef.current.rotation.x = Math.sin(t * 0.3) * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group>
        <mesh ref={meshRef} geometry={geometry}>
          <meshStandardMaterial
            color="#D4AF37"
            metalness={0.9}
            roughness={0.15}
            emissive="#B8962F"
            emissiveIntensity={0.25}
          />
        </mesh>
        <mesh ref={meshRef} geometry={geometry} scale={1.01}>
          <meshBasicMaterial color="#D4AF37" wireframe transparent opacity={0.12} />
        </mesh>
        <group ref={ringRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.2, 0.015, 16, 128]} />
            <meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={0.6} />
          </mesh>
          <mesh rotation={[Math.PI / 3, Math.PI / 6, 0]}>
            <torusGeometry args={[2.6, 0.01, 16, 128]} />
            <meshStandardMaterial color="#E5C95A" emissive="#E5C95A" emissiveIntensity={0.35} />
          </mesh>
        </group>
        {[...Array(6)].map((_, i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i / 6) * Math.PI * 2) * 3.2,
              Math.sin((i / 6) * Math.PI * 2) * 0.5,
              Math.sin((i / 6) * Math.PI * 2) * 3.2,
            ]}
          >
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="#E5C95A" emissive="#E5C95A" emissiveIntensity={0.8} />
          </mesh>
        ))}
        <mesh geometry={wireGeometry}>
          <meshBasicMaterial color="#D4AF37" wireframe transparent opacity={0.08} />
        </mesh>
      </group>
    </Float>
  );
}

export default function Avatar3D() {
  return (
    <div className="w-full h-full min-h-[360px] md:min-h-[480px]">
      <Canvas camera={{ position: [0, 0, 7], fov: 35 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={2} color="#D4AF37" />
        <pointLight position={[-10, -5, -10]} intensity={1} color="#E5C95A" />
        <GoldenOrb />
        <ContactShadows position={[0, -2.8, 0]} opacity={0.25} scale={10} blur={2.5} far={4} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
