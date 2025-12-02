import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CharacterDisplay3D, AnimationState } from '../components/CharacterDisplay3D';
import { getCharacter } from '../config/characters';
import { Card, Badge } from '../components/ui';

// All available animations
const ALL_ANIMATIONS: { name: AnimationState; description: string; category: string }[] = [
  // Basic animations
  { name: 'idle', description: 'Default resting state with subtle breathing', category: 'Basic' },
  { name: 'thinking', description: 'Hand on chin, contemplative pose', category: 'Basic' },
  { name: 'talking', description: 'Animated gestures while speaking', category: 'Basic' },
  { name: 'confused', description: 'Head tilting, scratching head', category: 'Basic' },
  { name: 'happy', description: 'Bouncing, swaying joyfully', category: 'Basic' },
  { name: 'excited', description: 'Fast bouncing, waving arms', category: 'Basic' },
  
  // Movement animations
  { name: 'walking', description: 'Walking motion with arm swing', category: 'Movement' },
  { name: 'jump', description: 'Simple jumping animation', category: 'Movement' },
  { name: 'winning', description: 'Victory celebration with arms up', category: 'Movement' },
  
  // Reaction animations
  { name: 'surprise_jump', description: 'Startled jump with hands out', category: 'Reaction' },
  { name: 'surprise_happy', description: 'Pleasant surprise, hands to face', category: 'Reaction' },
  
  // New body language animations
  { name: 'lean_back', description: 'Leaning back, skeptical or relaxed', category: 'Body Language' },
  { name: 'lean_forward', description: 'Leaning forward, engaged and interested', category: 'Body Language' },
  { name: 'cross_arms', description: 'Arms crossed, reserved stance', category: 'Body Language' },
  { name: 'nod', description: 'Nodding in agreement', category: 'Body Language' },
  { name: 'shake_head', description: 'Shaking head in disagreement', category: 'Body Language' },
  { name: 'shrug', description: 'Shoulders up, uncertainty gesture', category: 'Body Language' },
  
  // Gestures
  { name: 'wave', description: 'Waving hello or goodbye', category: 'Gestures' },
  { name: 'point', description: 'Pointing for emphasis', category: 'Gestures' },
  { name: 'clap', description: 'Clapping in applause', category: 'Gestures' },
  { name: 'bow', description: 'Respectful bow', category: 'Gestures' },
];

// Available test characters
const TEST_CHARACTERS = ['freud', 'jung', 'adler'];

const AnimationsScreen = (): JSX.Element => {
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState>('idle');
  const [isTalking, setIsTalking] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState('freud');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const character = getCharacter(selectedCharacter);
  const categories = [...new Set(ALL_ANIMATIONS.map(a => a.category))];
  
  const filteredAnimations = selectedCategory
    ? ALL_ANIMATIONS.filter(a => a.category === selectedCategory)
    : ALL_ANIMATIONS;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎬 Animation Tester</Text>
        <Text style={styles.subtitle}>Preview all {ALL_ANIMATIONS.length} animations</Text>
      </View>

      <View style={styles.content}>
        {/* 3D Character Preview */}
        <View style={styles.previewSection}>
          <Card variant="elevated" style={styles.previewCard}>
            <View style={styles.characterPreview}>
              <CharacterDisplay3D
                characterId={selectedCharacter}
                isActive={true}
                animation={currentAnimation}
                isTalking={isTalking}
              />
            </View>
            
            {/* Current animation info */}
            <View style={styles.animationInfo}>
              <Text style={styles.currentAnimationLabel}>Current Animation:</Text>
              <View style={styles.currentAnimationRow}>
                <Badge label={currentAnimation} variant="primary" size="lg" />
                {isTalking && <Badge label="+ Talking" variant="success" size="sm" />}
              </View>
            </View>

            {/* Character selector */}
            <View style={styles.characterSelector}>
              <Text style={styles.selectorLabel}>Test Character:</Text>
              <View style={styles.characterButtons}>
                {TEST_CHARACTERS.map((charId) => {
                  const char = getCharacter(charId);
                  return (
                    <TouchableOpacity
                      key={charId}
                      style={[
                        styles.characterButton,
                        selectedCharacter === charId && styles.characterButtonActive,
                        { borderColor: char.color }
                      ]}
                      onPress={() => setSelectedCharacter(charId)}
                    >
                      <Text style={[
                        styles.characterButtonText,
                        selectedCharacter === charId && { color: char.color }
                      ]}>
                        {char.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Talking toggle */}
            <TouchableOpacity
              style={[styles.talkingToggle, isTalking && styles.talkingToggleActive]}
              onPress={() => setIsTalking(!isTalking)}
            >
              <Ionicons 
                name={isTalking ? "mic" : "mic-off"} 
                size={20} 
                color={isTalking ? "#10b981" : "#71717a"} 
              />
              <Text style={[styles.talkingToggleText, isTalking && styles.talkingToggleTextActive]}>
                {isTalking ? 'Talking ON' : 'Talking OFF'}
              </Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Animation List */}
        <View style={styles.animationListSection}>
          {/* Category filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContainer}
          >
            <TouchableOpacity
              style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
                All ({ALL_ANIMATIONS.length})
              </Text>
            </TouchableOpacity>
            {categories.map((category) => {
              const count = ALL_ANIMATIONS.filter(a => a.category === category).length;
              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[styles.categoryChipText, selectedCategory === category && styles.categoryChipTextActive]}>
                    {category} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Animation buttons */}
          <ScrollView 
            style={styles.animationScroll}
            contentContainerStyle={styles.animationGrid}
            showsVerticalScrollIndicator={false}
          >
            {filteredAnimations.map((anim) => (
              <TouchableOpacity
                key={anim.name}
                style={[
                  styles.animationCard,
                  currentAnimation === anim.name && styles.animationCardActive
                ]}
                onPress={() => setCurrentAnimation(anim.name)}
              >
                <View style={styles.animationCardHeader}>
                  <Text style={[
                    styles.animationName,
                    currentAnimation === anim.name && styles.animationNameActive
                  ]}>
                    {anim.name}
                  </Text>
                  {currentAnimation === anim.name && (
                    <Ionicons name="checkmark-circle" size={18} color="#8b5cf6" />
                  )}
                </View>
                <Text style={styles.animationDescription}>{anim.description}</Text>
                <Badge label={anim.category} variant="secondary" size="sm" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const isSmallScreen = width < 768;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#71717a',
  },
  content: {
    flex: 1,
    flexDirection: isSmallScreen ? 'column' : 'row',
  },
  previewSection: {
    width: isSmallScreen ? '100%' : '40%',
    padding: 16,
  },
  previewCard: {
    padding: 16,
  },
  characterPreview: {
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    marginBottom: 16,
  },
  animationInfo: {
    marginBottom: 16,
  },
  currentAnimationLabel: {
    fontSize: 12,
    color: '#71717a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentAnimationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  characterSelector: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 12,
    color: '#71717a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  characterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  characterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#3f3f46',
    alignItems: 'center',
  },
  characterButtonActive: {
    backgroundColor: '#1e1b4b',
  },
  characterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  talkingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  talkingToggleActive: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  talkingToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717a',
  },
  talkingToggleTextActive: {
    color: '#10b981',
  },
  animationListSection: {
    flex: 1,
    padding: 16,
    paddingLeft: isSmallScreen ? 16 : 0,
  },
  categoryScroll: {
    maxHeight: 44,
    marginBottom: 16,
  },
  categoryContainer: {
    gap: 8,
    paddingRight: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  categoryChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  animationScroll: {
    flex: 1,
  },
  animationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 100,
  },
  animationCard: {
    width: isSmallScreen ? '100%' : 'calc(50% - 6px)',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#171717',
    borderWidth: 2,
    borderColor: '#27272a',
  },
  animationCardActive: {
    borderColor: '#8b5cf6',
    backgroundColor: '#1e1b4b',
  },
  animationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  animationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e4e4e7',
    fontFamily: 'monospace',
  },
  animationNameActive: {
    color: '#c4b5fd',
  },
  animationDescription: {
    fontSize: 13,
    color: '#71717a',
    marginBottom: 10,
    lineHeight: 18,
  },
});

export default AnimationsScreen;

