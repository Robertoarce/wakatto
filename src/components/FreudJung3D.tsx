/**
 * 3D Models of Sigmund Freud, Carl Jung, and Alfred Adler
 * Based on the rounded, toy-like "chibi" style design from the reference image.
 * Uses smooth, rounded geometries (spheres, cylinders) for a cute aesthetic.
 */

import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';

// Character component representing Freud, Jung, or Adler (Rounded/Toy Style)
function Character({ position, suitColor, hairColor, hasGlasses, hasBeard, hasMustache, isBald, name }) {
  const groupRef = useRef(null);

  // Material colors matching the reference image
  const skinColor = '#ffd4b3'; // Warm peachy skin
  const whiteColor = '#ffffff'; // Pure white for beard
  const blackColor = '#1a1a1a'; // Deep black for details
  const glassesFrameColor = '#000000'; // Black frames
  const eyeColor = '#2a2a2a'; // Dark eyes

  return (
    <group ref={groupRef} position={position}>
      {/* HEAD - Rounded sphere */}
      <mesh position={[0, 2.6, 0]}>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* EARS */}
      {/* Left ear */}
      <mesh position={[-0.65, 2.6, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>
      {/* Right ear */}
      <mesh position={[0.65, 2.6, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>

      {/* EYES */}
      {/* Left eye */}
      <mesh position={[-0.22, 2.65, 0.55]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={eyeColor} roughness={0.3} />
      </mesh>
      {/* Right eye */}
      <mesh position={[0.22, 2.65, 0.55]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={eyeColor} roughness={0.3} />
      </mesh>

      {/* EYEBROWS */}
      {/* Left eyebrow */}
      <mesh position={[-0.22, 2.75, 0.58]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.25, 0.05, 0.05]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </mesh>
      {/* Right eyebrow */}
      <mesh position={[0.22, 2.75, 0.58]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.25, 0.05, 0.05]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </mesh>

      {/* NOSE */}
      <mesh position={[0, 2.55, 0.62]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.5} />
      </mesh>

      {/* MOUTH - Simple line */}
      <mesh position={[0, 2.4, 0.6]}>
        <boxGeometry args={[0.25, 0.03, 0.03]} />
        <meshStandardMaterial color={blackColor} roughness={0.9} />
      </mesh>

      {/* GLASSES (if applicable) - Round frames */}
      {hasGlasses && (
        <>
          {/* Left lens frame */}
          <mesh position={[-0.22, 2.65, 0.6]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.18, 0.025, 16, 32]} />
            <meshStandardMaterial color={glassesFrameColor} roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Right lens frame */}
          <mesh position={[0.22, 2.65, 0.6]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.18, 0.025, 16, 32]} />
            <meshStandardMaterial color={glassesFrameColor} roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Bridge */}
          <mesh position={[0, 2.65, 0.6]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.12, 8]} />
            <meshStandardMaterial color={glassesFrameColor} roughness={0.3} />
          </mesh>
          {/* Left temple */}
          <mesh position={[-0.4, 2.65, 0.5]} rotation={[0, -Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
            <meshStandardMaterial color={glassesFrameColor} roughness={0.3} />
          </mesh>
          {/* Right temple */}
          <mesh position={[0.4, 2.65, 0.5]} rotation={[0, -Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
            <meshStandardMaterial color={glassesFrameColor} roughness={0.3} />
          </mesh>
        </>
      )}

      {/* HAIR - Top and sides (not if bald) */}
      {!isBald && (
        <>
          {/* Top hair */}
          <mesh position={[0, 3.1, 0]}>
            <sphereGeometry args={[0.68, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          {/* Left side hair */}
          <mesh position={[-0.5, 2.75, 0]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          {/* Right side hair */}
          <mesh position={[0.5, 2.75, 0]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          {/* Back hair */}
          <mesh position={[0, 2.75, -0.45]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
        </>
      )}

      {/* BALD HEAD - Just side hair for balding look */}
      {isBald && (
        <>
          {/* Left side hair - lower */}
          <mesh position={[-0.5, 2.6, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          {/* Right side hair - lower */}
          <mesh position={[0.5, 2.6, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          {/* Back hair - lower */}
          <mesh position={[0, 2.6, -0.5]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
        </>
      )}

      {/* FULL BEARD (if applicable) */}
      {hasBeard && (
        <>
          {/* Main beard - rounded */}
          <mesh position={[0, 2.25, 0.4]}>
            <sphereGeometry args={[0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI]} />
            <meshStandardMaterial color={whiteColor} roughness={0.9} />
          </mesh>
          {/* Mustache */}
          <mesh position={[0, 2.45, 0.58]} scale={[1.2, 0.5, 0.8]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color={whiteColor} roughness={0.9} />
          </mesh>
        </>
      )}

      {/* MUSTACHE ONLY (if applicable and no full beard) */}
      {hasMustache && !hasBeard && (
        <mesh position={[0, 2.45, 0.58]} scale={[1.2, 0.5, 0.8]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>
      )}

      {/* NECK */}
      <mesh position={[0, 2.05, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.28, 0.35, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>

      {/* BODY/TORSO - Rounded cylinder */}
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.65, 0.7, 1.4, 32]} />
        <meshStandardMaterial color={suitColor} roughness={0.7} />
      </mesh>

      {/* SHIRT/COLLAR visible at neck */}
      <mesh position={[0, 1.85, 0.3]}>
        <boxGeometry args={[0.5, 0.25, 0.15]} />
        <meshStandardMaterial color={whiteColor} roughness={0.5} />
      </mesh>

      {/* TIE */}
      <mesh position={[0, 1.45, 0.68]}>
        <boxGeometry args={[0.15, 0.6, 0.05]} />
        <meshStandardMaterial color={blackColor} roughness={0.8} />
      </mesh>

      {/* ARMS - Rounded cylinders */}
      {/* Left arm */}
      <mesh position={[-0.75, 1.3, 0]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.18, 0.16, 1.1, 16]} />
        <meshStandardMaterial color={suitColor} roughness={0.7} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.75, 1.3, 0]} rotation={[0, 0, -0.15]}>
        <cylinderGeometry args={[0.18, 0.16, 1.1, 16]} />
        <meshStandardMaterial color={suitColor} roughness={0.7} />
      </mesh>

      {/* HANDS - Rounded */}
      {/* Left hand */}
      <mesh position={[-0.8, 0.7, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>
      {/* Right hand */}
      <mesh position={[0.8, 0.7, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>

      {/* LEGS - Short cylinders */}
      {/* Left leg */}
      <mesh position={[-0.3, 0, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.22, 1.0, 16]} />
        <meshStandardMaterial color={suitColor} roughness={0.8} />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.3, 0, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.22, 1.0, 16]} />
        <meshStandardMaterial color={suitColor} roughness={0.8} />
      </mesh>

      {/* SHOES - Rounded boxes */}
      {/* Left shoe */}
      <mesh position={[-0.3, -0.6, 0.1]}>
        <boxGeometry args={[0.4, 0.2, 0.6]} />
        <meshStandardMaterial color={blackColor} roughness={0.8} />
      </mesh>
      {/* Right shoe */}
      <mesh position={[0.3, -0.6, 0.1]}>
        <boxGeometry args={[0.4, 0.2, 0.6]} />
        <meshStandardMaterial color={blackColor} roughness={0.8} />
      </mesh>

      {/* Name Label */}
      <Text
        position={[0, 3.6, 0]}
        fontSize={0.25}
        color={blackColor}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff"
      >
        {name}
      </Text>
    </group>
  );
}

// Platform/base for the characters to stand on
function Platform() {
  return (
    <mesh position={[0, -1.5, 0]} scale={[8, 0.2, 3]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#d4b896" roughness={0.9} />
    </mesh>
  );
}

// Main component with Freud, Jung, and Adler
export default function FreudJung3D() {
  return (
    <Canvas
      style={{ width: '100%', height: '600px', background: '#e8d4b8' }}
      gl={{ antialias: true }}
    >
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={50} />

      {/* Lighting - Soft, warm lighting to match reference */}
      <ambientLight intensity={1.2} color="#ffffff" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.8}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight
        position={[-3, 5, -3]}
        intensity={0.8}
        color="#ffefd5"
      />
      <pointLight position={[0, 3, 4]} intensity={0.6} color="#ffffff" />

      {/* Platform */}
      <Platform />

      {/* Sigmund Freud - with round glasses and white beard */}
      <Character
        name="Freud"
        position={[-2.5, 0, 0]}
        suitColor="#4a3426"
        hairColor="#f5f5f5"
        hasGlasses={true}
        hasBeard={true}
        hasMustache={false}
        isBald={false}
      />

      {/* Alfred Adler - with glasses, mustache, and balding */}
      <Character
        name="Adler"
        position={[0, 0, 0]}
        suitColor="#2c3e50"
        hairColor="#8b7355"
        hasGlasses={true}
        hasBeard={false}
        hasMustache={true}
        isBald={true}
      />

      {/* Carl Jung - no glasses, light blonde hair */}
      <Character
        name="Jung"
        position={[2.5, 0, 0]}
        suitColor="#5a5a5a"
        hairColor="#d4c4a8"
        hasGlasses={false}
        hasBeard={false}
        hasMustache={false}
        isBald={false}
      />

      {/* Orbit controls for interaction */}
      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={20}
        target={[0, 1.5, 0]}
        maxPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
}
