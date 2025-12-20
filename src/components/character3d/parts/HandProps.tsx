import React from 'react';
import { BodyConfig } from '../types';

interface HandPropsComponentProps {
  body: BodyConfig;
  hasSword: boolean;
  hasStaff: boolean;
  hasWand: boolean;
  hasShield: boolean;
  hasBook: boolean;
  hasGun: boolean;
  hasPortalGun: boolean;
  hasPipe: boolean;
  hasCigar: boolean;
}

/**
 * Renders props held in hands or mouth.
 * Includes: sword, staff, wand, shield, book, gun, portal_gun, pipe, cigar
 */
export function HandProps({
  body,
  hasSword,
  hasStaff,
  hasWand,
  hasShield,
  hasBook,
  hasGun,
  hasPortalGun,
  hasPipe,
  hasCigar,
}: HandPropsComponentProps) {
  return (
    <>
      {/* SWORD - held at side */}
      {hasSword && (
        <group position={[body.armX + 0.15, body.armY - 0.2, 0.1]}>
          {/* Handle */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color="#5c4a3a" roughness={0.7} />
          </mesh>
          {/* Guard */}
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.15, 0.02, 0.03]} />
            <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Blade */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[0.05, 0.5, 0.01]} />
            <meshStandardMaterial color="#d4d4d4" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Blade tip */}
          <mesh position={[0, 0.68, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
            <boxGeometry args={[0.035, 0.05, 0.01]} />
            <meshStandardMaterial color="#d4d4d4" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Pommel */}
          <mesh position={[0, -0.1, 0]} castShadow>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* STAFF - wizard/monk staff */}
      {hasStaff && (
        <group position={[-body.armX - 0.2, body.armY - 0.1, 0.1]}>
          {/* Main shaft */}
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.04, 1.0, 0.04]} />
            <meshStandardMaterial color="#5c4a3a" roughness={0.8} />
          </mesh>
          {/* Top ornament */}
          <mesh position={[0, 0.65, 0]} castShadow>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#9333ea" emissive="#9333ea" emissiveIntensity={0.3} roughness={0.3} />
          </mesh>
          {/* Crystal holder */}
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[0.08, 0.05, 0.08]} />
            <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Bottom cap */}
          <mesh position={[0, -0.4, 0]} castShadow>
            <boxGeometry args={[0.05, 0.03, 0.05]} />
            <meshStandardMaterial color="#3a2a1a" roughness={0.7} />
          </mesh>
        </group>
      )}

      {/* WAND - small magical wand */}
      {hasWand && (
        <group position={[body.armX + 0.05, body.armY - 0.35, 0.15]} rotation={[0.3, 0, -0.5]}>
          {/* Handle */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.025, 0.12, 0.025]} />
            <meshStandardMaterial color="#5c4a3a" roughness={0.7} />
          </mesh>
          {/* Shaft */}
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[0.02, 0.2, 0.02]} />
            <meshStandardMaterial color="#8B7355" roughness={0.6} />
          </mesh>
          {/* Tip glow */}
          <mesh position={[0, 0.28, 0]} castShadow>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}

      {/* SHIELD - held on left arm */}
      {hasShield && (
        <group position={[-body.armX - 0.2, body.armY - 0.15, 0.15]}>
          {/* Main shield body */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.02, 0.35, 0.3]} />
            <meshStandardMaterial color="#6b7280" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Shield boss (center) */}
          <mesh position={[0.02, 0, 0]} castShadow>
            <sphereGeometry args={[0.05, 8, 8, 0, Math.PI]} />
            <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Rim */}
          <mesh position={[0.01, 0, 0]} castShadow>
            <torusGeometry args={[0.15, 0.015, 8, 16]} />
            <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* BOOK - held in hand */}
      {hasBook && (
        <group position={[-body.armX - 0.1, body.armY - 0.25, 0.2]} rotation={[0, 0.3, 0]}>
          {/* Book cover */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.12, 0.16, 0.03]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
          {/* Pages */}
          <mesh position={[0, 0, 0.018]} castShadow>
            <boxGeometry args={[0.1, 0.14, 0.02]} />
            <meshStandardMaterial color="#f5f5dc" roughness={0.9} />
          </mesh>
          {/* Spine detail */}
          <mesh position={[-0.065, 0, 0]} castShadow>
            <boxGeometry args={[0.01, 0.16, 0.035]} />
            <meshStandardMaterial color="#654321" roughness={0.7} />
          </mesh>
          {/* Gold emblem */}
          <mesh position={[0, 0, -0.02]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.005]} />
            <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      )}

      {/* GUN - holstered or held */}
      {hasGun && (
        <group position={[body.armX + 0.1, body.armY - 0.3, 0.12]} rotation={[0, 0, -0.2]}>
          {/* Handle */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.03, 0.1, 0.025]} />
            <meshStandardMaterial color="#5c4a3a" roughness={0.7} />
          </mesh>
          {/* Barrel */}
          <mesh position={[0, 0.08, 0.04]} castShadow>
            <boxGeometry args={[0.025, 0.06, 0.12]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Trigger guard */}
          <mesh position={[0, 0.02, 0.02]} castShadow>
            <boxGeometry args={[0.02, 0.04, 0.03]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      )}

      {/* PORTAL GUN - Rick Sanchez style */}
      {hasPortalGun && (
        <group position={[body.armX + 0.05, body.armY - 0.3, 0.2]} rotation={[0, -0.3, -0.3]}>
          {/* Main body */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.06, 0.15]} />
            <meshStandardMaterial color="#a0a0a0" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Barrel */}
          <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 0.1, 8]} />
            <meshStandardMaterial color="#606060" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Portal opening - glowing green */}
          <mesh position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
            <meshStandardMaterial color="#22ff22" emissive="#22ff22" emissiveIntensity={0.8} />
          </mesh>
          {/* Handle */}
          <mesh position={[0, -0.06, -0.02]} castShadow>
            <boxGeometry args={[0.04, 0.08, 0.04]} />
            <meshStandardMaterial color="#5a5a5a" roughness={0.6} />
          </mesh>
          {/* Side tubes */}
          <mesh position={[0.05, 0.02, 0.05]} castShadow>
            <cylinderGeometry args={[0.01, 0.01, 0.08, 6]} />
            <meshStandardMaterial color="#22ff22" emissive="#22ff22" emissiveIntensity={0.4} transparent opacity={0.8} />
          </mesh>
          <mesh position={[-0.05, 0.02, 0.05]} castShadow>
            <cylinderGeometry args={[0.01, 0.01, 0.08, 6]} />
            <meshStandardMaterial color="#22ff22" emissive="#22ff22" emissiveIntensity={0.4} transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {/* PIPE - smoking pipe in mouth */}
      {hasPipe && (
        <group position={[0.08, 0.02, 0.28]} rotation={[0.3, 0.3, 0]}>
          {/* Bowl */}
          <mesh position={[0, 0.03, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.02, 0.05, 8]} />
            <meshStandardMaterial color="#5c4a3a" roughness={0.7} />
          </mesh>
          {/* Stem */}
          <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.1, 6]} />
            <meshStandardMaterial color="#3a2a1a" roughness={0.6} />
          </mesh>
          {/* Mouthpiece */}
          <mesh position={[0, -0.01, 0.1]} castShadow>
            <boxGeometry args={[0.015, 0.01, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* CIGAR - in mouth */}
      {hasCigar && (
        <group position={[0.1, 0, 0.28]} rotation={[0, 0.4, 0.1]}>
          {/* Main cigar body */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.012, 0.015, 0.12, 8]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
          {/* Burning tip */}
          <mesh position={[0.07, 0, 0]} castShadow>
            <sphereGeometry args={[0.015, 6, 6]} />
            <meshStandardMaterial color="#ff4500" emissive="#ff4500" emissiveIntensity={0.5} />
          </mesh>
          {/* Ash */}
          <mesh position={[0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.013, 0.012, 0.02, 6]} />
            <meshStandardMaterial color="#808080" roughness={0.9} />
          </mesh>
        </group>
      )}
    </>
  );
}
