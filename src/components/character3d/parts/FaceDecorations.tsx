import React from 'react';
import { ComplementaryAnimation } from '../types';

interface FaceDecorationsProps {
  complementary?: ComplementaryAnimation;
  faceOffset?: { x: number; y: number; z: number };
  headScale?: number;
}

/**
 * Renders anime-style face decorations based on the complementary animation state.
 * Includes cheek states, forehead states, tears, and special eye effects.
 * All positions and sizes are scaled by headScale for different head sizes.
 */
export function FaceDecorations({
  complementary,
  faceOffset = { x: 0, y: 0, z: 0 },
  headScale = 1
}: FaceDecorationsProps) {
  const faceState = complementary?.faceState;
  const foreheadState = complementary?.foreheadState;
  const cheekState = complementary?.cheekState;
  const eyeState = complementary?.eyeState;
  
  // Only return null if there are no active states at all
  const hasFaceState = faceState && faceState !== 'normal';
  const hasForeheadState = foreheadState && foreheadState !== 'smooth';
  const hasCheekState = cheekState && cheekState !== 'normal';
  const hasEyeState = eyeState && eyeState !== 'normal';
  
  if (!hasFaceState && !hasForeheadState && !hasCheekState && !hasEyeState) return null;

  // Helper to scale position values
  const s = headScale;

  return (
    <>
      {/* Cheek States */}
      {complementary?.cheekState === 'flushed' && (
        <>
          <mesh position={[-0.18 * s + faceOffset.x, -0.02 * s + faceOffset.y, 0.24 * s + faceOffset.z]}>
            <circleGeometry args={[0.06 * s, 16]} />
            <meshBasicMaterial color="#ffb3d9" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0.18 * s + faceOffset.x, -0.02 * s + faceOffset.y, 0.24 * s + faceOffset.z]}>
            <circleGeometry args={[0.06 * s, 16]} />
            <meshBasicMaterial color="#ffb3d9" transparent opacity={0.6} />
          </mesh>
        </>
      )}

      {complementary?.cheekState === 'sunken' && (
        <>
          <mesh position={[-0.18 * s + faceOffset.x, -0.05 * s + faceOffset.y, 0.23 * s + faceOffset.z]}>
            <boxGeometry args={[0.08 * s, 0.06 * s, 0.01]} />
            <meshBasicMaterial color="#1a1a1a" transparent opacity={0.4} />
          </mesh>
          <mesh position={[0.18 * s + faceOffset.x, -0.05 * s + faceOffset.y, 0.23 * s + faceOffset.z]}>
            <boxGeometry args={[0.08 * s, 0.06 * s, 0.01]} />
            <meshBasicMaterial color="#1a1a1a" transparent opacity={0.4} />
          </mesh>
        </>
      )}

      {complementary?.cheekState === 'puffed' && (
        <>
          <mesh position={[-0.20 * s + faceOffset.x, -0.02 * s + faceOffset.y, 0.26 * s + faceOffset.z]}>
            <sphereGeometry args={[0.08 * s, 16, 16]} />
            <meshStandardMaterial color="#d4a5a5" roughness={0.6} />
          </mesh>
          <mesh position={[0.20 * s + faceOffset.x, -0.02 * s + faceOffset.y, 0.26 * s + faceOffset.z]}>
            <sphereGeometry args={[0.08 * s, 16, 16]} />
            <meshStandardMaterial color="#d4a5a5" roughness={0.6} />
          </mesh>
        </>
      )}

      {complementary?.cheekState === 'dimpled' && (
        <>
          <mesh position={[-0.18 * s + faceOffset.x, -0.08 * s + faceOffset.y, 0.26 * s + faceOffset.z]}>
            <sphereGeometry args={[0.02 * s, 8, 8]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
          <mesh position={[0.18 * s + faceOffset.x, -0.08 * s + faceOffset.y, 0.26 * s + faceOffset.z]}>
            <sphereGeometry args={[0.02 * s, 8, 8]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
        </>
      )}

      {/* Forehead States - positioned just above eyebrows (eyebrows are at ~0.14) */}
      {complementary?.foreheadState === 'wrinkled' && (
        <>
          <mesh position={[0 + faceOffset.x, 0.15 * s + faceOffset.y, 0.28 * s + faceOffset.z]}>
            <boxGeometry args={[0.25 * s, 0.012 * s, 0.01]} />
            <meshBasicMaterial color="#2a2a2a" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0 + faceOffset.x, 0.17 * s + faceOffset.y, 0.28 * s + faceOffset.z]}>
            <boxGeometry args={[0.22 * s, 0.012 * s, 0.01]} />
            <meshBasicMaterial color="#2a2a2a" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0 + faceOffset.x, 0.19 * s + faceOffset.y, 0.28 * s + faceOffset.z]}>
            <boxGeometry args={[0.24 * s, 0.012 * s, 0.01]} />
            <meshBasicMaterial color="#2a2a2a" transparent opacity={0.6} />
          </mesh>
        </>
      )}

      {complementary?.foreheadState === 'tense' && (
        <mesh position={[0 + faceOffset.x, 0.16 * s + faceOffset.y, 0.28 * s + faceOffset.z]}>
          <boxGeometry args={[0.26 * s, 0.025 * s, 0.01]} />
          <meshBasicMaterial color="#2a2a2a" transparent opacity={0.7} />
        </mesh>
      )}

      {complementary?.foreheadState === 'raised' && (
        <mesh position={[0 + faceOffset.x, 0.18 * s + faceOffset.y, 0.28 * s + faceOffset.z]}>
          <boxGeometry args={[0.2 * s, 0.01 * s, 0.01]} />
          <meshBasicMaterial color="#2a2a2a" transparent opacity={0.4} />
        </mesh>
      )}

      {/* Tearful State */}
      {complementary?.eyeState === 'tearful' && (
        <>
          <mesh position={[-0.12 * s + faceOffset.x, -0.02 * s + faceOffset.y, 0.27 * s + faceOffset.z]}>
            <sphereGeometry args={[0.02 * s, 8, 8]} />
            <meshBasicMaterial color="#4dd0e1" transparent opacity={0.7} />
          </mesh>
          <mesh position={[0.12 * s + faceOffset.x, -0.02 * s + faceOffset.y, 0.27 * s + faceOffset.z]}>
            <sphereGeometry args={[0.02 * s, 8, 8]} />
            <meshBasicMaterial color="#4dd0e1" transparent opacity={0.7} />
          </mesh>
        </>
      )}

      {/* Sweat Drop - Nervous anime sweat */}
      {faceState === 'sweat_drop' && (
        <mesh position={[0.22 * s + faceOffset.x, 0.15 * s + faceOffset.y, 0.2 * s + faceOffset.z]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.03 * s, 0.08 * s, 8]} />
          <meshBasicMaterial color="#87ceeb" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Sparkle Eyes - Excited star eyes */}
      {faceState === 'sparkle_eyes' && (
        <>
          <mesh position={[-0.1 * s + faceOffset.x, 0.05 * s + faceOffset.y, 0.26 * s + faceOffset.z]}>
            <sphereGeometry args={[0.045 * s, 4, 2]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>
          <mesh position={[0.1 * s + faceOffset.x, 0.05 * s + faceOffset.y, 0.26 * s + faceOffset.z]}>
            <sphereGeometry args={[0.045 * s, 4, 2]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>
          <mesh position={[-0.15 * s + faceOffset.x, 0.12 * s + faceOffset.y, 0.22 * s + faceOffset.z]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.02 * s, 0.06 * s, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.15 * s + faceOffset.x, 0.12 * s + faceOffset.y, 0.22 * s + faceOffset.z]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.02 * s, 0.06 * s, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </>
      )}

      {/* Heart Eyes - Love/admiration */}
      {faceState === 'heart_eyes' && (
        <>
          <group position={[-0.1 * s + faceOffset.x, 0.05 * s + faceOffset.y, 0.26 * s + faceOffset.z]}>
            <mesh position={[-0.015 * s, 0.015 * s, 0]}>
              <sphereGeometry args={[0.025 * s, 8, 8]} />
              <meshBasicMaterial color="#ff69b4" />
            </mesh>
            <mesh position={[0.015 * s, 0.015 * s, 0]}>
              <sphereGeometry args={[0.025 * s, 8, 8]} />
              <meshBasicMaterial color="#ff69b4" />
            </mesh>
            <mesh position={[0, -0.015 * s, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.035 * s, 0.035 * s, 0.02 * s]} />
              <meshBasicMaterial color="#ff69b4" />
            </mesh>
          </group>
          <group position={[0.1 * s + faceOffset.x, 0.05 * s + faceOffset.y, 0.26 * s + faceOffset.z]}>
            <mesh position={[-0.015 * s, 0.015 * s, 0]}>
              <sphereGeometry args={[0.025 * s, 8, 8]} />
              <meshBasicMaterial color="#ff69b4" />
            </mesh>
            <mesh position={[0.015 * s, 0.015 * s, 0]}>
              <sphereGeometry args={[0.025 * s, 8, 8]} />
              <meshBasicMaterial color="#ff69b4" />
            </mesh>
            <mesh position={[0, -0.015 * s, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.035 * s, 0.035 * s, 0.02 * s]} />
              <meshBasicMaterial color="#ff69b4" />
            </mesh>
          </group>
        </>
      )}

      {/* Spiral Eyes - Dizzy/confused */}
      {faceState === 'spiral_eyes' && (
        <>
          <mesh position={[-0.1 * s + faceOffset.x, 0.05 * s + faceOffset.y, 0.26 * s + faceOffset.z]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.03 * s, 0.008 * s, 8, 16, Math.PI * 3]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0.1 * s + faceOffset.x, 0.05 * s + faceOffset.y, 0.26 * s + faceOffset.z]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.03 * s, 0.008 * s, 8, 16, Math.PI * 3]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
        </>
      )}

      {/* Tears - Crying streams */}
      {faceState === 'tears' && (
        <>
          <mesh position={[-0.12 * s + faceOffset.x, -0.05 * s + faceOffset.y, 0.24 * s + faceOffset.z]}>
            <cylinderGeometry args={[0.015 * s, 0.02 * s, 0.12 * s, 8]} />
            <meshBasicMaterial color="#87ceeb" transparent opacity={0.7} />
          </mesh>
          <mesh position={[0.12 * s + faceOffset.x, -0.05 * s + faceOffset.y, 0.24 * s + faceOffset.z]}>
            <cylinderGeometry args={[0.015 * s, 0.02 * s, 0.12 * s, 8]} />
            <meshBasicMaterial color="#87ceeb" transparent opacity={0.7} />
          </mesh>
          <mesh position={[-0.12 * s + faceOffset.x, -0.12 * s + faceOffset.y, 0.24 * s + faceOffset.z]}>
            <sphereGeometry args={[0.025 * s, 8, 8]} />
            <meshBasicMaterial color="#87ceeb" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0.12 * s + faceOffset.x, -0.12 * s + faceOffset.y, 0.24 * s + faceOffset.z]}>
            <sphereGeometry args={[0.025 * s, 8, 8]} />
            <meshBasicMaterial color="#87ceeb" transparent opacity={0.8} />
          </mesh>
        </>
      )}

      {/* Anger Vein - Anime anger mark */}
      {faceState === 'anger_vein' && (
        <group position={[0.18 * s + faceOffset.x, 0.18 * s + faceOffset.y, 0.2 * s + faceOffset.z]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.06 * s, 0.015 * s, 0.01]} />
            <meshBasicMaterial color="#ff3333" />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.06 * s, 0.015 * s, 0.01]} />
            <meshBasicMaterial color="#ff3333" />
          </mesh>
          <mesh position={[0.02 * s, 0.02 * s, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.04 * s, 0.012 * s, 0.01]} />
            <meshBasicMaterial color="#ff3333" />
          </mesh>
          <mesh position={[0.02 * s, 0.02 * s, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.04 * s, 0.012 * s, 0.01]} />
            <meshBasicMaterial color="#ff3333" />
          </mesh>
        </group>
      )}

    </>
  );
}
