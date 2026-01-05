import React, { useRef, useMemo, useEffect } from 'react';
import { Platform } from 'react-native';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VisualEffect } from './types';

// Mobile performance optimization - reduce particle counts
const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

// Confetti particle effect
export function ConfettiEffect({ color = '#8b5cf6', speed = 1 }: { color?: string; speed?: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const particleCount = isMobile ? 40 : 100; // Reduced for mobile

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
  const particleCount = isMobile ? 25 : 50; // Reduced for mobile

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
  const heartCount = isMobile ? 5 : 8; // Reduced for mobile

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

// ============================================
// NEW EMOJI-TRIGGERED EFFECTS
// ============================================

// Fire effect - Rising flame particles 🔥💥
export function FireEffect({ color = '#ff4500', speed = 1 }: { color?: string; speed?: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const particleCount = isMobile ? 30 : 60;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.5;
      pos[i * 3 + 1] = Math.random() * 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    }
    return pos;
  }, []);

  const colors = useMemo(() => {
    const cols = new Float32Array(particleCount * 3);
    const fireColors = ['#ff4500', '#ff6b00', '#ff8c00', '#ffa500', '#ffcc00', color];
    for (let i = 0; i < particleCount; i++) {
      const c = new THREE.Color(fireColors[Math.floor(Math.random() * fireColors.length)]);
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
      // Rise up with flickering motion
      positions[i * 3 + 1] += delta * 2.5 * speed;
      positions[i * 3] += Math.sin(timeRef.current * 0.01 * speed + i * 0.5) * delta * 0.8;
      positions[i * 3 + 2] += Math.cos(timeRef.current * 0.008 * speed + i * 0.3) * delta * 0.3;

      // Reset when reaching top
      if (positions[i * 3 + 1] > 3) {
        positions[i * 3 + 1] = -0.2;
        positions[i * 3] = (Math.random() - 0.5) * 1.5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
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
      <pointsMaterial size={0.12} vertexColors transparent opacity={0.85} />
    </points>
  );
}

// Stars effect - Twinkling star shapes ⭐🌟
export function StarsEffect({ color = '#ffd700', speed = 1 }: { color?: string; speed?: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const starCount = isMobile ? 15 : 30;

  const positions = useMemo(() => {
    const pos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.8 + Math.random() * 1.8;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = 0.3 + Math.random() * 2.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius * 0.6;
    }
    return pos;
  }, []);

  const sizes = useMemo(() => {
    const s = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      s[i] = 0.08 + Math.random() * 0.12;
    }
    return s;
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
    timeRef.current += delta * speed;
    // Twinkling effect via material opacity
    const material = particlesRef.current.material as THREE.PointsMaterial;
    material.opacity = 0.6 + Math.sin(timeRef.current * 3) * 0.3;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={starCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.15} color={color} transparent opacity={0.9} />
    </points>
  );
}

// Music notes effect - Floating musical notes 🎵🎶
export function MusicNotesEffect({ color = '#9b59b6', speed = 1 }: { color?: string; speed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const noteCount = isMobile ? 5 : 10;

  const noteData = useMemo(() => {
    return Array.from({ length: noteCount }, () => ({
      x: (Math.random() - 0.5) * 2.5,
      y: Math.random() * 0.5,
      z: (Math.random() - 0.5) * 1.2,
      speed: 0.4 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      scale: 0.08 + Math.random() * 0.06,
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
      const data = noteData[i];
      child.position.y += delta * data.speed * speed;
      child.position.x = data.x + Math.sin(timeRef.current * 0.002 * speed + data.phase) * 0.5;
      child.rotation.z = Math.sin(timeRef.current * 0.003 * speed + data.phase) * 0.3;

      if (child.position.y > 3.5) {
        child.position.y = -0.3;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {noteData.map((data, i) => (
        <mesh key={i} position={[data.x, data.y, data.z]} scale={data.scale}>
          {/* Simple sphere for note - could be replaced with actual note shape */}
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// Tears effect - Falling tear drops 😢😭
export function TearsEffect({ color = '#5dade2', speed = 1 }: { color?: string; speed?: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const tearCount = isMobile ? 20 : 40;

  const positions = useMemo(() => {
    const pos = new Float32Array(tearCount * 3);
    for (let i = 0; i < tearCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 1] = 1 + Math.random() * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
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
    timeRef.current += delta * 1000;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < tearCount; i++) {
      // Fall down with slight drift
      positions[i * 3 + 1] -= delta * 2 * speed;
      positions[i * 3] += Math.sin(timeRef.current * 0.001 + i) * delta * 0.1;

      // Reset when reaching bottom
      if (positions[i * 3 + 1] < -1) {
        positions[i * 3 + 1] = 3.5;
        positions[i * 3] = (Math.random() - 0.5) * 3;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={tearCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color={color} transparent opacity={0.7} />
    </points>
  );
}

// Anger effect - Anime-style steam/veins 😡💢
export function AngerEffect({ color = '#e74c3c', speed = 1 }: { color?: string; speed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const steamCount = isMobile ? 6 : 12;

  const steamData = useMemo(() => {
    return Array.from({ length: steamCount }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: 1.5 + Math.random() * 1,
      z: (Math.random() - 0.5) * 0.8,
      speed: 0.3 + Math.random() * 0.4,
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
      const data = steamData[i];
      // Pulsating and rising motion
      child.position.y += delta * data.speed * speed * 0.5;
      child.scale.setScalar(0.12 + Math.sin(timeRef.current * 0.005 * speed + data.phase) * 0.04);
      
      // Shake effect
      child.position.x = data.x + Math.sin(timeRef.current * 0.02 * speed + data.phase) * 0.15;

      if (child.position.y > 3.5) {
        child.position.y = 1.5;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {steamData.map((data, i) => (
        <mesh key={i} position={[data.x, data.y, data.z]} scale={0.12}>
          <boxGeometry args={[1, 0.3, 0.3]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// Snow effect - Falling snowflakes ❄️🥶
export function SnowEffect({ color = '#ffffff', speed = 1 }: { color?: string; speed?: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const snowCount = isMobile ? 40 : 80;

  const positions = useMemo(() => {
    const pos = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 1] = Math.random() * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
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
    timeRef.current += delta * 1000;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < snowCount; i++) {
      // Gentle falling with sway
      positions[i * 3 + 1] -= delta * 0.8 * speed;
      positions[i * 3] += Math.sin(timeRef.current * 0.001 * speed + i * 0.3) * delta * 0.3;

      // Reset when reaching bottom
      if (positions[i * 3 + 1] < -1) {
        positions[i * 3 + 1] = 4.5;
        positions[i * 3] = (Math.random() - 0.5) * 5;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={snowCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.07} color={color} transparent opacity={0.9} />
    </points>
  );
}

// Rainbow effect - Arcing rainbow bands 🌈
export function RainbowEffect({ speed = 1 }: { color?: string; speed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  const rainbowColors = useMemo(() => [
    '#ff0000', // Red
    '#ff7f00', // Orange
    '#ffff00', // Yellow
    '#00ff00', // Green
    '#0000ff', // Blue
    '#4b0082', // Indigo
    '#9400d3', // Violet
  ], []);

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
    timeRef.current += delta * speed;
    // Gentle pulsing/breathing effect
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 + Math.sin(timeRef.current * 2 + i * 0.3) * 0.15;
    });
  });

  return (
    <group ref={groupRef} position={[0, 1.5, -1]} rotation={[0, 0, Math.PI * 0.15]}>
      {rainbowColors.map((col, i) => (
        <mesh key={i} position={[0, i * 0.12, 0]}>
          <torusGeometry args={[1.5 + i * 0.1, 0.05, 8, 32, Math.PI]} />
          <meshBasicMaterial color={col} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// VISUAL EFFECT RENDERER
// ============================================

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
    // New emoji-triggered effects
    case 'fire':
      return <FireEffect color={effectColor} speed={speed} />;
    case 'stars':
      return <StarsEffect color={effectColor} speed={speed} />;
    case 'music_notes':
      return <MusicNotesEffect color={effectColor} speed={speed} />;
    case 'tears':
      return <TearsEffect color={effectColor} speed={speed} />;
    case 'anger':
      return <AngerEffect color={effectColor} speed={speed} />;
    case 'snow':
      return <SnowEffect color={effectColor} speed={speed} />;
    case 'rainbow':
      return <RainbowEffect color={effectColor} speed={speed} />;
    default:
      return null;
  }
}
