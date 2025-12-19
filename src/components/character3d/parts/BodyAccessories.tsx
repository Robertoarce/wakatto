import React from 'react';
import { BodyConfig } from '../types';

// Parrot scale factor - adjust to make parrot bigger/smaller
const PARROT_SCALE = 3;

interface BodyAccessoriesProps {
  body: BodyConfig;
  accessoryColor: string;
  hasSuspenders: boolean;
  hasNecklace: boolean;
  hasBackpack: boolean;
  hasWings: boolean;
  hasCane: boolean;
  hasParrot: boolean;
  hasWheelchair: boolean;
}

/**
 * Renders body accessories that go on/around the torso.
 * Includes: suspenders, necklace, backpack, wings, cane, parrot, wheelchair
 */
export function BodyAccessories({
  body,
  accessoryColor,
  hasSuspenders,
  hasNecklace,
  hasBackpack,
  hasWings,
  hasCane,
  hasParrot,
  hasWheelchair,
}: BodyAccessoriesProps) {
  return (
    <>
      {/* Suspenders */}
      {hasSuspenders && (
        <>
          {/* Left suspender - front */}
          <mesh position={[-body.torso.width * 0.24, body.torso.y + 0.05, body.frontZOuter - 0.02]} castShadow>
            <boxGeometry args={[0.06, body.torso.height * 0.86, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.8} />
          </mesh>
          {/* Right suspender - front */}
          <mesh position={[body.torso.width * 0.24, body.torso.y + 0.05, body.frontZOuter - 0.02]} castShadow>
            <boxGeometry args={[0.06, body.torso.height * 0.86, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.8} />
          </mesh>
          {/* Left suspender - back */}
          <mesh position={[-body.torso.width * 0.24, body.torso.y + 0.05, body.backZ + 0.03]} castShadow>
            <boxGeometry args={[0.06, body.torso.height * 0.86, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.8} />
          </mesh>
          {/* Right suspender - back */}
          <mesh position={[body.torso.width * 0.24, body.torso.y + 0.05, body.backZ + 0.03]} castShadow>
            <boxGeometry args={[0.06, body.torso.height * 0.86, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.8} />
          </mesh>
          {/* Connector clips */}
          <mesh position={[-body.torso.width * 0.24, body.torsoBottom + 0.1, body.frontZOuter - 0.01]} castShadow>
            <boxGeometry args={[0.08, 0.05, 0.02]} />
            <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[body.torso.width * 0.24, body.torsoBottom + 0.1, body.frontZOuter - 0.01]} castShadow>
            <boxGeometry args={[0.08, 0.05, 0.02]} />
            <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.3} />
          </mesh>
        </>
      )}

      {/* Necklace */}
      {hasNecklace && (
        <>
          {/* Chain around neck */}
          <mesh position={[0, body.collarY, body.frontZ - 0.04]} castShadow>
            <torusGeometry args={[0.15, 0.015, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Pendant */}
          <mesh position={[0, body.torso.y + 0.17, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.08, 0.1, 0.02]} />
            <meshStandardMaterial color={accessoryColor} metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Gem in pendant */}
          <mesh position={[0, body.torso.y + 0.17, body.frontZOuter + 0.02]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#e91e63" metalness={0.3} roughness={0.2} />
          </mesh>
        </>
      )}

      {/* Backpack */}
      {hasBackpack && (
        <>
          {/* Main bag body */}
          <mesh position={[0, body.torso.y - 0.05, body.backZOuter - 0.1]} castShadow>
            <boxGeometry args={[body.torso.width * 0.67, body.torso.height * 0.86, 0.25]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.8} />
          </mesh>
          {/* Top flap */}
          <mesh position={[0, body.torsoTop - 0.08, body.backZOuter - 0.05]} castShadow>
            <boxGeometry args={[body.torso.width * 0.64, 0.08, 0.3]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.8} />
          </mesh>
          {/* Front pocket */}
          <mesh position={[0, body.torso.y - 0.15, body.backZOuter + 0.03]} castShadow>
            <boxGeometry args={[body.torso.width * 0.47, 0.3, 0.04]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.8} />
          </mesh>
          {/* Straps - left */}
          <mesh position={[-body.torso.width * 0.2, body.torso.y, body.torsoBack + 0.15]} castShadow>
            <boxGeometry args={[0.08, body.torso.height * 0.79, 0.04]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.8} />
          </mesh>
          {/* Straps - right */}
          <mesh position={[body.torso.width * 0.2, body.torso.y, body.torsoBack + 0.15]} castShadow>
            <boxGeometry args={[0.08, body.torso.height * 0.79, 0.04]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.8} />
          </mesh>
          {/* Buckles */}
          <mesh position={[-body.torso.width * 0.2, body.torsoBottom + 0.1, body.frontZ - 0.05]} castShadow>
            <boxGeometry args={[0.06, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
          <mesh position={[body.torso.width * 0.2, body.torsoBottom + 0.1, body.frontZ - 0.05]} castShadow>
            <boxGeometry args={[0.06, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* Wings */}
      {hasWings && (
        <>
          {/* Left wing - main */}
          <mesh position={[-body.armX - 0.05, body.torso.y + 0.1, body.torsoBack + 0.05]} rotation={[0, 0.3, 0.2]} castShadow>
            <boxGeometry args={[body.torso.width * 0.67, body.torso.height, 0.03]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.6} transparent opacity={0.9} />
          </mesh>
          {/* Left wing - secondary feathers */}
          <mesh position={[-body.armX - 0.2, body.torso.y - 0.05, body.torsoBack + 0.02]} rotation={[0, 0.4, 0.3]} castShadow>
            <boxGeometry args={[body.torso.width * 0.47, body.torso.height * 0.71, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.6} transparent opacity={0.85} />
          </mesh>
          {/* Right wing - main */}
          <mesh position={[body.armX + 0.05, body.torso.y + 0.1, body.torsoBack + 0.05]} rotation={[0, -0.3, -0.2]} castShadow>
            <boxGeometry args={[body.torso.width * 0.67, body.torso.height, 0.03]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.6} transparent opacity={0.9} />
          </mesh>
          {/* Right wing - secondary feathers */}
          <mesh position={[body.armX + 0.2, body.torso.y - 0.05, body.torsoBack + 0.02]} rotation={[0, -0.4, -0.3]} castShadow>
            <boxGeometry args={[body.torso.width * 0.47, body.torso.height * 0.71, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.6} transparent opacity={0.85} />
          </mesh>
        </>
      )}

      {/* CANE - Walking stick */}
      {hasCane && (
        <group position={[body.armX - 0.25, body.armY - 0.05, body.torsoFront * 0.25]}>
          {/* Main shaft */}
          <mesh position={[0, -0.15, 0]} castShadow>
            <boxGeometry args={[0.03, 0.6, 0.03]} />
            <meshStandardMaterial color="#5c4a3a" roughness={0.6} />
          </mesh>
          {/* Curved handle at top */}
          <mesh position={[0, 0.15, -0.04]} rotation={[Math.PI / 4, 0, 0]} castShadow>
            <boxGeometry args={[0.03, 0.12, 0.03]} />
            <meshStandardMaterial color="#5c4a3a" roughness={0.6} />
          </mesh>
          {/* Rubber tip at bottom */}
          <mesh position={[0, -0.46, 0]} castShadow>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* PARROT - Pirate's companion */}
      {hasParrot && (
        <group position={[-body.armX - 0.02*PARROT_SCALE, body.shoulderY + 0.3, 0]}>
          {/* Body */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.08 * PARROT_SCALE, 0.12 * PARROT_SCALE, 0.08 * PARROT_SCALE]} />
            <meshStandardMaterial color="#e74c3c" roughness={0.6} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.08 * PARROT_SCALE, 0.02 * PARROT_SCALE]} castShadow>
            <boxGeometry args={[0.06 * PARROT_SCALE, 0.06 * PARROT_SCALE, 0.06 * PARROT_SCALE]} />
            <meshStandardMaterial color="#e74c3c" roughness={0.6} />
          </mesh>
          {/* Beak */}
          <mesh position={[0, 0.08 * PARROT_SCALE, 0.06 * PARROT_SCALE]} castShadow>
            <boxGeometry args={[0.03 * PARROT_SCALE, 0.02 * PARROT_SCALE, 0.04 * PARROT_SCALE]} />
            <meshStandardMaterial color="#f39c12" roughness={0.7} />
          </mesh>
          {/* Tail feathers */}
          <mesh position={[0, -0.08 * PARROT_SCALE, -0.06 * PARROT_SCALE]} rotation={[Math.PI / 6, 0, 0]} castShadow>
            <boxGeometry args={[0.06 * PARROT_SCALE, 0.12 * PARROT_SCALE, 0.02 * PARROT_SCALE]} />
            <meshStandardMaterial color="#3498db" roughness={0.6} />
          </mesh>
          {/* Wing */}
          <mesh position={[-0.05 * PARROT_SCALE, 0, 0]} rotation={[Math.PI / 6, Math.PI / 4, -Math.PI / 4]} castShadow>
            <boxGeometry args={[0.04 * PARROT_SCALE, 0.08 * PARROT_SCALE, 0.02 * PARROT_SCALE]} />
            <meshStandardMaterial color="#2ecc71" roughness={0.6} />
          </mesh>
           <mesh position={[+0.05 * PARROT_SCALE, 0, 0]} rotation={[Math.PI / 6, -Math.PI /4, Math.PI / 4]} castShadow>
            <boxGeometry args={[0.04 * PARROT_SCALE, 0.08 * PARROT_SCALE, 0.02 * PARROT_SCALE]} />
            <meshStandardMaterial color="#2ecc71" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* WHEELCHAIR - Full wheelchair model */}
      {hasWheelchair && (
        <group position={[0, body.torsoBottom - 0.2, 0]}>
          {/* Seat */}
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[body.torso.width * 0.67, 0.08, body.torso.width * 0.67]} />
            <meshStandardMaterial color="#2c2c2c" roughness={0.7} />
          </mesh>
          {/* Backrest */}
          <mesh position={[0, 0.25, -body.torso.width * 0.27]} castShadow>
            <boxGeometry args={[body.torso.width * 0.67, 0.4, 0.05]} />
            <meshStandardMaterial color="#2c2c2c" roughness={0.7} />
          </mesh>
          {/* Left wheel */}
          <group position={[-body.torso.width * 0.37, -0.05, body.torso.width * 0.13]}>
            <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
              <torusGeometry args={[0.15, 0.03, 8, 16]} />
              <meshStandardMaterial color="#3a3a3a" roughness={0.5} />
            </mesh>
            {/* Spokes */}
            <mesh rotation={[0, 0, 0]}>
              <boxGeometry args={[0.02, 0.24, 0.02]} />
              <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.02, 0.24, 0.02]} />
              <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
          {/* Right wheel */}
          <group position={[body.torso.width * 0.37, -0.05, body.torso.width * 0.13]}>
            <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
              <torusGeometry args={[0.15, 0.03, 8, 16]} />
              <meshStandardMaterial color="#3a3a3a" roughness={0.5} />
            </mesh>
            {/* Spokes */}
            <mesh rotation={[0, 0, 0]}>
              <boxGeometry args={[0.02, 0.24, 0.02]} />
              <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.02, 0.24, 0.02]} />
              <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
          {/* Front caster wheels */}
          <mesh position={[-body.torso.width * 0.27, -0.15, body.torso.width * 0.47]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[0.06, 0.02, 6, 12]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.5} />
          </mesh>
          <mesh position={[body.torso.width * 0.27, -0.15, body.torso.width * 0.47]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[0.06, 0.02, 6, 12]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.5} />
          </mesh>
          {/* Frame */}
          <mesh position={[0, 0.05, body.torso.width * 0.33]} castShadow>
            <boxGeometry args={[body.torso.width * 0.67, 0.03, 0.03]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      )}
    </>
  );
}
