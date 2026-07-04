import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function AvatarOrb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.15;
      meshRef.current.rotation.z = t * 0.08;
    }
    if (ringRef.current) {
      ringRef.current.rotation.y = -t * 0.25;
      ringRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          color="#D4AF37"
          metalness={0.85}
          roughness={0.2}
          emissive="#B8962F"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh geometry={geometry} scale={1.02}>
        <meshBasicMaterial color="#D4AF37" wireframe transparent opacity={0.15} />
      </mesh>
      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.55, 0.02, 12, 80]} />
          <meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  );
}

interface UserAvatarProps {
  image?: string;
  alt?: string;
  size?: number;
}

export function UserAvatar({ image, alt = "User", size = 32 }: UserAvatarProps) {
  if (image) {
    return (
      <img
        src={image}
        alt={alt}
        className="rounded-full object-cover border border-gold/30"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full overflow-hidden border border-gold/30 bg-gold/10"
      style={{ width: size, height: size }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 35 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <spotLight position={[5, 5, 5]} angle={0.3} penumbra={1} intensity={1.5} color="#D4AF37" />
        <pointLight position={[-5, -3, -5]} intensity={0.8} color="#E5C95A" />
        <AvatarOrb />
      </Canvas>
    </div>
  );
}
