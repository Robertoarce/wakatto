import React, { useRef, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Billboard, Text as DreiText } from '@react-three/drei';
import * as THREE from 'three';
import { getCharacter, CharacterBehavior } from '../config/characters';

export type AnimationState = 'idle' | 'thinking' | 'talking' | 'confused' | 'happy' | 'excited' | 'winning' | 'walking' | 'jump' | 'surprise_jump' | 'surprise_happy' | 'furious' | 'sad';

interface CharacterDisplay3DProps {
  characterId: string;
  isActive?: boolean;
  animation?: AnimationState;
  isTalking?: boolean;
  showName?: boolean;
  nameKey?: number;
}

function Character({ character, isActive, animation = 'idle', isTalking = false, scale = 1 }: { character: CharacterBehavior; isActive: boolean; animation?: AnimationState; isTalking?: boolean; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  // Animation logic
  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();

    // Base floating
    groupRef.current.position.y = Math.sin(time * 2) * 0.1 - 0.5; // Center roughly

    // Talking animation (bounce/squash)
    if (isTalking) {
      const talkBounce = Math.sin(time * 20) * 0.05;
      groupRef.current.scale.y = 1 + talkBounce;
      groupRef.current.scale.x = 1 - talkBounce * 0.5;
    } else {
      groupRef.current.scale.set(1, 1, 1);
    }

    // Specific animations
    switch (animation) {
      case 'jump':
      case 'surprise_jump':
        groupRef.current.position.y += Math.abs(Math.sin(time * 10)) * 0.5;
        break;
      case 'furious':
        groupRef.current.position.x += Math.sin(time * 50) * 0.05; // Shake
        break;
      case 'happy':
      case 'excited':
        groupRef.current.rotation.z = Math.sin(time * 5) * 0.1; // Sway
        break;
      case 'thinking':
        groupRef.current.rotation.z = Math.sin(time * 2) * 0.05; // Slow sway
        break;
    }
  });

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.4, 0.8, 4, 8]} />
        <meshStandardMaterial color={character.color} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color="#ffdbac" /> {/* Default skin tone */}
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.12, 0.85, 0.3]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[0.12, 0.85, 0.3]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>

      {/* Name tag */}
      {isActive && (
        <Billboard position={[0, 1.8, 0]}>
          <DreiText
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="black"
          >
            {character.name}
          </DreiText>
        </Billboard>
      )}
    </group>
  );
}

export default function CharacterDisplay3D({
  characterId,
  isActive = true,
  animation = 'idle',
  isTalking = false,
  showName = true,
  nameKey = 0
}: CharacterDisplay3DProps) {
  const character = useMemo(() => getCharacter(characterId), [characterId]);

  if (!character) return null;

  return (
    <View style={styles.container}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} />

        <Character
          character={character}
          isActive={isActive}
          animation={animation}
          isTalking={isTalking}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
