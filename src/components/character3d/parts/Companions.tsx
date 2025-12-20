import React from 'react';
import { BodyConfig } from '../types';

// Scale factors for companions
const DOG_SCALE = 1.0;
const CAT_SCALE = 0.8;
const OWL_SCALE = 0.6;
const SNAKE_SCALE = 1.0;
const FALCON_SCALE = 0.7;
const RAVEN_SCALE = 0.5;

interface CompanionsProps {
  body: BodyConfig;
  hasDog: boolean;
  hasCat: boolean;
  hasOwl: boolean;
  hasSnake: boolean;
  hasFalcon: boolean;
  hasRaven: boolean;
}

/**
 * Renders animal companions beside/on the character.
 * Includes: dog, cat, owl, snake, falcon, raven
 */
export function Companions({
  body,
  hasDog,
  hasCat,
  hasOwl,
  hasSnake,
  hasFalcon,
  hasRaven,
}: CompanionsProps) {
  return (
    <>
      {/* DOG - loyal companion sitting beside character */}
      {hasDog && (
        <group position={[-body.armX - 0.4 * DOG_SCALE, body.legY - 0.25, 0.2]}>
          {/* Body */}
          <mesh position={[0, 0.12 * DOG_SCALE, 0]} castShadow>
            <boxGeometry args={[0.2 * DOG_SCALE, 0.15 * DOG_SCALE, 0.3 * DOG_SCALE]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.2 * DOG_SCALE, 0.18 * DOG_SCALE]} castShadow>
            <boxGeometry args={[0.14 * DOG_SCALE, 0.12 * DOG_SCALE, 0.14 * DOG_SCALE]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
          {/* Snout */}
          <mesh position={[0, 0.17 * DOG_SCALE, 0.28 * DOG_SCALE]} castShadow>
            <boxGeometry args={[0.08 * DOG_SCALE, 0.06 * DOG_SCALE, 0.08 * DOG_SCALE]} />
            <meshStandardMaterial color="#a0522d" roughness={0.7} />
          </mesh>
          {/* Nose */}
          <mesh position={[0, 0.18 * DOG_SCALE, 0.33 * DOG_SCALE]} castShadow>
            <boxGeometry args={[0.03 * DOG_SCALE, 0.02 * DOG_SCALE, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
          {/* Ears */}
          <mesh position={[-0.06 * DOG_SCALE, 0.28 * DOG_SCALE, 0.15 * DOG_SCALE]} rotation={[0.3, 0, -0.3]} castShadow>
            <boxGeometry args={[0.04 * DOG_SCALE, 0.08 * DOG_SCALE, 0.02]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
          <mesh position={[0.06 * DOG_SCALE, 0.28 * DOG_SCALE, 0.15 * DOG_SCALE]} rotation={[0.3, 0, 0.3]} castShadow>
            <boxGeometry args={[0.04 * DOG_SCALE, 0.08 * DOG_SCALE, 0.02]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
          {/* Tail */}
          <mesh position={[0, 0.18 * DOG_SCALE, -0.18 * DOG_SCALE]} rotation={[-0.5, 0, 0]} castShadow>
            <boxGeometry args={[0.04 * DOG_SCALE, 0.12 * DOG_SCALE, 0.04 * DOG_SCALE]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
          {/* Front legs */}
          <mesh position={[-0.06 * DOG_SCALE, 0, 0.08 * DOG_SCALE]} castShadow>
            <boxGeometry args={[0.04 * DOG_SCALE, 0.12 * DOG_SCALE, 0.04 * DOG_SCALE]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
          <mesh position={[0.06 * DOG_SCALE, 0, 0.08 * DOG_SCALE]} castShadow>
            <boxGeometry args={[0.04 * DOG_SCALE, 0.12 * DOG_SCALE, 0.04 * DOG_SCALE]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
          {/* Back legs (sitting) */}
          <mesh position={[-0.06 * DOG_SCALE, 0.05 * DOG_SCALE, -0.1 * DOG_SCALE]} castShadow>
            <boxGeometry args={[0.05 * DOG_SCALE, 0.1 * DOG_SCALE, 0.1 * DOG_SCALE]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
          <mesh position={[0.06 * DOG_SCALE, 0.05 * DOG_SCALE, -0.1 * DOG_SCALE]} castShadow>
            <boxGeometry args={[0.05 * DOG_SCALE, 0.1 * DOG_SCALE, 0.1 * DOG_SCALE]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
        </group>
      )}

      {/* CAT - sitting beside character */}
      {hasCat && (
        <group position={[body.armX + 0.3 * CAT_SCALE, body.legY - 0.28, 0.15]}>
          {/* Body */}
          <mesh position={[0, 0.1 * CAT_SCALE, 0]} castShadow>
            <boxGeometry args={[0.12 * CAT_SCALE, 0.12 * CAT_SCALE, 0.2 * CAT_SCALE]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.18 * CAT_SCALE, 0.12 * CAT_SCALE]} castShadow>
            <boxGeometry args={[0.12 * CAT_SCALE, 0.1 * CAT_SCALE, 0.1 * CAT_SCALE]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
          </mesh>
          {/* Ears - pointy */}
          <mesh position={[-0.04 * CAT_SCALE, 0.26 * CAT_SCALE, 0.12 * CAT_SCALE]} castShadow>
            <coneGeometry args={[0.025 * CAT_SCALE, 0.05 * CAT_SCALE, 4]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
          </mesh>
          <mesh position={[0.04 * CAT_SCALE, 0.26 * CAT_SCALE, 0.12 * CAT_SCALE]} castShadow>
            <coneGeometry args={[0.025 * CAT_SCALE, 0.05 * CAT_SCALE, 4]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.03 * CAT_SCALE, 0.19 * CAT_SCALE, 0.18 * CAT_SCALE]} castShadow>
            <boxGeometry args={[0.02 * CAT_SCALE, 0.025 * CAT_SCALE, 0.01]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0.03 * CAT_SCALE, 0.19 * CAT_SCALE, 0.18 * CAT_SCALE]} castShadow>
            <boxGeometry args={[0.02 * CAT_SCALE, 0.025 * CAT_SCALE, 0.01]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
          </mesh>
          {/* Tail - curved up */}
          <mesh position={[0, 0.15 * CAT_SCALE, -0.15 * CAT_SCALE]} rotation={[-0.8, 0, 0]} castShadow>
            <boxGeometry args={[0.025 * CAT_SCALE, 0.15 * CAT_SCALE, 0.025 * CAT_SCALE]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
          </mesh>
          {/* Paws */}
          <mesh position={[-0.04 * CAT_SCALE, 0, 0.05 * CAT_SCALE]} castShadow>
            <boxGeometry args={[0.03 * CAT_SCALE, 0.08 * CAT_SCALE, 0.03 * CAT_SCALE]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
          </mesh>
          <mesh position={[0.04 * CAT_SCALE, 0, 0.05 * CAT_SCALE]} castShadow>
            <boxGeometry args={[0.03 * CAT_SCALE, 0.08 * CAT_SCALE, 0.03 * CAT_SCALE]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
          </mesh>
        </group>
      )}

      {/* OWL - perched on shoulder */}
      {hasOwl && (
        <group position={[body.armX + 0.05, body.shoulderY + 0.25, 0]}>
          {/* Body */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.08 * OWL_SCALE, 0.12 * OWL_SCALE, 0.08 * OWL_SCALE]} />
            <meshStandardMaterial color="#8B7355" roughness={0.8} />
          </mesh>
          {/* Head - large */}
          <mesh position={[0, 0.1 * OWL_SCALE, 0.02 * OWL_SCALE]} castShadow>
            <boxGeometry args={[0.1 * OWL_SCALE, 0.08 * OWL_SCALE, 0.08 * OWL_SCALE]} />
            <meshStandardMaterial color="#8B7355" roughness={0.8} />
          </mesh>
          {/* Eyes - big round */}
          <mesh position={[-0.025 * OWL_SCALE, 0.1 * OWL_SCALE, 0.06 * OWL_SCALE]} castShadow>
            <sphereGeometry args={[0.02 * OWL_SCALE, 8, 8]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0.025 * OWL_SCALE, 0.1 * OWL_SCALE, 0.06 * OWL_SCALE]} castShadow>
            <sphereGeometry args={[0.02 * OWL_SCALE, 8, 8]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
          </mesh>
          {/* Beak */}
          <mesh position={[0, 0.08 * OWL_SCALE, 0.06 * OWL_SCALE]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <coneGeometry args={[0.01 * OWL_SCALE, 0.02 * OWL_SCALE, 4]} />
            <meshStandardMaterial color="#f39c12" roughness={0.6} />
          </mesh>
          {/* Ear tufts */}
          <mesh position={[-0.04 * OWL_SCALE, 0.15 * OWL_SCALE, 0]} castShadow>
            <coneGeometry args={[0.015 * OWL_SCALE, 0.04 * OWL_SCALE, 4]} />
            <meshStandardMaterial color="#6B5344" roughness={0.8} />
          </mesh>
          <mesh position={[0.04 * OWL_SCALE, 0.15 * OWL_SCALE, 0]} castShadow>
            <coneGeometry args={[0.015 * OWL_SCALE, 0.04 * OWL_SCALE, 4]} />
            <meshStandardMaterial color="#6B5344" roughness={0.8} />
          </mesh>
          {/* Wings folded */}
          <mesh position={[-0.05 * OWL_SCALE, 0, 0]} castShadow>
            <boxGeometry args={[0.02 * OWL_SCALE, 0.1 * OWL_SCALE, 0.06 * OWL_SCALE]} />
            <meshStandardMaterial color="#6B5344" roughness={0.8} />
          </mesh>
          <mesh position={[0.05 * OWL_SCALE, 0, 0]} castShadow>
            <boxGeometry args={[0.02 * OWL_SCALE, 0.1 * OWL_SCALE, 0.06 * OWL_SCALE]} />
            <meshStandardMaterial color="#6B5344" roughness={0.8} />
          </mesh>
        </group>
      )}

      {/* SNAKE - coiled around arm or beside */}
      {hasSnake && (
        <group position={[-body.armX - 0.15, body.armY - 0.1, 0.1]}>
          {/* Coiled body */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.08 * SNAKE_SCALE, 0.02 * SNAKE_SCALE, 8, 16]} />
            <meshStandardMaterial color="#228B22" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.05 * SNAKE_SCALE, 0]} rotation={[Math.PI / 2, 0, 0.3]} castShadow>
            <torusGeometry args={[0.06 * SNAKE_SCALE, 0.02 * SNAKE_SCALE, 8, 16]} />
            <meshStandardMaterial color="#228B22" roughness={0.6} />
          </mesh>
          {/* Head */}
          <mesh position={[0.08 * SNAKE_SCALE, 0.1 * SNAKE_SCALE, 0.05 * SNAKE_SCALE]} rotation={[0, -0.5, 0]} castShadow>
            <boxGeometry args={[0.04 * SNAKE_SCALE, 0.025 * SNAKE_SCALE, 0.05 * SNAKE_SCALE]} />
            <meshStandardMaterial color="#228B22" roughness={0.6} />
          </mesh>
          {/* Eyes */}
          <mesh position={[0.1 * SNAKE_SCALE, 0.11 * SNAKE_SCALE, 0.07 * SNAKE_SCALE]} castShadow>
            <sphereGeometry args={[0.008 * SNAKE_SCALE, 6, 6]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
          </mesh>
          {/* Tongue */}
          <mesh position={[0.12 * SNAKE_SCALE, 0.095 * SNAKE_SCALE, 0.08 * SNAKE_SCALE]} castShadow>
            <boxGeometry args={[0.03 * SNAKE_SCALE, 0.005, 0.005]} />
            <meshStandardMaterial color="#ff0000" roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* FALCON - perched on arm */}
      {hasFalcon && (
        <group position={[-body.armX - 0.1, body.armY + 0.1, 0.15]}>
          {/* Body */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.06 * FALCON_SCALE, 0.1 * FALCON_SCALE, 0.1 * FALCON_SCALE]} />
            <meshStandardMaterial color="#5c4a3a" roughness={0.7} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.08 * FALCON_SCALE, 0.04 * FALCON_SCALE]} castShadow>
            <boxGeometry args={[0.05 * FALCON_SCALE, 0.05 * FALCON_SCALE, 0.06 * FALCON_SCALE]} />
            <meshStandardMaterial color="#5c4a3a" roughness={0.7} />
          </mesh>
          {/* Beak - hooked */}
          <mesh position={[0, 0.06 * FALCON_SCALE, 0.1 * FALCON_SCALE]} rotation={[0.5, 0, 0]} castShadow>
            <coneGeometry args={[0.015 * FALCON_SCALE, 0.03 * FALCON_SCALE, 4]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.018 * FALCON_SCALE, 0.09 * FALCON_SCALE, 0.07 * FALCON_SCALE]} castShadow>
            <sphereGeometry args={[0.008 * FALCON_SCALE, 6, 6]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
          <mesh position={[0.018 * FALCON_SCALE, 0.09 * FALCON_SCALE, 0.07 * FALCON_SCALE]} castShadow>
            <sphereGeometry args={[0.008 * FALCON_SCALE, 6, 6]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
          {/* Wings */}
          <mesh position={[-0.04 * FALCON_SCALE, 0, -0.02 * FALCON_SCALE]} rotation={[0, 0, 0.2]} castShadow>
            <boxGeometry args={[0.06 * FALCON_SCALE, 0.08 * FALCON_SCALE, 0.02]} />
            <meshStandardMaterial color="#4a3a2a" roughness={0.7} />
          </mesh>
          <mesh position={[0.04 * FALCON_SCALE, 0, -0.02 * FALCON_SCALE]} rotation={[0, 0, -0.2]} castShadow>
            <boxGeometry args={[0.06 * FALCON_SCALE, 0.08 * FALCON_SCALE, 0.02]} />
            <meshStandardMaterial color="#4a3a2a" roughness={0.7} />
          </mesh>
          {/* Tail */}
          <mesh position={[0, -0.02 * FALCON_SCALE, -0.08 * FALCON_SCALE]} castShadow>
            <boxGeometry args={[0.04 * FALCON_SCALE, 0.02, 0.06 * FALCON_SCALE]} />
            <meshStandardMaterial color="#4a3a2a" roughness={0.7} />
          </mesh>
        </group>
      )}

      {/* RAVEN - perched on shoulder */}
      {hasRaven && (
        <group position={[-body.armX - 0.05, body.shoulderY + 0.2, 0]}>
          {/* Body */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.05 * RAVEN_SCALE, 0.08 * RAVEN_SCALE, 0.1 * RAVEN_SCALE]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.06 * RAVEN_SCALE, 0.05 * RAVEN_SCALE]} castShadow>
            <boxGeometry args={[0.04 * RAVEN_SCALE, 0.04 * RAVEN_SCALE, 0.05 * RAVEN_SCALE]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          {/* Beak */}
          <mesh position={[0, 0.05 * RAVEN_SCALE, 0.1 * RAVEN_SCALE]} castShadow>
            <boxGeometry args={[0.015 * RAVEN_SCALE, 0.015 * RAVEN_SCALE, 0.04 * RAVEN_SCALE]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
          </mesh>
          {/* Eyes - beady */}
          <mesh position={[-0.015 * RAVEN_SCALE, 0.07 * RAVEN_SCALE, 0.07 * RAVEN_SCALE]} castShadow>
            <sphereGeometry args={[0.006 * RAVEN_SCALE, 6, 6]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position={[0.015 * RAVEN_SCALE, 0.07 * RAVEN_SCALE, 0.07 * RAVEN_SCALE]} castShadow>
            <sphereGeometry args={[0.006 * RAVEN_SCALE, 6, 6]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          {/* Wings */}
          <mesh position={[-0.035 * RAVEN_SCALE, 0, 0]} castShadow>
            <boxGeometry args={[0.02 * RAVEN_SCALE, 0.06 * RAVEN_SCALE, 0.08 * RAVEN_SCALE]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
          </mesh>
          <mesh position={[0.035 * RAVEN_SCALE, 0, 0]} castShadow>
            <boxGeometry args={[0.02 * RAVEN_SCALE, 0.06 * RAVEN_SCALE, 0.08 * RAVEN_SCALE]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
          </mesh>
          {/* Tail */}
          <mesh position={[0, -0.01 * RAVEN_SCALE, -0.08 * RAVEN_SCALE]} castShadow>
            <boxGeometry args={[0.03 * RAVEN_SCALE, 0.015, 0.05 * RAVEN_SCALE]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
          </mesh>
        </group>
      )}
    </>
  );
}
