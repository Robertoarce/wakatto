import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { getCharacter, CharacterBehavior } from '../config/characters';

export type AnimationState = 'idle' | 'thinking' | 'talking' | 'confused' | 'happy' | 'excited' | 'winning' | 'walking' | 'jump' | 'surprise_jump' | 'surprise_happy';

interface CharacterDisplay3DProps {
  characterId: string;
  isActive?: boolean;
  animation?: AnimationState;
}

// Blocky Minecraft-style character component
function Character({ character, isActive, animation = 'idle' }: { character: CharacterBehavior; isActive: boolean; animation?: AnimationState }) {
  const meshRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  // Animation system
  React.useEffect(() => {
    if (!meshRef.current || !headRef.current) return;

    let animationId: number;
    const animate = () => {
      const time = Date.now() * 0.001;

      // Reset to default positions
      if (meshRef.current) meshRef.current.position.y = 0;
      if (headRef.current) {
        headRef.current.rotation.x = 0;
        headRef.current.rotation.y = 0;
        headRef.current.rotation.z = 0;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0;
        leftArmRef.current.rotation.z = 0;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.z = 0;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;

      // Apply animation based on state
      switch (animation) {
        case 'idle':
          if (meshRef.current) {
            meshRef.current.position.y = Math.sin(time * 0.5) * 0.05;
          }
          if (headRef.current && isActive) {
            headRef.current.rotation.y = Math.sin(time * 1.5) * 0.15;
          }
          break;

        case 'thinking':
          // Hand on chin, head tilted, slight sway
          if (meshRef.current) {
            meshRef.current.position.y = Math.sin(time * 0.3) * 0.03;
          }
          if (headRef.current) {
            headRef.current.rotation.z = Math.sin(time * 0.5) * 0.1 - 0.2;
            headRef.current.rotation.y = -0.3;
          }
          if (rightArmRef.current) {
            rightArmRef.current.rotation.x = -1.5;
            rightArmRef.current.rotation.z = 0.3;
          }
          break;

        case 'talking':
          // Animated head bobbing, hand gestures
          if (meshRef.current) {
            meshRef.current.position.y = Math.sin(time * 2) * 0.02;
          }
          if (headRef.current) {
            headRef.current.rotation.x = Math.sin(time * 4) * 0.1;
          }
          if (leftArmRef.current) {
            leftArmRef.current.rotation.x = Math.sin(time * 3) * 0.3 - 0.3;
          }
          if (rightArmRef.current) {
            rightArmRef.current.rotation.x = Math.sin(time * 3 + Math.PI) * 0.3 - 0.3;
          }
          break;

        case 'confused':
          // Head tilting side to side, scratching head
          if (headRef.current) {
            headRef.current.rotation.z = Math.sin(time * 2) * 0.3;
            headRef.current.rotation.y = Math.sin(time * 1.5) * 0.2;
          }
          if (rightArmRef.current) {
            rightArmRef.current.rotation.x = -1.8 + Math.sin(time * 3) * 0.2;
            rightArmRef.current.rotation.z = 0.5;
          }
          break;

        case 'happy':
          // Bouncing, swaying arms
          if (meshRef.current) {
            meshRef.current.position.y = Math.abs(Math.sin(time * 3)) * 0.15;
          }
          if (headRef.current) {
            headRef.current.rotation.z = Math.sin(time * 2) * 0.15;
          }
          if (leftArmRef.current) {
            leftArmRef.current.rotation.z = -0.3 + Math.sin(time * 2) * 0.2;
          }
          if (rightArmRef.current) {
            rightArmRef.current.rotation.z = 0.3 + Math.sin(time * 2 + Math.PI) * 0.2;
          }
          break;

        case 'excited':
          // Fast bouncing, waving arms
          if (meshRef.current) {
            meshRef.current.position.y = Math.abs(Math.sin(time * 5)) * 0.2;
          }
          if (headRef.current) {
            headRef.current.rotation.y = Math.sin(time * 4) * 0.2;
          }
          if (leftArmRef.current) {
            leftArmRef.current.rotation.x = Math.sin(time * 6) * 0.5 - 0.5;
            leftArmRef.current.rotation.z = -0.5;
          }
          if (rightArmRef.current) {
            rightArmRef.current.rotation.x = Math.sin(time * 6 + Math.PI) * 0.5 - 0.5;
            rightArmRef.current.rotation.z = 0.5;
          }
          break;

        case 'winning':
          // High jump, arms up, celebration
          if (meshRef.current) {
            const jumpPhase = (time * 4) % (Math.PI * 2);
            meshRef.current.position.y = Math.max(0, Math.sin(jumpPhase) * 0.5);
          }
          if (headRef.current) {
            headRef.current.rotation.z = Math.sin(time * 3) * 0.2;
          }
          if (leftArmRef.current) {
            leftArmRef.current.rotation.x = -2.8; // Arms up
            leftArmRef.current.rotation.z = -0.8;
          }
          if (rightArmRef.current) {
            rightArmRef.current.rotation.x = -2.8; // Arms up
            rightArmRef.current.rotation.z = 0.8;
          }
          // Alternating leg kicks during jump
          if (leftLegRef.current) {
            leftLegRef.current.rotation.x = Math.sin(time * 4) * 0.5;
          }
          if (rightLegRef.current) {
            rightLegRef.current.rotation.x = Math.sin(time * 4 + Math.PI) * 0.5;
          }
          break;

        case 'walking':
          // Walking animation - swinging arms and legs
          if (meshRef.current) {
            meshRef.current.position.y = Math.abs(Math.sin(time * 4)) * 0.05;
          }
          if (headRef.current) {
            headRef.current.rotation.y = Math.sin(time * 2) * 0.05;
          }
          if (leftArmRef.current) {
            leftArmRef.current.rotation.x = Math.sin(time * 4) * 0.6;
          }
          if (rightArmRef.current) {
            rightArmRef.current.rotation.x = Math.sin(time * 4 + Math.PI) * 0.6;
          }
          if (leftLegRef.current) {
            leftLegRef.current.rotation.x = Math.sin(time * 4 + Math.PI) * 0.5;
          }
          if (rightLegRef.current) {
            rightLegRef.current.rotation.x = Math.sin(time * 4) * 0.5;
          }
          break;

        case 'jump':
          // Simple jump animation
          if (meshRef.current) {
            const jumpCycle = Math.sin(time * 2) * 0.5 + 0.5; // 0 to 1
            meshRef.current.position.y = jumpCycle * 0.4;
          }
          if (leftArmRef.current) {
            leftArmRef.current.rotation.x = -0.5;
            leftArmRef.current.rotation.z = -0.3;
          }
          if (rightArmRef.current) {
            rightArmRef.current.rotation.x = -0.5;
            rightArmRef.current.rotation.z = 0.3;
          }
          break;

        case 'surprise_jump':
          // Surprised jump - sudden upward movement with hands out
          if (meshRef.current) {
            const surpriseJump = Math.abs(Math.sin(time * 6)) * 0.6;
            meshRef.current.position.y = surpriseJump;
          }
          if (headRef.current) {
            headRef.current.rotation.x = -0.2; // Head tilted back
          }
          if (leftArmRef.current) {
            leftArmRef.current.rotation.x = -1.5; // Arms out to sides
            leftArmRef.current.rotation.z = -1.2;
          }
          if (rightArmRef.current) {
            rightArmRef.current.rotation.x = -1.5;
            rightArmRef.current.rotation.z = 1.2;
          }
          if (leftLegRef.current) {
            leftLegRef.current.rotation.x = -0.3;
          }
          if (rightLegRef.current) {
            rightLegRef.current.rotation.x = -0.3;
          }
          break;

        case 'surprise_happy':
          // Surprised and happy - bouncing with hands to face
          if (meshRef.current) {
            meshRef.current.position.y = Math.abs(Math.sin(time * 4)) * 0.2;
          }
          if (headRef.current) {
            headRef.current.rotation.z = Math.sin(time * 3) * 0.2;
            headRef.current.rotation.x = -0.1;
          }
          if (leftArmRef.current) {
            leftArmRef.current.rotation.x = -2.0; // Hands near face
            leftArmRef.current.rotation.z = -0.5;
          }
          if (rightArmRef.current) {
            rightArmRef.current.rotation.x = -2.0;
            rightArmRef.current.rotation.z = 0.5;
          }
          break;
      }

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isActive, animation]);

  // Character-specific features
  const hasGlasses = character.id === 'freud';
  const hasBeard = character.id === 'freud';
  const hasTie = character.id === 'jung';
  const hairColor = character.id === 'freud' ? '#f5f5f5' : character.id === 'jung' ? '#8b6f47' : '#6b5d4f';
  const skinColor = '#f4c8a8';

  // For single character display, center at origin
  const position: [number, number, number] = [0, 0, 0];

  return (
    <group ref={meshRef} position={position}>
      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.15, -0.25, 0]} castShadow>
        <boxGeometry args={[0.25, 0.5, 0.25]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.15, -0.25, 0]} castShadow>
        <boxGeometry args={[0.25, 0.5, 0.25]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>

      {/* Body/Torso */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.6, 0.7, 0.35]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>

      {/* Tie (for Jung) */}
      {hasTie && (
        <mesh position={[0, 0.25, 0.18]} castShadow>
          <boxGeometry args={[0.15, 0.5, 0.02]} />
          <meshStandardMaterial color="#2c2c2c" roughness={0.8} />
        </mesh>
      )}

      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.425, 0.15, 0]} castShadow>
        <boxGeometry args={[0.25, 0.6, 0.25]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.425, 0.15, 0]} castShadow>
        <boxGeometry args={[0.25, 0.6, 0.25]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>

      {/* Head Group - All facial features move with head */}
      <group ref={headRef} position={[0, 0.85, 0]}>
        {/* Head */}
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>

        {/* Hair/Top of head */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.52, 0.15, 0.52]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>

        {/* Beard (for Freud) */}
        {hasBeard && (
          <>
            <mesh position={[0, -0.15, 0.26]} castShadow>
              <boxGeometry args={[0.35, 0.2, 0.05]} />
              <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.3, 0.26]} castShadow>
              <boxGeometry args={[0.3, 0.15, 0.05]} />
              <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
            </mesh>
          </>
        )}

        {/* Eyes */}
        <mesh position={[-0.12, 0.05, 0.26]}>
          <boxGeometry args={[0.08, 0.08, 0.01]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>
        <mesh position={[0.12, 0.05, 0.26]}>
          <boxGeometry args={[0.08, 0.08, 0.01]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>

        {/* Glasses (for Freud) */}
        {hasGlasses && (
          <>
            {/* Left lens frame */}
            <mesh position={[-0.12, 0.05, 0.27]}>
              <torusGeometry args={[0.09, 0.015, 8, 16]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Right lens frame */}
            <mesh position={[0.12, 0.05, 0.27]}>
              <torusGeometry args={[0.09, 0.015, 8, 16]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Bridge */}
            <mesh position={[0, 0.05, 0.27]}>
              <boxGeometry args={[0.06, 0.015, 0.015]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.2} />
            </mesh>
          </>
        )}

        {/* Nose */}
        <mesh position={[0, -0.05, 0.26]}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Glow when active */}
      {isActive && (
        <pointLight position={[0, 0.5, 1]} intensity={1.5} color={character.color} distance={4} />
      )}
    </group>
  );
}

export function CharacterDisplay3D({ characterId, isActive = false, animation = 'idle' }: CharacterDisplay3DProps) {
  const character = useMemo(() => getCharacter(characterId), [characterId]);

  return (
    <View style={styles.container}>
      <Canvas
        camera={{ position: [0, 1.5, 3], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[5, 10, 5]} angle={0.3} penumbra={1} intensity={1} castShadow />
        <directionalLight position={[-5, 5, 5]} intensity={0.5} />
        {/* Top light for better character illumination */}
        <directionalLight position={[0, 10, 0]} intensity={0.8} color="#ffffff" />
        {/* Frontal light for face illumination */}
        <directionalLight position={[0, 2, 5]} intensity={1.2} color="#ffffff" />

        <Character character={character} isActive={isActive} animation={animation} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    backgroundColor: '#0a0a0a',
  },
});
