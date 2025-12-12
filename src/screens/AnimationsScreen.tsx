import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { 
  CharacterDisplay3D, 
  AnimationState, 
  ComplementaryAnimation,
  LookDirection,
  EyeState,
  EyebrowState,
  HeadStyle,
  MouthState,
  FaceState,
  VisualEffect,
  ModelStyle
} from '../components/CharacterDisplay3D';
import { getCharacter } from '../config/characters';
import { Card, Badge } from '../components/ui';

// All available base animations
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
  { name: 'dance', description: 'Celebratory dancing with rhythm', category: 'Movement' },
  { name: 'stretch', description: 'Stretching arms up, yawning', category: 'Movement' },
  
  // Reaction animations
  { name: 'surprise_jump', description: 'Startled jump with hands out', category: 'Reaction' },
  { name: 'surprise_happy', description: 'Pleasant surprise, hands to face', category: 'Reaction' },
  { name: 'laugh', description: 'Laughing with head thrown back', category: 'Reaction' },
  { name: 'celebrate', description: 'Arms up celebration, jumping', category: 'Reaction' },
  
  // Body language animations
  { name: 'lean_back', description: 'Leaning back, skeptical or relaxed', category: 'Body Language' },
  { name: 'lean_forward', description: 'Leaning forward, engaged and interested', category: 'Body Language' },
  { name: 'cross_arms', description: 'Arms crossed, reserved stance', category: 'Body Language' },
  { name: 'nod', description: 'Nodding in agreement', category: 'Body Language' },
  { name: 'shake_head', description: 'Shaking head in disagreement', category: 'Body Language' },
  { name: 'shrug', description: 'Shoulders up, uncertainty gesture', category: 'Body Language' },
  { name: 'peek', description: 'Curious peeking to the side', category: 'Body Language' },
  
  // Gestures
  { name: 'wave', description: 'Waving hello or goodbye', category: 'Gestures' },
  { name: 'point', description: 'Pointing for emphasis', category: 'Gestures' },
  { name: 'clap', description: 'Clapping in applause', category: 'Gestures' },
  { name: 'bow', description: 'Respectful bow', category: 'Gestures' },
  { name: 'facepalm', description: 'Hand to face in frustration', category: 'Gestures' },
  
  // Emotional animations
  { name: 'cry', description: 'Sad crying, hunched over', category: 'Emotional' },
  { name: 'angry', description: 'Angry tense stance, clenched fists', category: 'Emotional' },
  { name: 'nervous', description: 'Fidgeting nervously, looking around', category: 'Emotional' },
  { name: 'doze', description: 'Sleepy, head drooping, eyes closing', category: 'Emotional' },
  
  // Idle animations
  { name: 'kick_ground', description: 'Kicking at ground, looking down', category: 'Idle' },
  { name: 'meh', description: 'Bored shrug, disinterested posture', category: 'Idle' },
  { name: 'foot_tap', description: 'Impatient foot tapping', category: 'Idle' },
  { name: 'look_around', description: 'Curious looking left and right', category: 'Idle' },
  { name: 'yawn', description: 'Yawning with mouth wide open', category: 'Idle' },
  { name: 'fidget', description: 'Restless shifting and small movements', category: 'Idle' },
  { name: 'rub_eyes', description: 'Tiredly rubbing eyes', category: 'Idle' },
  { name: 'weight_shift', description: 'Shifting weight foot to foot', category: 'Idle' },
  
  // Processing/thinking animations
  { name: 'head_tilt', description: 'Curious head tilt to the side', category: 'Processing' },
  { name: 'chin_stroke', description: 'Thoughtfully stroking chin', category: 'Processing' },
];

// Look directions
const LOOK_DIRECTIONS: { value: LookDirection; label: string; icon: string }[] = [
  { value: 'center', label: 'Center', icon: '⬤' },
  { value: 'left', label: 'Left', icon: '←' },
  { value: 'right', label: 'Right', icon: '→' },
  { value: 'up', label: 'Up', icon: '↑' },
  { value: 'down', label: 'Down', icon: '↓' },
  { value: 'at_left_character', label: 'At Left Char', icon: '👈' },
  { value: 'at_right_character', label: 'At Right Char', icon: '👉' },
];

// Eye states
const EYE_STATES: { value: EyeState; label: string; icon: string }[] = [
  { value: 'open', label: 'Open (Auto Blink)', icon: '👁️' },
  { value: 'closed', label: 'Closed', icon: '😌' },
  { value: 'wink_left', label: 'Wink Left', icon: '😉' },
  { value: 'wink_right', label: 'Wink Right', icon: '🙃' },
  { value: 'blink', label: 'Blinking', icon: '😊' },
  { value: 'surprised_blink', label: 'Surprised', icon: '😳' },
];

// Mouth states
const MOUTH_STATES: { value: MouthState; label: string; icon: string }[] = [
  { value: 'closed', label: 'Closed', icon: '😐' },
  { value: 'open', label: 'Open', icon: '😮' },
  { value: 'smile', label: 'Smile', icon: '🙂' },
  { value: 'wide_smile', label: 'Wide Smile', icon: '😄' },
  { value: 'surprised', label: 'Surprised', icon: '😲' },
];

// Visual effects
const VISUAL_EFFECTS: { value: VisualEffect; label: string; icon: string }[] = [
  { value: 'none', label: 'None', icon: '⚪' },
  { value: 'confetti', label: 'Confetti', icon: '🎊' },
  { value: 'spotlight', label: 'Spotlight', icon: '🔦' },
  { value: 'sparkles', label: 'Sparkles', icon: '✨' },
  { value: 'hearts', label: 'Hearts', icon: '💕' },
];

// Speed presets
const SPEED_PRESETS = [
  { value: 0.25, label: '0.25x', description: 'Very Slow' },
  { value: 0.5, label: '0.5x', description: 'Slow' },
  { value: 1.0, label: '1x', description: 'Normal' },
  { value: 1.5, label: '1.5x', description: 'Fast' },
  { value: 2.0, label: '2x', description: 'Very Fast' },
  { value: 3.0, label: '3x', description: 'Ultra Fast' },
];

// Available test characters
const TEST_CHARACTERS = ['freud', 'jung', 'adler'];

// 3D Model styles
const MODEL_STYLES: { value: ModelStyle; label: string; icon: string }[] = [
  { value: 'blocky', label: 'Blocky', icon: '🧱' },
];

// Eyebrow states (anime-style)
const EYEBROW_STATES: { value: EyebrowState; label: string; icon: string }[] = [
  { value: 'normal', label: 'Normal', icon: '😐' },
  { value: 'raised', label: 'Raised', icon: '😮' },
  { value: 'furrowed', label: 'Furrowed', icon: '😠' },
  { value: 'sad', label: 'Sad', icon: '😢' },
  { value: 'worried', label: 'Worried', icon: '😟' },
  { value: 'one_raised', label: 'One Raised', icon: '🤨' },
  { value: 'wiggle', label: 'Wiggle', icon: '😏' },
];

// Head styles (shape/size)
const HEAD_STYLES: { value: HeadStyle; label: string; icon: string; description: string }[] = [
  { value: 'default', label: 'Default', icon: '🟦', description: 'Standard cube' },
  { value: 'bigger', label: 'Bigger', icon: '🔷', description: 'Scaled up cube' },
  { value: 'tall', label: 'Tall', icon: '📏', description: 'Taller rectangle' },
  { value: 'golden', label: 'Golden', icon: '✨', description: 'Golden ratio' },
];

// Face states (anime-style decorations)
const FACE_STATES: { value: FaceState; label: string; icon: string }[] = [
  { value: 'normal', label: 'Normal', icon: '😐' },
  { value: 'blush', label: 'Blush', icon: '😊' },
  { value: 'sweat_drop', label: 'Sweat Drop', icon: '😅' },
  { value: 'sparkle_eyes', label: 'Sparkle Eyes', icon: '🤩' },
  { value: 'heart_eyes', label: 'Heart Eyes', icon: '😍' },
  { value: 'spiral_eyes', label: 'Spiral Eyes', icon: '😵' },
  { value: 'tears', label: 'Tears', icon: '😭' },
  { value: 'anger_vein', label: 'Anger Vein', icon: '💢' },
  { value: 'shadow_face', label: 'Shadow Face', icon: '😔' },
];

const AnimationsScreen = (): JSX.Element => {
  const navigation = useNavigation<any>();
  
  // Base animation state
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState>('idle');
  const [isTalking, setIsTalking] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState('freud');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedModelStyle, setSelectedModelStyle] = useState<ModelStyle>('blocky');

  // Complementary animation state
  const [lookDirection, setLookDirection] = useState<LookDirection>('center');
  const [eyeState, setEyeState] = useState<EyeState>('open');
  const [eyebrowState, setEyebrowState] = useState<EyebrowState>('normal');
  const [headStyle, setHeadStyle] = useState<HeadStyle>('default');
  const [mouthState, setMouthState] = useState<MouthState>('closed');
  const [faceState, setFaceState] = useState<FaceState>('normal');
  const [effect, setEffect] = useState<VisualEffect>('none');
  const [speed, setSpeed] = useState(1.0);
  const [effectColor, setEffectColor] = useState('#8b5cf6');

  // Tab state
  const [activeTab, setActiveTab] = useState<'base' | 'complementary'>('base');

  const character = getCharacter(selectedCharacter);
  const categories = [...new Set(ALL_ANIMATIONS.map(a => a.category))];
  
  const filteredAnimations = selectedCategory
    ? ALL_ANIMATIONS.filter(a => a.category === selectedCategory)
    : ALL_ANIMATIONS;

  // Build complementary animation object
  const complementary: ComplementaryAnimation = {
    lookDirection: lookDirection !== 'center' ? lookDirection : undefined,
    eyeState: eyeState !== 'open' ? eyeState : undefined,
    eyebrowState: eyebrowState !== 'normal' ? eyebrowState : undefined,
    headStyle: headStyle,
    mouthState: mouthState !== 'closed' ? mouthState : undefined,
    faceState: faceState !== 'normal' ? faceState : undefined,
    effect: effect !== 'none' ? effect : undefined,
    effectColor,
    speed,
  };

  // Reset complementary to defaults
  const resetComplementary = () => {
    setLookDirection('center');
    setEyeState('open');
    setEyebrowState('normal');
    setHeadStyle('default');
    setMouthState('closed');
    setFaceState('normal');
    setEffect('none');
    setSpeed(1.0);
    setCurrentAnimation('idle');
    setIsTalking(false);
  };

  // Color options for effects
  const effectColors = [
    '#8b5cf6', // Purple
    '#ffd700', // Gold
    '#ff6b6b', // Red
    '#48dbfb', // Cyan
    '#ff9ff3', // Pink
    '#10b981', // Green
    '#f59e0b', // Orange
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>🎬 Animation Tester</Text>
            <Text style={styles.subtitle}>
              {ALL_ANIMATIONS.length} base animations + complementary layers
            </Text>
          </View>
        </View>
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
                complementary={complementary}
                modelStyle={selectedModelStyle}
                fov={25}
                cameraX={0}
                cameraY={0.7}
                characterY={-0.2}
              />
            </View>
            
            {/* Current state info */}
            <View style={styles.stateInfo}>
              <View style={styles.stateRow}>
                <Text style={styles.stateLabel}>Animation:</Text>
                <Badge label={currentAnimation} variant="primary" size="md" />
              </View>
              <View style={styles.stateRow}>
                <Text style={styles.stateLabel}>Speed:</Text>
                <Badge label={`${speed}x`} variant="secondary" size="sm" />
              </View>
              {isTalking && (
                <View style={styles.stateRow}>
                  <Badge label="🎤 Talking" variant="success" size="sm" />
                </View>
              )}
              {lookDirection !== 'center' && (
                <View style={styles.stateRow}>
                  <Badge label={`👁️ ${lookDirection}`} variant="info" size="sm" />
                </View>
              )}
              {effect !== 'none' && (
                <View style={styles.stateRow}>
                  <Badge label={`✨ ${effect}`} variant="warning" size="sm" />
                </View>
              )}
            </View>

            {/* Character selector */}
            <View style={styles.characterSelector}>
              <Text style={styles.selectorLabel}>Character:</Text>
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

            {/* 3D Style selector */}
            <View style={styles.characterSelector}>
              <Text style={styles.selectorLabel}>3D Style:</Text>
              <View style={styles.characterButtons}>
                {MODEL_STYLES.map((style) => (
                  <TouchableOpacity
                    key={style.value}
                    style={[
                      styles.styleButton,
                      selectedModelStyle === style.value && styles.styleButtonActive,
                    ]}
                    onPress={() => setSelectedModelStyle(style.value)}
                  >
                    <Text style={styles.styleIcon}>{style.icon}</Text>
                    <Text style={[
                      styles.characterButtonText,
                      selectedModelStyle === style.value && styles.styleButtonTextActive
                    ]}>
                      {style.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quick controls */}
            <View style={styles.quickControls}>
              <TouchableOpacity
                style={[styles.quickButton, isTalking && styles.quickButtonActive]}
                onPress={() => setIsTalking(!isTalking)}
              >
                <Ionicons 
                  name={isTalking ? "mic" : "mic-off"} 
                  size={18} 
                  color={isTalking ? "#10b981" : "#71717a"} 
                />
                <Text style={[styles.quickButtonText, isTalking && styles.quickButtonTextActive]}>
                  Talk
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickButton}
                onPress={resetComplementary}
              >
                <Ionicons name="refresh" size={18} color="#71717a" />
                <Text style={styles.quickButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Controls Section */}
        <View style={styles.controlsSection}>
          {/* Tab switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'base' && styles.tabActive]}
              onPress={() => setActiveTab('base')}
            >
              <Text style={[styles.tabText, activeTab === 'base' && styles.tabTextActive]}>
                Base Animations
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'complementary' && styles.tabActive]}
              onPress={() => setActiveTab('complementary')}
            >
              <Text style={[styles.tabText, activeTab === 'complementary' && styles.tabTextActive]}>
                Complementary
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.controlsScroll}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'base' ? (
              <>
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
                <View style={styles.animationGrid}>
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
                          <Ionicons name="checkmark-circle" size={16} color="#8b5cf6" />
                        )}
                      </View>
                      <Text style={styles.animationDescription} numberOfLines={2}>
                        {anim.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                {/* Speed Control */}
                <View style={styles.controlGroup}>
                  <Text style={styles.controlGroupTitle}>⏱️ Animation Speed</Text>
                  <View style={styles.optionGrid}>
                    {SPEED_PRESETS.map((preset) => (
                      <TouchableOpacity
                        key={preset.value}
                        style={[
                          styles.optionButton,
                          speed === preset.value && styles.optionButtonActive
                        ]}
                        onPress={() => setSpeed(preset.value)}
                      >
                        <Text style={[
                          styles.optionButtonText,
                          speed === preset.value && styles.optionButtonTextActive
                        ]}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Look Direction */}
                <View style={styles.controlGroup}>
                  <Text style={styles.controlGroupTitle}>👁️ Look Direction</Text>
                  <View style={styles.optionGrid}>
                    {LOOK_DIRECTIONS.map((dir) => (
                      <TouchableOpacity
                        key={dir.value}
                        style={[
                          styles.optionButton,
                          lookDirection === dir.value && styles.optionButtonActive
                        ]}
                        onPress={() => setLookDirection(dir.value)}
                      >
                        <Text style={styles.optionIcon}>{dir.icon}</Text>
                        <Text style={[
                          styles.optionButtonText,
                          lookDirection === dir.value && styles.optionButtonTextActive
                        ]}>
                          {dir.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Eye State */}
                <View style={styles.controlGroup}>
                  <Text style={styles.controlGroupTitle}>👀 Eye State</Text>
                  <View style={styles.optionGrid}>
                    {EYE_STATES.map((eye) => (
                      <TouchableOpacity
                        key={eye.value}
                        style={[
                          styles.optionButton,
                          eyeState === eye.value && styles.optionButtonActive
                        ]}
                        onPress={() => setEyeState(eye.value)}
                      >
                        <Text style={styles.optionIcon}>{eye.icon}</Text>
                        <Text style={[
                          styles.optionButtonText,
                          eyeState === eye.value && styles.optionButtonTextActive
                        ]}>
                          {eye.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Mouth State */}
                <View style={styles.controlGroup}>
                  <Text style={styles.controlGroupTitle}>👄 Mouth State</Text>
                  <View style={styles.optionGrid}>
                    {MOUTH_STATES.map((mouth) => (
                      <TouchableOpacity
                        key={mouth.value}
                        style={[
                          styles.optionButton,
                          mouthState === mouth.value && styles.optionButtonActive
                        ]}
                        onPress={() => setMouthState(mouth.value)}
                      >
                        <Text style={styles.optionIcon}>{mouth.icon}</Text>
                        <Text style={[
                          styles.optionButtonText,
                          mouthState === mouth.value && styles.optionButtonTextActive
                        ]}>
                          {mouth.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Eyebrow State (Anime) */}
                <View style={styles.controlGroup}>
                  <Text style={styles.controlGroupTitle}>🎭 Eyebrow State</Text>
                  <View style={styles.optionGrid}>
                    {EYEBROW_STATES.map((brow) => (
                      <TouchableOpacity
                        key={brow.value}
                        style={[
                          styles.optionButton,
                          eyebrowState === brow.value && styles.optionButtonActive
                        ]}
                        onPress={() => setEyebrowState(brow.value)}
                      >
                        <Text style={styles.optionIcon}>{brow.icon}</Text>
                        <Text style={[
                          styles.optionButtonText,
                          eyebrowState === brow.value && styles.optionButtonTextActive
                        ]}>
                          {brow.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Head Style */}
                <View style={styles.controlGroup}>
                  <Text style={styles.controlGroupTitle}>🗿 Head Style</Text>
                  <View style={styles.optionGrid}>
                    {HEAD_STYLES.map((style) => (
                      <TouchableOpacity
                        key={style.value}
                        style={[
                          styles.optionButton,
                          headStyle === style.value && styles.optionButtonActive
                        ]}
                        onPress={() => setHeadStyle(style.value)}
                      >
                        <Text style={styles.optionIcon}>{style.icon}</Text>
                        <Text style={[
                          styles.optionButtonText,
                          headStyle === style.value && styles.optionButtonTextActive
                        ]}>
                          {style.label}
                        </Text>
                        <Text style={styles.optionDescription}>{style.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Face State (Anime) */}
                <View style={styles.controlGroup}>
                  <Text style={styles.controlGroupTitle}>✨ Face State (Anime)</Text>
                  <View style={styles.optionGrid}>
                    {FACE_STATES.map((face) => (
                      <TouchableOpacity
                        key={face.value}
                        style={[
                          styles.optionButton,
                          faceState === face.value && styles.optionButtonActive
                        ]}
                        onPress={() => setFaceState(face.value)}
                      >
                        <Text style={styles.optionIcon}>{face.icon}</Text>
                        <Text style={[
                          styles.optionButtonText,
                          faceState === face.value && styles.optionButtonTextActive
                        ]}>
                          {face.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Visual Effects */}
                <View style={styles.controlGroup}>
                  <Text style={styles.controlGroupTitle}>✨ Visual Effects</Text>
                  <View style={styles.optionGrid}>
                    {VISUAL_EFFECTS.map((fx) => (
                      <TouchableOpacity
                        key={fx.value}
                        style={[
                          styles.optionButton,
                          effect === fx.value && styles.optionButtonActive
                        ]}
                        onPress={() => setEffect(fx.value)}
                      >
                        <Text style={styles.optionIcon}>{fx.icon}</Text>
                        <Text style={[
                          styles.optionButtonText,
                          effect === fx.value && styles.optionButtonTextActive
                        ]}>
                          {fx.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Effect Color */}
                {effect !== 'none' && (
                  <View style={styles.controlGroup}>
                    <Text style={styles.controlGroupTitle}>🎨 Effect Color</Text>
                    <View style={styles.colorGrid}>
                      {effectColors.map((color) => (
                        <TouchableOpacity
                          key={color}
                          style={[
                            styles.colorButton,
                            { backgroundColor: color },
                            effectColor === color && styles.colorButtonActive
                          ]}
                          onPress={() => setEffectColor(color)}
                        >
                          {effectColor === color && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Quick Presets */}
                <View style={styles.controlGroup}>
                  <Text style={styles.controlGroupTitle}>⚡ Quick Presets</Text>
                  <View style={styles.presetGrid}>
                    <TouchableOpacity
                      style={styles.presetButton}
                      onPress={() => {
                        setCurrentAnimation('happy');
                        setMouthState('wide_smile');
                        setEffect('confetti');
                        setSpeed(1.5);
                      }}
                    >
                      <Text style={styles.presetIcon}>🎉</Text>
                      <Text style={styles.presetText}>Celebration</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.presetButton}
                      onPress={() => {
                        setCurrentAnimation('thinking');
                        setLookDirection('up');
                        setMouthState('closed');
                        setEffect('none');
                        setSpeed(0.5);
                      }}
                    >
                      <Text style={styles.presetIcon}>🤔</Text>
                      <Text style={styles.presetText}>Deep Thought</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.presetButton}
                      onPress={() => {
                        setCurrentAnimation('talking');
                        setIsTalking(true);
                        setLookDirection('center');
                        setEffect('spotlight');
                        setSpeed(1.0);
                      }}
                    >
                      <Text style={styles.presetIcon}>🎤</Text>
                      <Text style={styles.presetText}>Presenting</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.presetButton}
                      onPress={() => {
                        setCurrentAnimation('excited');
                        setMouthState('smile');
                        setEyeState('blink');
                        setEffect('hearts');
                        setSpeed(1.5);
                      }}
                    >
                      <Text style={styles.presetIcon}>😍</Text>
                      <Text style={styles.presetText}>Love</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.presetButton}
                      onPress={() => {
                        setCurrentAnimation('confused');
                        setLookDirection('left');
                        setMouthState('open');
                        setEyeState('wink_right');
                        setSpeed(0.75);
                      }}
                    >
                      <Text style={styles.presetIcon}>🤨</Text>
                      <Text style={styles.presetText}>Skeptical</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.presetButton}
                      onPress={() => {
                        setCurrentAnimation('winning');
                        setMouthState('wide_smile');
                        setEffect('sparkles');
                        setEffectColor('#ffd700');
                        setSpeed(1.2);
                      }}
                    >
                      <Text style={styles.presetIcon}>🏆</Text>
                      <Text style={styles.presetText}>Victory</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.presetButton}
                      onPress={() => {
                        setCurrentAnimation('surprise_jump');
                        setMouthState('surprised');
                        setEyeState('surprised_blink');
                        setEyebrowState('raised');
                        setSpeed(1.0);
                      }}
                    >
                      <Text style={styles.presetIcon}>😱</Text>
                      <Text style={styles.presetText}>Shocked</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ height: 150, marginBottom: 20 }} />
              </>
            )}
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
    padding: 16,
    paddingTop: 24,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#71717a',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  testButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    flexDirection: isSmallScreen ? 'column' : 'row',
  },
  previewSection: {
    width: isSmallScreen ? '100%' : '35%',
    padding: 12,
  },
  previewCard: {
    padding: 12,
  },
  characterPreview: {
    height: isSmallScreen ? 220 : 260,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    marginBottom: 12,
  },
  stateInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stateLabel: {
    fontSize: 11,
    color: '#71717a',
    textTransform: 'uppercase',
  },
  characterSelector: {
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 11,
    color: '#71717a',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  characterButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  characterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#3f3f46',
    alignItems: 'center',
  },
  characterButtonActive: {
    backgroundColor: '#1e1b4b',
  },
  characterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  styleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#3f3f46',
  },
  styleButtonActive: {
    backgroundColor: '#1e1b4b',
    borderColor: '#8b5cf6',
  },
  styleButtonTextActive: {
    color: '#c4b5fd',
  },
  styleIcon: {
    fontSize: 14,
  },
  quickControls: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  quickButtonActive: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
  },
  quickButtonTextActive: {
    color: '#10b981',
  },
  controlsSection: {
    flex: 1,
    padding: 12,
    paddingLeft: isSmallScreen ? 12 : 0,
  },
  tabSwitcher: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#171717',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717a',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  controlsScroll: {
    flex: 1,
  },
  categoryScroll: {
    maxHeight: 40,
    marginBottom: 12,
  },
  categoryContainer: {
    gap: 6,
    paddingRight: 12,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  categoryChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  animationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 80,
  },
  animationCard: {
    width: isSmallScreen ? '100%' : 'calc(50% - 4px)',
    padding: 12,
    borderRadius: 8,
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
    marginBottom: 4,
  },
  animationName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e4e4e7',
    fontFamily: 'monospace',
  },
  animationNameActive: {
    color: '#c4b5fd',
  },
  animationDescription: {
    fontSize: 11,
    color: '#71717a',
    lineHeight: 15,
  },
  controlGroup: {
    marginBottom: 20,
  },
  controlGroupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e4e4e7',
    marginBottom: 10,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#27272a',
    alignItems: 'center',
    minWidth: 80,
  },
  optionButtonActive: {
    borderColor: '#8b5cf6',
    backgroundColor: '#1e1b4b',
  },
  optionIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  optionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  optionButtonTextActive: {
    color: '#c4b5fd',
  },
  optionDescription: {
    fontSize: 9,
    color: '#71717a',
    marginTop: 2,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: '#ffffff',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetButton: {
    width: isSmallScreen ? 'calc(33.33% - 7px)' : 'calc(33.33% - 7px)',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#27272a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  presetIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a1a1aa',
    textAlign: 'center',
  },
});

export default AnimationsScreen;
