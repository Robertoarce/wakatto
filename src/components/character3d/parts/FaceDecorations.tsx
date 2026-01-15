import React from 'react';
import { ComplementaryAnimation } from '../types';

interface FaceDecorationsProps {
  complementary?: ComplementaryAnimation;
  faceOffset?: { x: number; y: number; z: number };
}

/**
 * Renders anime-style face decorations based on the complementary animation state.
 * Includes cheek states, forehead states, tears, and special eye effects.
 */
export function FaceDecorations({
  complementary,
  faceOffset = { x: 0, y: 0, z: 0 }
}: FaceDecorationsProps) {
  const faceState = complementary?.faceState;
  if (!faceState || faceState === 'normal') return null;

  return (
    <>
      {/* Cheek States */}
      {complementary?.cheekState === 'flushed' && (
        <>
          <mesh position={[-0.18 + faceOffset.x, -0.02 + faceOffset.y, 0.24 + faceOffset.z]}>
            <circleGeometry args={[0.06, 16]} />
            <meshBasicMaterial color="#ffb3d9" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0.18 + faceOffset.x, -0.02 + faceOffset.y, 0.24 + faceOffset.z]}>
            <circleGeometry args={[0.06, 16]} />
            <meshBasicMaterial color="#ffb3d9" transparent opacity={0.6} />
          </mesh>
        </>
      )}

      {complementary?.cheekState === 'sunken' && (
        <>
          <mesh position={[-0.18 + faceOffset.x, -0.05 + faceOffset.y, 0.23 + faceOffset.z]}>
            <boxGeometry args={[0.08, 0.06, 0.01]} />
            <meshBasicMaterial color="#1a1a1a" transparent opacity={0.4} />
          </mesh>
          <mesh position={[0.18 + faceOffset.x, -0.05 + faceOffset.y, 0.23 + faceOffset.z]}>
            <boxGeometry args={[0.08, 0.06, 0.01]} />
            <meshBasicMaterial color="#1a1a1a" transparent opacity={0.4} />
          </mesh>
        </>
      )}

      {complementary?.cheekState === 'puffed' && (
        <>
          <mesh position={[-0.20 + faceOffset.x, -0.02 + faceOffset.y, 0.26 + faceOffset.z]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#d4a5a5" roughness={0.6} />
          </mesh>
          <mesh position={[0.20 + faceOffset.x, -0.02 + faceOffset.y, 0.26 + faceOffset.z]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#d4a5a5" roughness={0.6} />
          </mesh>
        </>
      )}

      {complementary?.cheekState === 'dimpled' && (
        <>
          <mesh position={[-0.18 + faceOffset.x, -0.08 + faceOffset.y, 0.26 + faceOffset.z]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
          <mesh position={[0.18 + faceOffset.x, -0.08 + faceOffset.y, 0.26 + faceOffset.z]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
        </>
      )}

      {/* Forehead States - positioned more forward to be visible */}
      {complementary?.foreheadState === 'wrinkled' && (
        <>
          <mesh position={[0 + faceOffset.x, 0.18 + faceOffset.y, 0.28 + faceOffset.z]}>
            <boxGeometry args={[0.25, 0.012, 0.01]} />
            <meshBasicMaterial color="#2a2a2a" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0 + faceOffset.x, 0.20 + faceOffset.y, 0.28 + faceOffset.z]}>
            <boxGeometry args={[0.22, 0.012, 0.01]} />
            <meshBasicMaterial color="#2a2a2a" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0 + faceOffset.x, 0.22 + faceOffset.y, 0.28 + faceOffset.z]}>
            <boxGeometry args={[0.24, 0.012, 0.01]} />
            <meshBasicMaterial color="#2a2a2a" transparent opacity={0.6} />
          </mesh>
        </>
      )}

      {complementary?.foreheadState === 'tense' && (
        <mesh position={[0 + faceOffset.x, 0.20 + faceOffset.y, 0.28 + faceOffset.z]}>
          <boxGeometry args={[0.26, 0.025, 0.01]} />
          <meshBasicMaterial color="#2a2a2a" transparent opacity={0.7} />
        </mesh>
      )}

      {complementary?.foreheadState === 'raised' && (
        <mesh position={[0 + faceOffset.x, 0.24 + faceOffset.y, 0.28 + faceOffset.z]}>
          <boxGeometry args={[0.2, 0.01, 0.01]} />
          <meshBasicMaterial color="#2a2a2a" transparent opacity={0.4} />
        </mesh>
      )}

      {/* Tearful State */}
      {complementary?.eyeState === 'tearful' && (
        <>
          <mesh position={[-0.12 + faceOffset.x, -0.02 + faceOffset.y, 0.27 + faceOffset.z]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#4dd0e1" transparent opacity={0.7} />
          </mesh>
          <mesh position={[0.12 + faceOffset.x, -0.02 + faceOffset.y, 0.27 + faceOffset.z]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#4dd0e1" transparent opacity={0.7} />
          </mesh>
        </>
      )}

      {/* Sweat Drop - Nervous anime sweat */}
      {faceState === 'sweat_drop' && (
        <mesh position={[0.22 + faceOffset.x, 0.15 + faceOffset.y, 0.2 + faceOffset.z]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.03, 0.08, 8]} />
          <meshBasicMaterial color="#87ceeb" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Sparkle Eyes - Excited star eyes */}
      {faceState === 'sparkle_eyes' && (
        <>
          <mesh position={[-0.1 + faceOffset.x, 0.05 + faceOffset.y, 0.26 + faceOffset.z]}>
            <sphereGeometry args={[0.045, 4, 2]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>
          <mesh position={[0.1 + faceOffset.x, 0.05 + faceOffset.y, 0.26 + faceOffset.z]}>
            <sphereGeometry args={[0.045, 4, 2]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>
          <mesh position={[-0.15 + faceOffset.x, 0.12 + faceOffset.y, 0.22 + faceOffset.z]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.02, 0.06, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.15 + faceOffset.x, 0.12 + faceOffset.y, 0.22 + faceOffset.z]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.02, 0.06, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </>
      )}

      {/* Heart Eyes - Love/admiration */}
      {faceState === 'heart_eyes' && (
        <>
          <group position={[-0.1 + faceOffset.x, 0.05 + faceOffset.y, 0.26 + faceOffset.z]}>
            <mesh position={[-0.015, 0.015, 0]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color="#ff69b4" />
            </mesh>
            <mesh position={[0.015, 0.015, 0]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color="#ff69b4" />
            </mesh>
            <mesh position={[0, -0.015, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.035, 0.035, 0.02]} />
              <meshBasicMaterial color="#ff69b4" />
            </mesh>
          </group>
          <group position={[0.1 + faceOffset.x, 0.05 + faceOffset.y, 0.26 + faceOffset.z]}>
            <mesh position={[-0.015, 0.015, 0]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color="#ff69b4" />
            </mesh>
            <mesh position={[0.015, 0.015, 0]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color="#ff69b4" />
            </mesh>
            <mesh position={[0, -0.015, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.035, 0.035, 0.02]} />
              <meshBasicMaterial color="#ff69b4" />
            </mesh>
          </group>
        </>
      )}

      {/* Spiral Eyes - Dizzy/confused */}
      {faceState === 'spiral_eyes' && (
        <>
          <mesh position={[-0.1 + faceOffset.x, 0.05 + faceOffset.y, 0.26 + faceOffset.z]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.03, 0.008, 8, 16, Math.PI * 3]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0.1 + faceOffset.x, 0.05 + faceOffset.y, 0.26 + faceOffset.z]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.03, 0.008, 8, 16, Math.PI * 3]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
        </>
      )}

      {/* Tears - Crying streams */}
      {faceState === 'tears' && (
        <>
          <mesh position={[-0.12 + faceOffset.x, -0.05 + faceOffset.y, 0.24 + faceOffset.z]}>
            <cylinderGeometry args={[0.015, 0.02, 0.12, 8]} />
            <meshBasicMaterial color="#87ceeb" transparent opacity={0.7} />
          </mesh>
          <mesh position={[0.12 + faceOffset.x, -0.05 + faceOffset.y, 0.24 + faceOffset.z]}>
            <cylinderGeometry args={[0.015, 0.02, 0.12, 8]} />
            <meshBasicMaterial color="#87ceeb" transparent opacity={0.7} />
          </mesh>
          <mesh position={[-0.12 + faceOffset.x, -0.12 + faceOffset.y, 0.24 + faceOffset.z]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial color="#87ceeb" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0.12 + faceOffset.x, -0.12 + faceOffset.y, 0.24 + faceOffset.z]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial color="#87ceeb" transparent opacity={0.8} />
          </mesh>
        </>
      )}

      {/* Anger Vein - Anime anger mark */}
      {faceState === 'anger_vein' && (
        <group position={[0.18 + faceOffset.x, 0.18 + faceOffset.y, 0.2 + faceOffset.z]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.06, 0.015, 0.01]} />
            <meshBasicMaterial color="#ff3333" />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.06, 0.015, 0.01]} />
            <meshBasicMaterial color="#ff3333" />
          </mesh>
          <mesh position={[0.02, 0.02, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.04, 0.012, 0.01]} />
            <meshBasicMaterial color="#ff3333" />
          </mesh>
          <mesh position={[0.02, 0.02, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.04, 0.012, 0.01]} />
            <meshBasicMaterial color="#ff3333" />
          </mesh>
        </group>
      )}

    </>
  );
}
