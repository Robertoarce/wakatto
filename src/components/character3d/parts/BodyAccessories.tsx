import React from 'react';
import { BodyConfig } from '../types';

// Parrot scale factor - adjust to make parrot bigger/smaller
const PARROT_SCALE = 3;

// Lion scale factor - adjust to make lion bigger/smaller
const LION_SCALE = 2.5;

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
  hasLion: boolean;
  hasLabCoat: boolean;
  hasToga: boolean;
}

/**
 * Renders body accessories that go on/around the torso.
 * Includes: suspenders, necklace, backpack, wings, cane, parrot, wheelchair, lion
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
  hasLion,
  hasLabCoat,
  hasToga,
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

      {/* MOTORIZED WHEELCHAIR - Stephen Hawking style with computer/voice synthesizer */}
      {hasWheelchair && (
        <group position={[0, body.torsoBottom - 0.2, 0]}>
          {/* === MAIN CHAIR FRAME === */}
          {/* Seat - padded motorized wheelchair seat */}
          <mesh position={[0, 0.05, 0.02]} castShadow>
            <boxGeometry args={[body.torso.width * 0.75, 0.1, body.torso.width * 0.7]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          {/* Seat cushion */}
          <mesh position={[0, 0.11, 0.02]} castShadow>
            <boxGeometry args={[body.torso.width * 0.7, 0.04, body.torso.width * 0.65]} />
            <meshStandardMaterial color="#2d2d2d" roughness={0.9} />
          </mesh>
          
          {/* High backrest with head support */}
          <mesh position={[0, 0.35, -body.torso.width * 0.32]} castShadow>
            <boxGeometry args={[body.torso.width * 0.72, 0.6, 0.08]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          {/* Backrest cushion */}
          <mesh position={[0, 0.35, -body.torso.width * 0.27]} castShadow>
            <boxGeometry args={[body.torso.width * 0.65, 0.55, 0.04]} />
            <meshStandardMaterial color="#2d2d2d" roughness={0.9} />
          </mesh>
          {/* Headrest */}
          <mesh position={[0, 0.72, -body.torso.width * 0.3]} castShadow>
            <boxGeometry args={[body.torso.width * 0.4, 0.15, 0.1]} />
            <meshStandardMaterial color="#2d2d2d" roughness={0.9} />
          </mesh>
          
          {/* === ARMRESTS WITH CONTROLS === */}
          {/* Left armrest */}
          <mesh position={[-body.torso.width * 0.42, 0.2, 0]} castShadow>
            <boxGeometry args={[0.08, 0.06, body.torso.width * 0.5]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
          </mesh>
          {/* Right armrest */}
          <mesh position={[body.torso.width * 0.42, 0.2, 0]} castShadow>
            <boxGeometry args={[0.08, 0.06, body.torso.width * 0.5]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
          </mesh>
          {/* Right armrest joystick control */}
          <mesh position={[body.torso.width * 0.42, 0.24, body.torso.width * 0.15]} castShadow>
            <boxGeometry args={[0.06, 0.04, 0.08]} />
            <meshStandardMaterial color="#333333" roughness={0.6} />
          </mesh>
          {/* Joystick */}
          <mesh position={[body.torso.width * 0.42, 0.28, body.torso.width * 0.15]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.05, 8]} />
            <meshStandardMaterial color="#dc2626" roughness={0.5} />
          </mesh>
          
          {/* === COMPUTER SCREEN MOUNT - Hawking's voice synthesizer === */}
          {/* Screen arm */}
          <mesh position={[body.torso.width * 0.5, 0.35, body.torso.width * 0.1]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.25]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Screen arm vertical */}
          <mesh position={[body.torso.width * 0.5, 0.5, body.torso.width * 0.22]} castShadow>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Screen frame */}
          <mesh position={[body.torso.width * 0.48, 0.65, body.torso.width * 0.32]} castShadow>
            <boxGeometry args={[0.25, 0.18, 0.04]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
          </mesh>
          {/* Screen display (glowing) */}
          <mesh position={[body.torso.width * 0.48, 0.65, body.torso.width * 0.35]} castShadow>
            <boxGeometry args={[0.22, 0.14, 0.01]} />
            <meshStandardMaterial color="#1e3a5f" emissive="#1e88e5" emissiveIntensity={0.4} roughness={0.3} />
          </mesh>
          {/* Text lines on screen (representing voice output) */}
          <mesh position={[body.torso.width * 0.48, 0.67, body.torso.width * 0.36]} castShadow>
            <boxGeometry args={[0.18, 0.015, 0.005]} />
            <meshStandardMaterial color="#64b5f6" emissive="#64b5f6" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[body.torso.width * 0.48, 0.645, body.torso.width * 0.36]} castShadow>
            <boxGeometry args={[0.14, 0.015, 0.005]} />
            <meshStandardMaterial color="#64b5f6" emissive="#64b5f6" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[body.torso.width * 0.48, 0.62, body.torso.width * 0.36]} castShadow>
            <boxGeometry args={[0.16, 0.015, 0.005]} />
            <meshStandardMaterial color="#64b5f6" emissive="#64b5f6" emissiveIntensity={0.5} />
          </mesh>
          
          {/* === MOTORIZED BASE === */}
          {/* Motor housing - front */}
          <mesh position={[0, -0.08, body.torso.width * 0.35]} castShadow>
            <boxGeometry args={[body.torso.width * 0.8, 0.12, 0.15]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
          </mesh>
          {/* Motor housing - back */}
          <mesh position={[0, -0.08, -body.torso.width * 0.2]} castShadow>
            <boxGeometry args={[body.torso.width * 0.6, 0.12, 0.2]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
          </mesh>
          {/* Battery pack indicator */}
          <mesh position={[-body.torso.width * 0.25, -0.02, -body.torso.width * 0.2]} castShadow>
            <boxGeometry args={[0.08, 0.04, 0.15]} />
            <meshStandardMaterial color="#059669" emissive="#059669" emissiveIntensity={0.3} />
          </mesh>
          
          {/* === WHEELS === */}
          {/* Large back wheels (motorized) */}
          <group position={[-body.torso.width * 0.45, -0.1, -body.torso.width * 0.1]}>
            {/* Tire */}
            <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
              <torusGeometry args={[0.18, 0.05, 12, 24]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
            {/* Wheel hub */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Hub cap */}
            <mesh position={[-0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
              <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
          <group position={[body.torso.width * 0.45, -0.1, -body.torso.width * 0.1]}>
            {/* Tire */}
            <mesh rotation={[0,Math.PI / 2, 0]} castShadow>
              <torusGeometry args={[0.18, 0.05, 12, 24]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
            {/* Wheel hub */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Hub cap */}
            <mesh position={[0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
              <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
          
          {/* Small front caster wheels */}
          <group position={[-body.torso.width * 0.3, -0.18, body.torso.width * 0.4]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[0.06, 0.025, 8, 16]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
            </mesh>
            {/* Caster fork */}
            <mesh position={[0, 0.08, 0]} castShadow>
              <boxGeometry args={[0.03, 0.1, 0.03]} />
              <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.5} />
            </mesh>
          </group>
          <group position={[body.torso.width * 0.3, -0.18, body.torso.width * 0.4]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[0.06, 0.025, 8, 16]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
            </mesh>
            {/* Caster fork */}
            <mesh position={[0, 0.08, 0]} castShadow>
              <boxGeometry args={[0.03, 0.1, 0.03]} />
              <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.5} />
            </mesh>
          </group>
          
          {/* === FOOTREST === */}
          <mesh position={[0, -0.15, body.torso.width * 0.55]} castShadow>
            <boxGeometry args={[body.torso.width * 0.55, 0.04, 0.15]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
          </mesh>
          {/* Footrest support bars */}
          <mesh position={[-body.torso.width * 0.2, -0.08, body.torso.width * 0.48]} rotation={[0.3, 0, 0]} castShadow>
            <boxGeometry args={[0.03, 0.15, 0.03]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[body.torso.width * 0.2, -0.08, body.torso.width * 0.48]} rotation={[0.3, 0, 0]} castShadow>
            <boxGeometry args={[0.03, 0.15, 0.03]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* LION - Majestic companion */}
      {hasLion && (
        <group position={[body.armX + 0.2 * LION_SCALE, body.legY - 0.3, 0.1]}>
          {/* Body */}
          <mesh position={[0, 0.15 * LION_SCALE, 0]} castShadow>
            <boxGeometry args={[0.25 * LION_SCALE, 0.2 * LION_SCALE, 0.4 * LION_SCALE]} />
            <meshStandardMaterial color="#c9a227" roughness={0.7} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.25 * LION_SCALE, 0.22 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.18 * LION_SCALE, 0.18 * LION_SCALE, 0.15 * LION_SCALE]} />
            <meshStandardMaterial color="#c9a227" roughness={0.7} />
          </mesh>
          {/* Mane - top */}
          <mesh position={[0, 0.35 * LION_SCALE, 0.18 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.24 * LION_SCALE, 0.08 * LION_SCALE, 0.2 * LION_SCALE]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>
          {/* Mane - left side */}
          <mesh position={[-0.12 * LION_SCALE, 0.25 * LION_SCALE, 0.18 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.06 * LION_SCALE, 0.2 * LION_SCALE, 0.18 * LION_SCALE]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>
          {/* Mane - right side */}
          <mesh position={[0.12 * LION_SCALE, 0.25 * LION_SCALE, 0.18 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.06 * LION_SCALE, 0.2 * LION_SCALE, 0.18 * LION_SCALE]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>
          {/* Mane - bottom (chin) */}
          <mesh position={[0, 0.15 * LION_SCALE, 0.25 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.14 * LION_SCALE, 0.08 * LION_SCALE, 0.1 * LION_SCALE]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>
          {/* Snout */}
          <mesh position={[0, 0.22 * LION_SCALE, 0.32 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.1 * LION_SCALE, 0.08 * LION_SCALE, 0.06 * LION_SCALE]} />
            <meshStandardMaterial color="#d4a84b" roughness={0.6} />
          </mesh>
          {/* Nose */}
          <mesh position={[0, 0.24 * LION_SCALE, 0.36 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.04 * LION_SCALE, 0.03 * LION_SCALE, 0.02 * LION_SCALE]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          {/* Eyes - left */}
          <mesh position={[-0.05 * LION_SCALE, 0.28 * LION_SCALE, 0.29 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.03 * LION_SCALE, 0.03 * LION_SCALE, 0.02 * LION_SCALE]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
          {/* Eyes - right */}
          <mesh position={[0.05 * LION_SCALE, 0.28 * LION_SCALE, 0.29 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.03 * LION_SCALE, 0.03 * LION_SCALE, 0.02 * LION_SCALE]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
          {/* Ears - left */}
          <mesh position={[-0.08 * LION_SCALE, 0.36 * LION_SCALE, 0.15 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.05 * LION_SCALE, 0.06 * LION_SCALE, 0.03 * LION_SCALE]} />
            <meshStandardMaterial color="#c9a227" roughness={0.7} />
          </mesh>
          {/* Ears - right */}
          <mesh position={[0.08 * LION_SCALE, 0.36 * LION_SCALE, 0.15 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.05 * LION_SCALE, 0.06 * LION_SCALE, 0.03 * LION_SCALE]} />
            <meshStandardMaterial color="#c9a227" roughness={0.7} />
          </mesh>
          {/* Front legs */}
          <mesh position={[-0.08 * LION_SCALE, 0, 0.12 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.06 * LION_SCALE, 0.15 * LION_SCALE, 0.06 * LION_SCALE]} />
            <meshStandardMaterial color="#c9a227" roughness={0.7} />
          </mesh>
          <mesh position={[0.08 * LION_SCALE, 0, 0.12 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.06 * LION_SCALE, 0.15 * LION_SCALE, 0.06 * LION_SCALE]} />
            <meshStandardMaterial color="#c9a227" roughness={0.7} />
          </mesh>
          {/* Back legs */}
          <mesh position={[-0.08 * LION_SCALE, 0, -0.12 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.06 * LION_SCALE, 0.15 * LION_SCALE, 0.06 * LION_SCALE]} />
            <meshStandardMaterial color="#c9a227" roughness={0.7} />
          </mesh>
          <mesh position={[0.08 * LION_SCALE, 0, -0.12 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.06 * LION_SCALE, 0.15 * LION_SCALE, 0.06 * LION_SCALE]} />
            <meshStandardMaterial color="#c9a227" roughness={0.7} />
          </mesh>
          {/* Tail */}
          <mesh position={[0, 0.18 * LION_SCALE, -0.25 * LION_SCALE]} rotation={[0.5, 0, 0]} castShadow>
            <boxGeometry args={[0.04 * LION_SCALE, 0.04 * LION_SCALE, 0.2 * LION_SCALE]} />
            <meshStandardMaterial color="#c9a227" roughness={0.7} />
          </mesh>
          {/* Tail tuft */}
          <mesh position={[0, 0.24 * LION_SCALE, -0.38 * LION_SCALE]} castShadow>
            <boxGeometry args={[0.06 * LION_SCALE, 0.06 * LION_SCALE, 0.06 * LION_SCALE]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* LAB COAT - Long white scientist coat */}
      {hasLabCoat && (
        <>
          {/* Main coat body - back panel (long, extends past hips) */}
          <mesh position={[0, body.torso.y - 0.25, body.backZ - 0.02]} castShadow>
            <boxGeometry args={[body.torso.width * 1.15, body.torso.height * 1.8, 0.03]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
          </mesh>
          {/* Left front panel (open coat style) */}
          <mesh position={[-body.torso.width * 0.35, body.torso.y - 0.25, body.frontZ + 0.02]} castShadow>
            <boxGeometry args={[body.torso.width * 0.35, body.torso.height * 1.8, 0.03]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
          </mesh>
          {/* Right front panel (open coat style) */}
          <mesh position={[body.torso.width * 0.35, body.torso.y - 0.25, body.frontZ + 0.02]} castShadow>
            <boxGeometry args={[body.torso.width * 0.35, body.torso.height * 1.8, 0.03]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
          </mesh>
          {/* Left side panel */}
          <mesh position={[-body.torso.width * 0.55, body.torso.y - 0.25, 0]} castShadow>
            <boxGeometry args={[0.03, body.torso.height * 1.8, body.torso.depth * 0.9]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
          </mesh>
          {/* Right side panel */}
          <mesh position={[body.torso.width * 0.55, body.torso.y - 0.25, 0]} castShadow>
            <boxGeometry args={[0.03, body.torso.height * 1.8, body.torso.depth * 0.9]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
          </mesh>
          {/* Collar - left */}
          <mesh position={[-body.torso.width * 0.22, body.collarY + 0.05, body.frontZ + 0.04]} rotation={[0, 0, 0.3]} castShadow>
            <boxGeometry args={[0.12, 0.15, 0.03]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
          </mesh>
          {/* Collar - right */}
          <mesh position={[body.torso.width * 0.22, body.collarY + 0.05, body.frontZ + 0.04]} rotation={[0, 0, -0.3]} castShadow>
            <boxGeometry args={[0.12, 0.15, 0.03]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
          </mesh>
          {/* Sleeves are now rendered inside arm groups in CharacterDisplay3D.tsx */}
          {/* Pocket - left */}
          <mesh position={[-body.torso.width * 0.25, body.torso.y - 0.15, body.frontZ + 0.04]} castShadow>
            <boxGeometry args={[0.12, 0.1, 0.02]} />
            <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
          </mesh>
          {/* Pocket - right */}
          <mesh position={[body.torso.width * 0.25, body.torso.y - 0.15, body.frontZ + 0.04]} castShadow>
            <boxGeometry args={[0.12, 0.1, 0.02]} />
            <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
          </mesh>
          {/* Breast pocket (for pens) */}
          <mesh position={[-body.torso.width * 0.25, body.torso.y + 0.2, body.frontZ + 0.04]} castShadow>
            <boxGeometry args={[0.08, 0.06, 0.02]} />
            <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
          </mesh>
          {/* Pen in pocket */}
          <mesh position={[-body.torso.width * 0.25, body.torso.y + 0.24, body.frontZ + 0.05]} castShadow>
            <boxGeometry args={[0.015, 0.08, 0.015]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* TOGA - Ancient Greek/Roman garment */}
      {hasToga && (
        <>
          {/* Main toga drape - wraps around body */}
          <mesh position={[0, body.torso.y - 0.1, body.frontZ + 0.02]} castShadow>
            <boxGeometry args={[body.torso.width * 1.1, body.torso.height * 1.4, 0.03]} />
            <meshStandardMaterial color="#f5f5dc" roughness={0.85} />
          </mesh>
          {/* Back panel */}
          <mesh position={[0, body.torso.y - 0.1, body.backZ - 0.02]} castShadow>
            <boxGeometry args={[body.torso.width * 1.1, body.torso.height * 1.4, 0.03]} />
            <meshStandardMaterial color="#f5f5dc" roughness={0.85} />
          </mesh>
          {/* Left side wrap */}
          <mesh position={[-body.torso.width * 0.53, body.torso.y - 0.1, 0]} castShadow>
            <boxGeometry args={[0.04, body.torso.height * 1.4, body.torso.depth * 0.95]} />
            <meshStandardMaterial color="#f5f5dc" roughness={0.85} />
          </mesh>
          {/* Shoulder drape - over left shoulder diagonally */}
          <mesh position={[-body.torso.width * 0.25, body.torso.y + 0.25, body.frontZ + 0.04]} rotation={[0, 0, 0.5]} castShadow>
            <boxGeometry args={[0.18, body.torso.height * 0.9, 0.03]} />
            <meshStandardMaterial color="#f5f5dc" roughness={0.85} />
          </mesh>
          {/* Shoulder drape back */}
          <mesh position={[-body.torso.width * 0.2, body.torso.y + 0.1, body.backZ - 0.03]} rotation={[0, 0, -0.3]} castShadow>
            <boxGeometry args={[0.15, body.torso.height * 0.8, 0.03]} />
            <meshStandardMaterial color="#f5f5dc" roughness={0.85} />
          </mesh>
          {/* Decorative gold border at bottom hem */}
          <mesh position={[0, body.torsoBottom - 0.35, body.frontZ + 0.04]} castShadow>
            <boxGeometry args={[body.torso.width * 1.05, 0.04, 0.02]} />
            <meshStandardMaterial color="#c9a227" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Decorative gold border on shoulder drape */}
          <mesh position={[-body.torso.width * 0.35, body.shoulderY, body.frontZ + 0.05]} rotation={[0, 0, 0.5]} castShadow>
            <boxGeometry args={[0.03, 0.25, 0.015]} />
            <meshStandardMaterial color="#c9a227" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Fibula brooch pin at shoulder */}
          <mesh position={[-body.torso.width * 0.2, body.shoulderY + 0.08, body.frontZ + 0.06]} castShadow>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
          </mesh>
        </>
      )}
    </>
  );
}
