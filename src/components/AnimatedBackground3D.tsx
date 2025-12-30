import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { CharacterDisplay3D, AnimationState } from './CharacterDisplay3D';
import { getAllCharacters } from '../config/characters';

interface CharacterAnimation {
  characterId: string;
  animation: AnimationState;
  x: number; // Position in percentage
  y: number; // Position in percentage
  targetX: number; // Target position for movement
  targetY: number; // Target position for movement
  scale: number; // Size scale
  animatedX: Animated.Value;
  animatedY: Animated.Value;
}

export function AnimatedBackground3D() {
  const [characterAnimations, setCharacterAnimations] = useState<CharacterAnimation[]>([]);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const animationTimers = useRef<NodeJS.Timeout[]>([]);
  const movementTimers = useRef<NodeJS.Timeout[]>([]);
  const isInitializedRef = useRef(false);

  const allCharacters = getAllCharacters();
  const animations: AnimationState[] = ['idle', 'thinking', 'happy', 'excited', 'talking'];

  // Generate random position within safe bounds
  const getRandomPosition = () => ({
    x: Math.random() * 95, // 0-95%
    y: Math.random() * 95, // 0-95%
  });

  // Clear all timers helper
  const clearAllTimers = useCallback(() => {
    animationTimers.current.forEach(timer => clearInterval(timer));
    animationTimers.current = [];
    movementTimers.current.forEach(timer => clearInterval(timer));
    movementTimers.current = [];
  }, []);

  // Start timers for all characters
  const startTimers = useCallback((characterCount: number) => {
    // Clear existing timers first
    clearAllTimers();

    // Start animation cycle for each character
    for (let index = 0; index < characterCount; index++) {
      // Change animation state
      const animTimer = setInterval(() => {
        changeCharacterAnimation(index);
      }, 3000 + Math.random() * 2000); // Random interval between 3-5 seconds
      animationTimers.current.push(animTimer);

      // Move character to new position
      const moveTimer = setInterval(() => {
        moveCharacter(index);
      }, 5000 + Math.random() * 5000); // Random interval between 5-10 seconds
      movementTimers.current.push(moveTimer);
    }
  }, [clearAllTimers]);

  // Track page visibility (pause timers when tab is hidden)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsPageVisible(visible);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Pause/resume timers based on visibility
  useEffect(() => {
    if (!isInitializedRef.current || characterAnimations.length === 0) return;

    if (isPageVisible) {
      // Resume timers when page becomes visible
      startTimers(characterAnimations.length);
    } else {
      // Pause timers when page is hidden (saves CPU)
      clearAllTimers();
    }
  }, [isPageVisible, characterAnimations.length, startTimers, clearAllTimers]);

  // Initialize random character positions
  useEffect(() => {
    const characters: CharacterAnimation[] = [];

    // Create 10 characters with random positions and sizes
    for (let i = 0; i < 10; i++) {
      const charIndex = i % allCharacters.length;
      const animIndex = i % animations.length;
      const startPos = getRandomPosition();

      characters.push({
        characterId: allCharacters[charIndex].id,
        animation: animations[animIndex],
        x: startPos.x,
        y: startPos.y,
        targetX: startPos.x,
        targetY: startPos.y,
        scale: 0.3 + Math.random() * 1.2, // Random scale between 0.3 and 1.5
        animatedX: new Animated.Value(startPos.x),
        animatedY: new Animated.Value(startPos.y),
      });
    }

    setCharacterAnimations(characters);
    isInitializedRef.current = true;

    // Start timers (will be paused/resumed based on visibility)
    startTimers(characters.length);

    return () => {
      clearAllTimers();
      isInitializedRef.current = false;
    };
  }, []);

  const changeCharacterAnimation = (index: number) => {
    setCharacterAnimations(prev => {
      const newAnimations = [...prev];
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      newAnimations[index] = {
        ...newAnimations[index],
        animation: randomAnimation,
      };
      return newAnimations;
    });
  };

  const moveCharacter = (index: number) => {
    setCharacterAnimations(prev => {
      const newAnimations = [...prev];
      const char = newAnimations[index];
      const newPos = getRandomPosition();

      // Animate to new position
      Animated.parallel([
        Animated.timing(char.animatedX, {
          toValue: newPos.x,
          duration: 3000 + Math.random() * 2000, // 3-5 seconds
          useNativeDriver: false,
        }),
        Animated.timing(char.animatedY, {
          toValue: newPos.y,
          duration: 3000 + Math.random() * 2000, // 3-5 seconds
          useNativeDriver: false,
        }),
      ]).start();

      newAnimations[index] = {
        ...char,
        targetX: newPos.x,
        targetY: newPos.y,
      };

      return newAnimations;
    });
  };

  return (
    <View style={styles.container}>
      {characterAnimations.map((char, index) => (
        <Animated.View
          key={`${char.characterId}-${index}`}
          style={[
            styles.characterContainer,
            {
              left: char.animatedX.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              top: char.animatedY.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              transform: [{ scale: char.scale }],
            },
          ]}
        >
          <CharacterDisplay3D
            characterId={char.characterId}
            animation={char.animation}
            isActive={false}
          />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  characterContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    opacity: 0.3,
    backgroundColor: 'transparent',
  },
});
