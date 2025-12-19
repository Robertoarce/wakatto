import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VisualEffect } from './types';

// Confetti particle effect
export function ConfettiEffect({ color = '#8b5cf6', speed = 1 }: { color?: string; speed?: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const particleCount = 100;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = Math.random() * 4 + 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return pos;
  }, []);

  const colors = useMemo(() => {
    const cols = new Float32Array(particleCount * 3);
    const confettiColors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', color];
    for (let i = 0; i < particleCount; i++) {
      const c = new THREE.Color(confettiColors[Math.floor(Math.random() * confettiColors.length)]);
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return cols;
  }, [color]);

  useEffect(() => {
    return () => {
      if (particlesRef.current) {
        particlesRef.current.geometry?.dispose();
        const material = particlesRef.current.material as THREE.Material;
        material?.dispose();
      }
    };
  }, []);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    timeRef.current += delta * 1000;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 1] -= delta * 2 * speed;
      positions[i * 3] += Math.sin(timeRef.current * 0.003 * speed + i) * delta * 0.5;

      if (positions[i * 3 + 1] < -1) {
        positions[i * 3 + 1] = 4;
        positions[i * 3] = (Math.random() - 0.5) * 4;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.08} vertexColors transparent opacity={0.9} />
    </points>
  );
}

// Spotlight/concert light effect
export function SpotlightEffect({ color = '#ffd700', speed = 1 }: { color?: string; speed?: number }) {
  const lightRef = useRef<THREE.SpotLight>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (coneRef.current) {
        coneRef.current.geometry?.dispose();
        const material = coneRef.current.material as THREE.Material;
        material?.dispose();
      }
    };
  }, []);

  useFrame((_, delta) => {
    timeRef.current += delta * speed;
    const time = timeRef.current;
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(time * 0.5) * 1.5;
      lightRef.current.intensity = 2 + Math.sin(time * 2) * 0.5;
    }
    if (coneRef.current) {
      coneRef.current.rotation.z = Math.sin(time * 0.5) * 0.3;
      coneRef.current.position.x = Math.sin(time * 0.5) * 1.5;
    }
  });

  return (
    <group>
      <spotLight
        ref={lightRef}
        position={[0, 5, 2]}
        angle={0.4}
        penumbra={0.8}
        intensity={2.5}
        color={color}
        target-position={[0, 0, 0]}
        castShadow
      />
      <mesh ref={coneRef} position={[0, 3, 1]} rotation={[Math.PI / 6, 0, 0]}>
        <coneGeometry args={[1.5, 4, 32, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Sparkles effect
export function SparklesEffect({ color = '#ffd700', speed = 1 }: { color?: string; speed?: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const particleCount = 50;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 1.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.random() * 2;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  useEffect(() => {
    return () => {
      if (particlesRef.current) {
        particlesRef.current.geometry?.dispose();
        const material = particlesRef.current.material as THREE.Material;
        material?.dispose();
      }
    };
  }, []);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    timeRef.current += delta * 1000 * speed;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const time = timeRef.current * 0.002;

    for (let i = 0; i < particleCount; i++) {
      const baseAngle = time + i * 0.5;
      const radius = 0.5 + Math.sin(time + i) * 0.5 + 1;
      positions[i * 3] = Math.cos(baseAngle) * radius;
      positions[i * 3 + 1] = 0.5 + Math.sin(time * 2 + i) * 0.8 + Math.sin(i) * 0.5;
      positions[i * 3 + 2] = Math.sin(baseAngle) * radius * 0.5;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.1} color={color} transparent opacity={0.8} />
    </points>
  );
}

// Hearts effect
export function HeartsEffect({ color = '#ff6b6b', speed = 1 }: { color?: string; speed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const heartCount = 8;

  const heartPositions = useMemo(() => {
    return Array.from({ length: heartCount }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: Math.random() * 0.5,
      z: (Math.random() - 0.5) * 1,
      speed: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (groupRef.current) {
        groupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            const material = child.material as THREE.Material;
            material?.dispose();
          }
        });
      }
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta * 1000;
    groupRef.current.children.forEach((child, i) => {
      const data = heartPositions[i];
      child.position.y += delta * data.speed * speed;
      child.position.x = data.x + Math.sin(timeRef.current * 0.002 * speed + data.phase) * 0.3;
      child.rotation.z = Math.sin(timeRef.current * 0.003 * speed + data.phase) * 0.2;

      if (child.position.y > 3) {
        child.position.y = -0.5;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {heartPositions.map((pos, i) => (
        <mesh key={i} position={[pos.x, pos.y, pos.z]} scale={0.15}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// Visual effect renderer
interface VisualEffectRendererProps {
  effect?: VisualEffect;
  effectColor?: string;
  speed?: number;
}

export function VisualEffectRenderer({ effect, effectColor, speed = 1 }: VisualEffectRendererProps) {
  if (!effect || effect === 'none') return null;

  switch (effect) {
    case 'confetti':
      return <ConfettiEffect color={effectColor} speed={speed} />;
    case 'spotlight':
      return <SpotlightEffect color={effectColor} speed={speed} />;
    case 'sparkles':
      return <SparklesEffect color={effectColor} speed={speed} />;
    case 'hearts':
      return <HeartsEffect color={effectColor} speed={speed} />;
    default:
      return null;
  }
}
