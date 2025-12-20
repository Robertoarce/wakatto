import React from 'react';

interface HeadAccessoriesProps {
  headScale: number;
  hasSunglasses: boolean;
  hasGoggles: boolean;
  hasTurban: boolean;
  hasBeret: boolean;
  hasBandana: boolean;
  hasHelmet: boolean;
  hasTiara: boolean;
  hasHalo: boolean;
  hasHorns: boolean;
  accessoryColor: string;
}

/**
 * Renders additional head accessories.
 * Includes: sunglasses, goggles, turban, beret, bandana, helmet, tiara, halo, horns
 */
export function HeadAccessories({
  headScale,
  hasSunglasses,
  hasGoggles,
  hasTurban,
  hasBeret,
  hasBandana,
  hasHelmet,
  hasTiara,
  hasHalo,
  hasHorns,
  accessoryColor,
}: HeadAccessoriesProps) {
  return (
    <>
      {/* Sunglasses */}
      {hasSunglasses && (
        <>
          {/* Left lens - dark */}
          <mesh position={[-0.12 * headScale, 0.08 * headScale, 0.26 * headScale]} castShadow>
            <boxGeometry args={[0.12 * headScale, 0.08 * headScale, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Right lens - dark */}
          <mesh position={[0.12 * headScale, 0.08 * headScale, 0.26 * headScale]} castShadow>
            <boxGeometry args={[0.12 * headScale, 0.08 * headScale, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Bridge */}
          <mesh position={[0, 0.08 * headScale, 0.26 * headScale]} castShadow>
            <boxGeometry args={[0.06 * headScale, 0.02 * headScale, 0.02]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
          </mesh>
          {/* Left arm */}
          <mesh position={[-0.2 * headScale, 0.08 * headScale, 0.15 * headScale]} castShadow>
            <boxGeometry args={[0.02, 0.02 * headScale, 0.2 * headScale]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
          </mesh>
          {/* Right arm */}
          <mesh position={[0.2 * headScale, 0.08 * headScale, 0.15 * headScale]} castShadow>
            <boxGeometry args={[0.02, 0.02 * headScale, 0.2 * headScale]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* Goggles - steampunk/scientist style */}
      {hasGoggles && (
        <>
          {/* Left goggle */}
          <mesh position={[-0.12 * headScale, 0.1 * headScale, 0.25 * headScale]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.08 * headScale, 0.08 * headScale, 0.04, 16]} />
            <meshStandardMaterial color="#8B4513" roughness={0.6} />
          </mesh>
          {/* Left lens */}
          <mesh position={[-0.12 * headScale, 0.1 * headScale, 0.27 * headScale]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.06 * headScale, 0.06 * headScale, 0.01, 16]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.6} roughness={0.2} />
          </mesh>
          {/* Right goggle */}
          <mesh position={[0.12 * headScale, 0.1 * headScale, 0.25 * headScale]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.08 * headScale, 0.08 * headScale, 0.04, 16]} />
            <meshStandardMaterial color="#8B4513" roughness={0.6} />
          </mesh>
          {/* Right lens */}
          <mesh position={[0.12 * headScale, 0.1 * headScale, 0.27 * headScale]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.06 * headScale, 0.06 * headScale, 0.01, 16]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.6} roughness={0.2} />
          </mesh>
          {/* Strap */}
          <mesh position={[0, 0.1 * headScale, 0]} castShadow>
            <torusGeometry args={[0.25 * headScale, 0.02 * headScale, 8, 16]} />
            <meshStandardMaterial color="#5c4a3a" roughness={0.8} />
          </mesh>
        </>
      )}

      {/* Turban */}
      {hasTurban && (
        <>
          {/* Main wrap */}
          <mesh position={[0, 0.28 * headScale, 0]} castShadow>
            <boxGeometry args={[0.52 * headScale, 0.25 * headScale, 0.48 * headScale]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.8} />
          </mesh>
          {/* Top fold */}
          <mesh position={[0, 0.42 * headScale, 0.05 * headScale]} castShadow>
            <boxGeometry args={[0.3 * headScale, 0.1 * headScale, 0.3 * headScale]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.8} />
          </mesh>
          {/* Jewel ornament */}
          <mesh position={[0, 0.28 * headScale, 0.26 * headScale]} castShadow>
            <boxGeometry args={[0.06 * headScale, 0.06 * headScale, 0.02]} />
            <meshStandardMaterial color="#e91e63" metalness={0.5} roughness={0.3} />
          </mesh>
        </>
      )}

      {/* Beret */}
      {hasBeret && (
        <>
          {/* Main cap */}
          <mesh position={[0.05 * headScale, 0.28 * headScale, 0]} castShadow>
            <sphereGeometry args={[0.22 * headScale, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
          {/* Band */}
          <mesh position={[0, 0.2 * headScale, 0]} castShadow>
            <torusGeometry args={[0.22 * headScale, 0.02 * headScale, 8, 16]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
          {/* Stem */}
          <mesh position={[0, 0.35 * headScale, 0]} castShadow>
            <boxGeometry args={[0.03 * headScale, 0.03 * headScale, 0.03 * headScale]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
        </>
      )}

      {/* Bandana */}
      {hasBandana && (
        <>
          {/* Main band around forehead */}
          <mesh position={[0, 0.18 * headScale, 0]} castShadow>
            <boxGeometry args={[0.52 * headScale, 0.08 * headScale, 0.48 * headScale]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
          {/* Knot at back */}
          <mesh position={[0, 0.15 * headScale, -0.26 * headScale]} castShadow>
            <boxGeometry args={[0.1 * headScale, 0.1 * headScale, 0.06 * headScale]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
          {/* Trailing tails */}
          <mesh position={[-0.05 * headScale, 0.08 * headScale, -0.3 * headScale]} rotation={[0.3, 0, -0.2]} castShadow>
            <boxGeometry args={[0.06 * headScale, 0.15 * headScale, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
          <mesh position={[0.05 * headScale, 0.08 * headScale, -0.3 * headScale]} rotation={[0.3, 0, 0.2]} castShadow>
            <boxGeometry args={[0.06 * headScale, 0.15 * headScale, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
        </>
      )}

      {/* Helmet - knight/soldier style */}
      {hasHelmet && (
        <>
          {/* Main dome */}
          <mesh position={[0, 0.22 * headScale, 0]} castShadow>
            <sphereGeometry args={[0.28 * headScale, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Face guard */}
          <mesh position={[0, 0.05 * headScale, 0.22 * headScale]} castShadow>
            <boxGeometry args={[0.35 * headScale, 0.2 * headScale, 0.02]} />
            <meshStandardMaterial color="#4b5563" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Eye slit */}
          <mesh position={[0, 0.08 * headScale, 0.24 * headScale]} castShadow>
            <boxGeometry args={[0.25 * headScale, 0.03 * headScale, 0.02]} />
            <meshStandardMaterial color="#1f2937" roughness={0.5} />
          </mesh>
          {/* Top crest */}
          <mesh position={[0, 0.4 * headScale, 0]} castShadow>
            <boxGeometry args={[0.03 * headScale, 0.1 * headScale, 0.2 * headScale]} />
            <meshStandardMaterial color="#dc2626" roughness={0.7} />
          </mesh>
        </>
      )}

      {/* Tiara */}
      {hasTiara && (
        <>
          {/* Base band */}
          <mesh position={[0, 0.22 * headScale, 0.15 * headScale]} castShadow>
            <torusGeometry args={[0.2 * headScale, 0.02 * headScale, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Center jewel */}
          <mesh position={[0, 0.3 * headScale, 0.2 * headScale]} castShadow>
            <boxGeometry args={[0.05 * headScale, 0.08 * headScale, 0.02]} />
            <meshStandardMaterial color="#e91e63" metalness={0.3} roughness={0.2} />
          </mesh>
          {/* Side points */}
          <mesh position={[-0.1 * headScale, 0.27 * headScale, 0.18 * headScale]} castShadow>
            <boxGeometry args={[0.03 * headScale, 0.06 * headScale, 0.02]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.1 * headScale, 0.27 * headScale, 0.18 * headScale]} castShadow>
            <boxGeometry args={[0.03 * headScale, 0.06 * headScale, 0.02]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
          </mesh>
        </>
      )}

      {/* Halo - floating ring above head */}
      {hasHalo && (
        <mesh position={[0, 0.5 * headScale, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.2 * headScale, 0.03 * headScale, 8, 24]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
        </mesh>
      )}

      {/* Horns - devil/viking style */}
      {hasHorns && (
        <>
          {/* Left horn */}
          <mesh position={[-0.15 * headScale, 0.25 * headScale, 0]} rotation={[0, 0, 0.4]} castShadow>
            <coneGeometry args={[0.05 * headScale, 0.2 * headScale, 8]} />
            <meshStandardMaterial color="#8B4513" roughness={0.7} />
          </mesh>
          {/* Right horn */}
          <mesh position={[0.15 * headScale, 0.25 * headScale, 0]} rotation={[0, 0, -0.4]} castShadow>
            <coneGeometry args={[0.05 * headScale, 0.2 * headScale, 8]} />
            <meshStandardMaterial color="#8B4513" roughness={0.7} />
          </mesh>
        </>
      )}
    </>
  );
}
