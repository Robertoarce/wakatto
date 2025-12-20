import React from 'react';
import { BodyConfig } from '../types';

interface BodyAccessories2Props {
  body: BodyConfig;
  hasMedal: boolean;
  hasStethoscope: boolean;
  hasBadge: boolean;
  hasDogTags: boolean;
  hasChain: boolean;
}

/**
 * Renders additional body/torso accessories.
 * Includes: medal, stethoscope, badge, dog_tags, chain
 */
export function BodyAccessories2({
  body,
  hasMedal,
  hasStethoscope,
  hasBadge,
  hasDogTags,
  hasChain,
}: BodyAccessories2Props) {
  return (
    <>
      {/* MEDAL - pinned to chest */}
      {hasMedal && (
        <>
          {/* Ribbon */}
          <mesh position={[-body.torso.width * 0.2, body.torso.y + 0.2, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.08, 0.1, 0.01]} />
            <meshStandardMaterial color="#dc2626" roughness={0.7} />
          </mesh>
          {/* Medal disc */}
          <mesh position={[-body.torso.width * 0.2, body.torso.y + 0.1, body.frontZOuter + 0.01]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.01, 16]} />
            <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Star emblem */}
          <mesh position={[-body.torso.width * 0.2, body.torso.y + 0.1, body.frontZOuter + 0.02]} castShadow>
            <boxGeometry args={[0.03, 0.03, 0.005]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
          </mesh>
        </>
      )}

      {/* STETHOSCOPE - around neck */}
      {hasStethoscope && (
        <>
          {/* Earpieces hanging */}
          <mesh position={[-0.08, body.collarY - 0.05, body.frontZ]} castShadow>
            <boxGeometry args={[0.02, 0.06, 0.02]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0.08, body.collarY - 0.05, body.frontZ]} castShadow>
            <boxGeometry args={[0.02, 0.06, 0.02]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Tubing around neck */}
          <mesh position={[0, body.collarY, body.frontZ - 0.03]} castShadow>
            <torusGeometry args={[0.12, 0.015, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
          </mesh>
          {/* Chest piece */}
          <mesh position={[0, body.torso.y + 0.05, body.frontZOuter + 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.015, 12]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Tubing to chest piece */}
          <mesh position={[0, body.torso.y + 0.15, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.015, 0.15, 0.015]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
          </mesh>
        </>
      )}

      {/* BADGE - police/sheriff style */}
      {hasBadge && (
        <>
          {/* Shield shape base */}
          <mesh position={[body.torso.width * 0.2, body.torso.y + 0.15, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.08, 0.1, 0.01]} />
            <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Star in center */}
          <mesh position={[body.torso.width * 0.2, body.torso.y + 0.15, body.frontZOuter + 0.01]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.005]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Badge number plate */}
          <mesh position={[body.torso.width * 0.2, body.torso.y + 0.08, body.frontZOuter + 0.01]} castShadow>
            <boxGeometry args={[0.05, 0.02, 0.003]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* DOG TAGS - military style */}
      {hasDogTags && (
        <>
          {/* Chain around neck */}
          <mesh position={[0, body.collarY, body.frontZ - 0.02]} castShadow>
            <torusGeometry args={[0.1, 0.008, 6, 16, Math.PI]} />
            <meshStandardMaterial color="#a0a0a0" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Tag 1 */}
          <mesh position={[-0.02, body.torso.y + 0.1, body.frontZOuter + 0.01]} castShadow>
            <boxGeometry args={[0.04, 0.06, 0.003]} />
            <meshStandardMaterial color="#a0a0a0" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Tag 2 */}
          <mesh position={[0.02, body.torso.y + 0.08, body.frontZOuter + 0.015]} castShadow>
            <boxGeometry args={[0.04, 0.06, 0.003]} />
            <meshStandardMaterial color="#a0a0a0" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Notch on tags */}
          <mesh position={[-0.02, body.torso.y + 0.125, body.frontZOuter + 0.012]} castShadow>
            <boxGeometry args={[0.01, 0.01, 0.005]} />
            <meshStandardMaterial color="#808080" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* CHAIN - hip-hop/biker style */}
      {hasChain && (
        <>
          {/* Main chain around neck */}
          <mesh position={[0, body.collarY - 0.03, body.frontZ - 0.02]} castShadow>
            <torusGeometry args={[0.15, 0.015, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#c9a227" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Pendant */}
          <mesh position={[0, body.torso.y + 0.05, body.frontZOuter + 0.02]} castShadow>
            <boxGeometry args={[0.08, 0.08, 0.015]} />
            <meshStandardMaterial color="#c9a227" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Dollar sign or emblem */}
          <mesh position={[0, body.torso.y + 0.05, body.frontZOuter + 0.03]} castShadow>
            <boxGeometry args={[0.02, 0.05, 0.005]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
          </mesh>
        </>
      )}
    </>
  );
}
