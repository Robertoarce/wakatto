import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../constants/Layout';
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
  NoseState,
  CheekState,
  ForeheadState,
  JawState,
  VisualEffect,
  ModelStyle
} from '../components/CharacterDisplay3D';
import { getCharacter, CharacterBehavior } from '../config/characters';
import { Card, Badge } from '../components/ui';
import { useCharacterLoading } from '../components/ChatInterface/hooks/useCharacterLoading';
import { expandExpression, getCanonicalExpressions } from '../services/animationOrchestration';
import { getTalkingSoundsService, TALKING_SOUND_TYPES, TalkingSoundType } from '../services/talkingSoundsService';

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
  { name: 'rub_eyes', description: 'Tiredly rubbing eyes', category: 'Idle' },
  
  // Processing/thinking animations
  { name: 'head_tilt', description: 'Curious head tilt to the side', category: 'Processing' },
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
  { value: 'wide', label: 'Wide', icon: '😳' },
  { value: 'narrow', label: 'Narrow/Squinting', icon: '😑' },
  { value: 'soft', label: 'Soft/Warm', icon: '😌' },
  { value: 'half_closed', label: 'Half Closed', icon: '😏' },
  { value: 'tearful', label: 'Tearful/Wet', icon: '🥺' },
];

// Mouth states
const MOUTH_STATES: { value: MouthState; label: string; icon: string }[] = [
  { value: 'closed', label: 'Closed', icon: '😐' },
  { value: 'open', label: 'Open', icon: '😮' },
  { value: 'smile', label: 'Smile', icon: '🙂' },
  { value: 'wide_smile', label: 'Wide Smile', icon: '😄' },
  { value: 'surprised', label: 'Surprised', icon: '😲' },
  { value: 'smirk', label: 'Smirk', icon: '😏' },
  { value: 'slight_smile', label: 'Slight Smile', icon: '🙂' },
  { value: 'sad_smile', label: 'Sad Smile', icon: '🙁' },
  { value: 'grimace', label: 'Grimace', icon: '😬' },
  { value: 'tense', label: 'Tense/Pressed', icon: '😑' },
  { value: 'kiss', label: 'Kiss Lips', icon: '😘' },
  { value: 'teeth_showing', label: 'Teeth Showing', icon: '😬' },
  { value: 'big_grin', label: 'Big Grin', icon: '😃' },
  { value: 'o_shape', label: 'O-Shape', icon: '😯' },
];

// Visual effects
const VISUAL_EFFECTS: { value: VisualEffect; label: string; icon: string }[] = [
  { value: 'none', label: 'None', icon: '⚪' },
  { value: 'confetti', label: 'Confetti', icon: '🎊' },
  { value: 'spotlight', label: 'Spotlight', icon: '🔦' },
  { value: 'sparkles', label: 'Sparkles', icon: '✨' },
  { value: 'hearts', label: 'Hearts', icon: '💕' },
  // New emoji-triggered effects
  { value: 'fire', label: 'Fire', icon: '🔥' },
  { value: 'stars', label: 'Stars', icon: '⭐' },
  { value: 'music_notes', label: 'Music', icon: '🎵' },
  { value: 'tears', label: 'Tears', icon: '😢' },
  { value: 'anger', label: 'Anger', icon: '😡' },
  { value: 'snow', label: 'Snow', icon: '❄️' },
  { value: 'rainbow', label: 'Rainbow', icon: '🌈' },
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

// Talking sound types with descriptions and icons
const TALKING_SOUNDS: { value: TalkingSoundType; label: string; icon: string; description: string }[] = [
  { value: 'beep', label: 'Beep', icon: '🎮', description: 'Undertale-style' },
  { value: 'blip', label: 'Blip', icon: '🐾', description: 'Animal Crossing' },
  { value: 'bubble', label: 'Bubble', icon: '🫧', description: 'Bubbly & friendly' },
  { value: 'chime', label: 'Chime', icon: '🔔', description: 'Musical tones' },
  { value: 'chirp', label: 'Chirp', icon: '🐦', description: 'Bird-like' },
  { value: 'squeak', label: 'Squeak', icon: '🐭', description: 'Cute & squeaky' },
  { value: 'pop', label: 'Pop', icon: '💥', description: 'Popping sounds' },
  { value: 'click', label: 'Click', icon: '⌨️', description: 'Mechanical' },
  { value: 'whisper', label: 'Whisper', icon: '🌬️', description: 'Soft & airy' },
  { value: 'robotic', label: 'Robotic', icon: '🤖', description: 'Electronic' },
  { value: 'warm', label: 'Warm', icon: '☕', description: 'Resonant tones' },
  { value: 'crystal', label: 'Crystal', icon: '💎', description: 'Sparkly & clear' },
  { value: 'deep', label: 'Deep', icon: '🎸', description: 'Bass-heavy' },
  { value: 'playful', label: 'Playful', icon: '🎪', description: 'Bouncy & fun' },
  { value: 'mysterious', label: 'Mysterious', icon: '🔮', description: 'Ethereal' },
];

// Available preset characters (built-in only)
const PRESET_CHARACTERS = ['freud', 'adler'];

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
  { value: 'asymmetrical', label: 'Asymmetrical', icon: '🤨' },
  { value: 'slightly_raised', label: 'Slightly Raised', icon: '🙂' },
  { value: 'deeply_furrowed', label: 'Deeply Furrowed', icon: '😡' },
  { value: 'arched_high', label: 'Arched High', icon: '😲' },
  { value: 'relaxed_upward', label: 'Relaxed Upward', icon: '☺️' },
];

// Head styles (shape/size)
const HEAD_STYLES: { value: HeadStyle; label: string; icon: string; description: string }[] = [
  { value: 'default', label: 'Default', icon: '🟦', description: 'Standard cube' },
  { value: 'bigger', label: 'Bigger', icon: '🔷', description: 'Scaled up cube' },
];

// Face states (anime-style decorations)
const FACE_STATES: { value: FaceState; label: string; icon: string }[] = [
  { value: 'normal', label: 'Normal', icon: '😐' },
  { value: 'sweat_drop', label: 'Sweat Drop', icon: '😅' },
  { value: 'sparkle_eyes', label: 'Sparkle Eyes', icon: '🤩' },
  { value: 'heart_eyes', label: 'Heart Eyes', icon: '😍' },
  { value: 'spiral_eyes', label: 'Spiral Eyes', icon: '😵' },
  { value: 'tears', label: 'Tears', icon: '😭' },
  { value: 'anger_vein', label: 'Anger Vein', icon: '💢' },
];

// Nose states
const NOSE_STATES: { value: NoseState; label: string; icon: string }[] = [
  { value: 'neutral', label: 'Neutral', icon: '👃' },
  { value: 'wrinkled', label: 'Wrinkled', icon: '😖' },
  { value: 'flared', label: 'Flared', icon: '😤' },
  { value: 'twitching', label: 'Twitching', icon: '😬' },
];

// Cheek states
const CHEEK_STATES: { value: CheekState; label: string; icon: string }[] = [
  { value: 'neutral', label: 'Neutral', icon: '😐' },
  { value: 'flushed', label: 'Flushed/Blush', icon: '😊' },
  { value: 'sunken', label: 'Sunken', icon: '😔' },
  { value: 'puffed', label: 'Puffed', icon: '😋' },
  { value: 'dimpled', label: 'Dimpled', icon: '😁' },
];

// Forehead states
const FOREHEAD_STATES: { value: ForeheadState; label: string; icon: string }[] = [
  { value: 'smooth', label: 'Smooth', icon: '😌' },
  { value: 'wrinkled', label: 'Wrinkled', icon: '😟' },
  { value: 'tense', label: 'Tense', icon: '😠' },
  { value: 'raised', label: 'Raised', icon: '😮' },
];

// Jaw states
const JAW_STATES: { value: JawState; label: string; icon: string }[] = [
  { value: 'relaxed', label: 'Relaxed', icon: '😐' },
  { value: 'clenched', label: 'Clenched', icon: '😬' },
  { value: 'protruding', label: 'Protruding', icon: '😤' },
  { value: 'slack', label: 'Slack', icon: '😲' },
];

interface AnimationsScreenProps {
  onNavigateToChat?: (params?: { triggerTestPoem?: boolean }) => void;
}

const AnimationsScreen = ({ onNavigateToChat }: AnimationsScreenProps): JSX.Element => {
  const { fonts, spacing, layout, isMobile, isTablet, width: screenWidth, height: screenHeight } = useResponsive();
  const { availableCharacters, isLoadingCharacters } = useCharacterLoading();

  // Responsive layout calculations
  const isSmallScreen = isMobile || isTablet;

  // Dynamic styles based on responsive values
  const dynamicStyles = useMemo(() => ({
    content: {
      flex: 1,
      flexDirection: (isSmallScreen ? 'column' : 'row') as 'column' | 'row',
    },
    previewSection: {
      width: isSmallScreen ? '100%' as const : '35%' as const,
      padding: spacing.sm,
    },
    characterPreview: {
      height: isSmallScreen ? Math.floor(screenHeight * 0.40) : Math.floor(screenHeight * 0.50),
      borderRadius: spacing.sm,
      overflow: 'hidden' as const,
      backgroundColor: '#1a1a1a',
      marginBottom: spacing.sm,
    },
    controlsSection: {
      flex: 1,
      padding: spacing.sm,
      paddingLeft: isSmallScreen ? spacing.sm : 0,
    },
    header: {
      padding: spacing.lg,
      paddingTop: spacing.xl,
      backgroundColor: '#111111',
      borderBottomWidth: 1,
      borderBottomColor: '#27272a',
    },
    title: {
      fontSize: fonts.xxl,
      fontWeight: 'bold' as const,
      color: '#ffffff',
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: fonts.sm,
      color: '#71717a',
    },
    sectionTitle: {
      fontSize: fonts.md,
      fontWeight: '600' as const,
      color: '#e4e4e7',
      marginBottom: spacing.sm,
    },
    stateLabel: {
      fontSize: fonts.xs,
      color: '#71717a',
      textTransform: 'uppercase' as const,
    },
    selectorLabel: {
      fontSize: fonts.xs,
      color: '#71717a',
      marginBottom: spacing.xs,
      textTransform: 'uppercase' as const,
    },
    characterButtonText: {
      fontSize: fonts.sm,
      fontWeight: '600' as const,
      color: '#a1a1aa',
    },
    quickButtonText: {
      fontSize: fonts.sm,
      fontWeight: '600' as const,
      color: '#71717a',
    },
    tabText: {
      fontSize: fonts.sm,
      fontWeight: '600' as const,
      color: '#71717a',
    },
    categoryChipText: {
      fontSize: fonts.sm,
      color: '#a1a1aa',
    },
    animationName: {
      fontSize: fonts.md,
      fontWeight: '600' as const,
      color: '#ffffff',
    },
    animationDescription: {
      fontSize: fonts.xs,
      color: '#71717a',
    },
    optionLabel: {
      fontSize: fonts.xs,
      fontWeight: '600' as const,
      color: '#71717a',
      textTransform: 'uppercase' as const,
    },
    colorButton: {
      width: layout.minTouchTarget,
      height: layout.minTouchTarget,
      borderRadius: layout.minTouchTarget / 2,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    presetText: {
      fontSize: fonts.xs,
      color: '#a1a1aa',
      textAlign: 'center' as const,
    },
    // Extended responsive styles
    testButtonText: {
      fontSize: fonts.sm,
      fontWeight: '600' as const,
      color: '#ffffff',
    },
    styleIcon: {
      fontSize: fonts.md,
    },
    controlGroupTitle: {
      fontSize: fonts.md,
      fontWeight: '700' as const,
      color: '#e4e4e7',
      marginBottom: spacing.sm,
    },
    controlGroupSubtitle: {
      fontSize: fonts.sm,
      color: '#71717a',
      marginBottom: spacing.md,
    },
    optionIcon: {
      fontSize: fonts.lg,
      marginBottom: spacing.xs / 2,
    },
    optionButtonText: {
      fontSize: fonts.xs,
      fontWeight: '600' as const,
      color: '#a1a1aa',
    },
    optionDescription: {
      fontSize: fonts.xs * 0.82,
      color: '#71717a',
      marginTop: spacing.xs / 2,
    },
    presetIcon: {
      fontSize: fonts.xxl,
      marginBottom: spacing.xs,
    },
    testPoemButtonText: {
      fontSize: fonts.md,
      fontWeight: '600' as const,
      color: '#ffffff',
    },
  }), [fonts, spacing, layout, isSmallScreen, screenHeight]);

  // Base animation state
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState>('idle');
  const [isTalking, setIsTalking] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null); // null = custom mode
  const [customCharacterId, setCustomCharacterId] = useState<string>('adler'); // Default custom selection
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedModelStyle, setSelectedModelStyle] = useState<ModelStyle>('blocky');

  // Get the actual character ID to display (custom or preset)
  const activeCharacterId = selectedCharacter ?? customCharacterId;

  // Complementary animation state
  const [lookDirection, setLookDirection] = useState<LookDirection>('center');
  const [eyeState, setEyeState] = useState<EyeState>('open');
  const [eyebrowState, setEyebrowState] = useState<EyebrowState>('normal');
  const [headStyle, setHeadStyle] = useState<HeadStyle>('default');
  const [mouthState, setMouthState] = useState<MouthState>('closed');
  const [faceState, setFaceState] = useState<FaceState>('normal');
  const [noseState, setNoseState] = useState<NoseState>('neutral');
  const [cheekState, setCheekState] = useState<CheekState>('neutral');
  const [foreheadState, setForeheadState] = useState<ForeheadState>('smooth');
  const [jawState, setJawState] = useState<JawState>('relaxed');
  const [effect, setEffect] = useState<VisualEffect>('none');
  const [speed, setSpeed] = useState(1.0);
  const [effectColor, setEffectColor] = useState('#8b5cf6');

  // Tab state - default to complementary
  const [activeTab, setActiveTab] = useState<'base' | 'complementary' | 'sounds'>('base');

  // Expression preset state
  const [selectedExpression, setSelectedExpression] = useState<string | null>(null);

  // Talking sounds state
  const [selectedSoundType, setSelectedSoundType] = useState<TalkingSoundType>('blip');
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const soundsService = getTalkingSoundsService();

  // Load character's default sound when character changes
  useEffect(() => {
    const char = getCharacter(activeCharacterId);
    if (char?.voiceProfile?.talkingSound) {
      setSelectedSoundType(char.voiceProfile.talkingSound);
    }
  }, [activeCharacterId]);

  // Play a test sound
  const playTestSound = (soundType: TalkingSoundType) => {
    setSelectedSoundType(soundType);
    soundsService.playDirect({ type: soundType, volume: soundVolume });
  };

  // Play a sequence of sounds (simulating talking)
  const playTalkingDemo = (soundType: TalkingSoundType) => {
    setSelectedSoundType(soundType);
    // Play 5-8 sounds in sequence to simulate talking
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        soundsService.playDirect({ type: soundType, volume: soundVolume });
      }, i * 80);
    }
  };

  // Toggle sounds enabled
  const toggleSounds = () => {
    const newEnabled = !soundsEnabled;
    setSoundsEnabled(newEnabled);
    soundsService.setEnabled(newEnabled);
  };

  // Update volume
  const updateVolume = (vol: number) => {
    setSoundVolume(vol);
    soundsService.setVolume(vol);
  };

  // Get all canonical expression names (no aliases - clean UI)
  const expressionNames = getCanonicalExpressions();

  // Apply expression preset to individual states
  const applyExpression = (expressionName: string) => {
    const expanded = expandExpression(expressionName);
    setSelectedExpression(expressionName);

    // Apply each state from the expression
    if (expanded.ey) setEyeState(expanded.ey as EyeState);
    if (expanded.eb) setEyebrowState(expanded.eb as EyebrowState);
    if (expanded.m) setMouthState(expanded.m as MouthState);
    if (expanded.fc) setFaceState(expanded.fc as FaceState);
    if (expanded.n) setNoseState(expanded.n as NoseState);
    if (expanded.ck) setCheekState(expanded.ck as CheekState);
    if (expanded.fh) setForeheadState(expanded.fh as ForeheadState);
    if (expanded.j) setJawState(expanded.j as JawState);
  };

  const character = getCharacter(activeCharacterId);
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
    noseState: noseState !== 'neutral' ? noseState : undefined,
    cheekState: cheekState !== 'neutral' ? cheekState : undefined,
    foreheadState: foreheadState !== 'smooth' ? foreheadState : undefined,
    jawState: jawState !== 'relaxed' ? jawState : undefined,
    effect: effect !== 'none' ? effect : undefined,
    effectColor,
    speed,
  };

  // Reset complementary to defaults
  const resetComplementary = () => {
    setSelectedExpression(null);
    setLookDirection('center');
    setEyeState('open');
    setEyebrowState('normal');
    setHeadStyle('default');
    setMouthState('closed');
    setFaceState('normal');
    setNoseState('neutral');
    setCheekState('neutral');
    setForeheadState('smooth');
    setJawState('relaxed');
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
      <View style={dynamicStyles.content}>
        {/* 3D Character Preview */}
        <View style={dynamicStyles.previewSection}>
          <Card variant="elevated" style={styles.previewCard}>
            <View style={dynamicStyles.characterPreview}>
              <CharacterDisplay3D
                characterId={activeCharacterId}
                isActive={true}
                animation={currentAnimation}
                isTalking={isTalking}
                complementary={complementary}
                modelStyle={selectedModelStyle}
                fov={25}
                cameraX={0}
                cameraY={0.7}
                characterY={-0.3}
                characterX={-0.3}
              />
            </View>
            
            {/* Current state info */}
            <View style={styles.stateInfo}>
              <View style={styles.stateRow}>
                <Text style={dynamicStyles.stateLabel}>Animation:</Text>
                <Badge label={currentAnimation} variant="primary" size="md" />
              </View>
              <View style={styles.stateRow}>
                <Text style={dynamicStyles.stateLabel}>Speed:</Text>
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
              <Text style={dynamicStyles.selectorLabel}>Character:</Text>
              <View style={styles.characterButtons}>
                {/* Custom button (default) */}
                <TouchableOpacity
                  style={[
                    styles.characterButton,
                    selectedCharacter === null && styles.characterButtonActive,
                    { borderColor: character?.color || '#8b5cf6' }
                  ]}
                  onPress={() => setShowCustomPicker(true)}
                >
                  <Text style={[
                    dynamicStyles.characterButtonText,
                    selectedCharacter === null && { color: character?.color || '#8b5cf6' }
                  ]}>
                    {selectedCharacter === null ? (character?.name || 'Custom') : 'Custom'}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={selectedCharacter === null ? (character?.color || '#8b5cf6') : '#71717a'} />
                </TouchableOpacity>
                {/* Preset characters */}
                {PRESET_CHARACTERS.map((charId) => {
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
                        dynamicStyles.characterButtonText,
                        selectedCharacter === charId && { color: char.color }
                      ]}>
                        {char.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
                <Text style={[dynamicStyles.quickButtonText, isTalking && styles.quickButtonTextActive]}>
                  Talk
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickButton}
                onPress={resetComplementary}
              >
                <Ionicons name="refresh" size={18} color="#71717a" />
                <Text style={dynamicStyles.quickButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Controls Section */}
        <View style={dynamicStyles.controlsSection}>
          {/* Tab switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'base' && styles.tabActive]}
              onPress={() => setActiveTab('base')}
            >
              <Text style={[dynamicStyles.tabText, activeTab === 'base' && styles.tabTextActive]}>
                Animations
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'complementary' && styles.tabActive]}
              onPress={() => setActiveTab('complementary')}
            >
              <Text style={[dynamicStyles.tabText, activeTab === 'complementary' && styles.tabTextActive]}>
                Expressions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'sounds' && styles.tabActive]}
              onPress={() => setActiveTab('sounds')}
            >
              <Text style={[dynamicStyles.tabText, activeTab === 'sounds' && styles.tabTextActive]}>
                🔊 Sounds
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
                    <Text style={[dynamicStyles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
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
                        <Text style={[dynamicStyles.categoryChipText, selectedCategory === category && styles.categoryChipTextActive]}>
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
                        // Responsive: single column on very narrow screens (< 380px)
                        { flexBasis: screenWidth < 380 ? '100%' : '48%' },
                        currentAnimation === anim.name && styles.animationCardActive
                      ]}
                      onPress={() => setCurrentAnimation(anim.name)}
                    >
                      <View style={styles.animationCardHeader}>
                        <Text style={[
                          dynamicStyles.animationName,
                          currentAnimation === anim.name && styles.animationNameActive
                        ]}>
                          {anim.name}
                        </Text>
                        {currentAnimation === anim.name && (
                          <Ionicons name="checkmark-circle" size={16} color="#8b5cf6" />
                        )}
                      </View>
                      <Text style={dynamicStyles.animationDescription} numberOfLines={2}>
                        {anim.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : activeTab === 'complementary' ? (
              <>
                {/* Expression Presets */}
                <View style={styles.controlGroup}>
                  <Text style={dynamicStyles.controlGroupTitle}>🎭 Expression Presets ({expressionNames.length})</Text>
                  <Text style={dynamicStyles.controlGroupSubtitle}>
                    Quick-apply facial expressions used by AI
                  </Text>
                  <View style={styles.expressionGrid}>
                    {expressionNames.map((name) => (
                      <TouchableOpacity
                        key={name}
                        style={[
                          styles.expressionChip,
                          selectedExpression === name && styles.expressionChipActive
                        ]}
                        onPress={() => applyExpression(name)}
                      >
                        <Text style={[
                          styles.expressionChipText,
                          selectedExpression === name && styles.expressionChipTextActive
                        ]}>
                          {name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Speed Control */}
                <View style={styles.controlGroup}>
                  <Text style={dynamicStyles.controlGroupTitle}>⏱️ Animation Speed</Text>
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
                          dynamicStyles.optionButtonText,
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
                  <Text style={dynamicStyles.controlGroupTitle}>👁️ Look Direction</Text>
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
                        <Text style={dynamicStyles.optionIcon}>{dir.icon}</Text>
                        <Text style={[
                          dynamicStyles.optionButtonText,
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
                  <Text style={dynamicStyles.controlGroupTitle}>👀 Eye State</Text>
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
                        <Text style={dynamicStyles.optionIcon}>{eye.icon}</Text>
                        <Text style={[
                          dynamicStyles.optionButtonText,
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
                  <Text style={dynamicStyles.controlGroupTitle}>👄 Mouth State</Text>
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
                        <Text style={dynamicStyles.optionIcon}>{mouth.icon}</Text>
                        <Text style={[
                          dynamicStyles.optionButtonText,
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
                  <Text style={dynamicStyles.controlGroupTitle}>🎭 Eyebrow State</Text>
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
                        <Text style={dynamicStyles.optionIcon}>{brow.icon}</Text>
                        <Text style={[
                          dynamicStyles.optionButtonText,
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
                  <Text style={dynamicStyles.controlGroupTitle}>🗿 Head Style</Text>
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
                        <Text style={dynamicStyles.optionIcon}>{style.icon}</Text>
                        <Text style={[
                          dynamicStyles.optionButtonText,
                          headStyle === style.value && styles.optionButtonTextActive
                        ]}>
                          {style.label}
                        </Text>
                        <Text style={dynamicStyles.optionDescription}>{style.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Face State (Anime) */}
                <View style={styles.controlGroup}>
                  <Text style={dynamicStyles.controlGroupTitle}>✨ Face State (Anime)</Text>
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
                        <Text style={dynamicStyles.optionIcon}>{face.icon}</Text>
                        <Text style={[
                          dynamicStyles.optionButtonText,
                          faceState === face.value && styles.optionButtonTextActive
                        ]}>
                          {face.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Nose State */}
                <View style={styles.controlGroup}>
                  <Text style={dynamicStyles.controlGroupTitle}>👃 Nose State</Text>
                  <View style={styles.optionGrid}>
                    {NOSE_STATES.map((nose) => (
                      <TouchableOpacity
                        key={nose.value}
                        style={[
                          styles.optionButton,
                          noseState === nose.value && styles.optionButtonActive
                        ]}
                        onPress={() => setNoseState(nose.value)}
                      >
                        <Text style={dynamicStyles.optionIcon}>{nose.icon}</Text>
                        <Text style={[
                          dynamicStyles.optionButtonText,
                          noseState === nose.value && styles.optionButtonTextActive
                        ]}>
                          {nose.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Cheek State */}
                <View style={styles.controlGroup}>
                  <Text style={dynamicStyles.controlGroupTitle}>😊 Cheek State (blush migrated)</Text>
                  <View style={styles.optionGrid}>
                    {CHEEK_STATES.map((cheek) => (
                      <TouchableOpacity
                        key={cheek.value}
                        style={[
                          styles.optionButton,
                          cheekState === cheek.value && styles.optionButtonActive
                        ]}
                        onPress={() => setCheekState(cheek.value)}
                      >
                        <Text style={dynamicStyles.optionIcon}>{cheek.icon}</Text>
                        <Text style={[
                          dynamicStyles.optionButtonText,
                          cheekState === cheek.value && styles.optionButtonTextActive
                        ]}>
                          {cheek.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Forehead State */}
                <View style={styles.controlGroup}>
                  <Text style={dynamicStyles.controlGroupTitle}>😟 Forehead State</Text>
                  <View style={styles.optionGrid}>
                    {FOREHEAD_STATES.map((forehead) => (
                      <TouchableOpacity
                        key={forehead.value}
                        style={[
                          styles.optionButton,
                          foreheadState === forehead.value && styles.optionButtonActive
                        ]}
                        onPress={() => setForeheadState(forehead.value)}
                      >
                        <Text style={dynamicStyles.optionIcon}>{forehead.icon}</Text>
                        <Text style={[
                          dynamicStyles.optionButtonText,
                          foreheadState === forehead.value && styles.optionButtonTextActive
                        ]}>
                          {forehead.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Jaw State */}
                <View style={styles.controlGroup}>
                  <Text style={dynamicStyles.controlGroupTitle}>😬 Jaw State</Text>
                  <View style={styles.optionGrid}>
                    {JAW_STATES.map((jaw) => (
                      <TouchableOpacity
                        key={jaw.value}
                        style={[
                          styles.optionButton,
                          jawState === jaw.value && styles.optionButtonActive
                        ]}
                        onPress={() => setJawState(jaw.value)}
                      >
                        <Text style={dynamicStyles.optionIcon}>{jaw.icon}</Text>
                        <Text style={[
                          dynamicStyles.optionButtonText,
                          jawState === jaw.value && styles.optionButtonTextActive
                        ]}>
                          {jaw.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Visual Effects */}
                <View style={styles.controlGroup}>
                  <Text style={dynamicStyles.controlGroupTitle}>✨ Visual Effects</Text>
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
                        <Text style={dynamicStyles.optionIcon}>{fx.icon}</Text>
                        <Text style={[
                          dynamicStyles.optionButtonText,
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
                    <Text style={dynamicStyles.controlGroupTitle}>🎨 Effect Color</Text>
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
                  <Text style={dynamicStyles.controlGroupTitle}>⚡ Quick Presets</Text>
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
                      <Text style={dynamicStyles.presetIcon}>🎉</Text>
                      <Text style={dynamicStyles.presetText}>Celebration</Text>
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
                      <Text style={dynamicStyles.presetIcon}>🤔</Text>
                      <Text style={dynamicStyles.presetText}>Deep Thought</Text>
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
                      <Text style={dynamicStyles.presetIcon}>🎤</Text>
                      <Text style={dynamicStyles.presetText}>Presenting</Text>
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
                      <Text style={dynamicStyles.presetIcon}>😍</Text>
                      <Text style={dynamicStyles.presetText}>Love</Text>
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
                      <Text style={dynamicStyles.presetIcon}>🤨</Text>
                      <Text style={dynamicStyles.presetText}>Skeptical</Text>
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
                      <Text style={dynamicStyles.presetIcon}>🏆</Text>
                      <Text style={dynamicStyles.presetText}>Victory</Text>
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
                      <Text style={dynamicStyles.presetIcon}>😱</Text>
                      <Text style={dynamicStyles.presetText}>Shocked</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ height: 150, marginBottom: 20 }} />
              </>
            ) : activeTab === 'sounds' ? (
              <>
                {/* Sounds Enable/Disable */}
                <View style={styles.controlGroup}>
                  <Text style={dynamicStyles.controlGroupTitle}>🎛️ Sound Settings</Text>
                  <View style={styles.soundSettingsRow}>
                    <TouchableOpacity
                      style={[
                        styles.soundToggleButton,
                        soundsEnabled ? styles.soundToggleEnabled : styles.soundToggleDisabled
                      ]}
                      onPress={toggleSounds}
                    >
                      <Ionicons
                        name={soundsEnabled ? "volume-high" : "volume-mute"}
                        size={20}
                        color={soundsEnabled ? "#10b981" : "#71717a"}
                      />
                      <Text style={[
                        styles.soundToggleText,
                        soundsEnabled && styles.soundToggleTextEnabled
                      ]}>
                        {soundsEnabled ? 'Sounds ON' : 'Sounds OFF'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Volume Control */}
                <View style={styles.controlGroup}>
                  <Text style={dynamicStyles.controlGroupTitle}>🔊 Volume</Text>
                  <View style={styles.volumeRow}>
                    {[0.25, 0.5, 0.75, 1.0].map((vol) => (
                      <TouchableOpacity
                        key={vol}
                        style={[
                          styles.volumeButton,
                          soundVolume === vol && styles.volumeButtonActive
                        ]}
                        onPress={() => updateVolume(vol)}
                      >
                        <Text style={[
                          styles.volumeButtonText,
                          soundVolume === vol && styles.volumeButtonTextActive
                        ]}>
                          {Math.round(vol * 100)}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Sound Types Grid */}
                <View style={styles.controlGroup}>
                  <Text style={dynamicStyles.controlGroupTitle}>🎵 Talking Sound Types</Text>
                  <Text style={dynamicStyles.controlGroupSubtitle}>
                    Tap to preview • Long-press for talking demo
                  </Text>
                  <View style={styles.soundsGrid}>
                    {TALKING_SOUNDS.map((sound) => (
                      <TouchableOpacity
                        key={sound.value}
                        style={[
                          styles.soundCard,
                          selectedSoundType === sound.value && styles.soundCardActive
                        ]}
                        onPress={() => playTestSound(sound.value)}
                        onLongPress={() => playTalkingDemo(sound.value)}
                        delayLongPress={300}
                      >
                        <Text style={styles.soundIcon}>{sound.icon}</Text>
                        <Text style={[
                          styles.soundName,
                          selectedSoundType === sound.value && styles.soundNameActive
                        ]}>
                          {sound.label}
                        </Text>
                        <Text style={styles.soundDescription}>{sound.description}</Text>
                        {selectedSoundType === sound.value && (
                          <View style={styles.soundActiveIndicator}>
                            <Ionicons name="checkmark-circle" size={14} color="#8b5cf6" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Demo Button */}
                <View style={styles.controlGroup}>
                  <Text style={dynamicStyles.controlGroupTitle}>🎤 Test with Talking</Text>
                  <Text style={dynamicStyles.controlGroupSubtitle}>
                    Enable "Talk" mode above and select a sound to hear it during animation
                  </Text>
                  <TouchableOpacity
                    style={styles.demoButton}
                    onPress={() => {
                      setIsTalking(true);
                      setCurrentAnimation('talking');
                      playTalkingDemo(selectedSoundType);
                    }}
                  >
                    <Ionicons name="play-circle" size={24} color="#ffffff" />
                    <Text style={styles.demoButtonText}>Play Talking Demo</Text>
                  </TouchableOpacity>
                </View>

                {/* Character Sound Info */}
                <View style={styles.controlGroup}>
                  <Text style={dynamicStyles.controlGroupTitle}>📝 Character Default Sounds</Text>
                  <Text style={dynamicStyles.controlGroupSubtitle}>
                    Each wakattor has a unique talking sound based on their personality
                  </Text>
                  <View style={styles.characterSoundsList}>
                    <View style={styles.characterSoundRow}>
                      <Text style={styles.characterSoundName}>☕ Freud</Text>
                      <Badge label="warm" variant="secondary" size="sm" />
                    </View>
                    <View style={styles.characterSoundRow}>
                      <Text style={styles.characterSoundName}>🔮 Jung</Text>
                      <Badge label="mysterious" variant="secondary" size="sm" />
                    </View>
                    <View style={styles.characterSoundRow}>
                      <Text style={styles.characterSoundName}>⌨️ Adler</Text>
                      <Badge label="click" variant="secondary" size="sm" />
                    </View>
                    <View style={styles.characterSoundRow}>
                      <Text style={styles.characterSoundName}>🔔 Seligman</Text>
                      <Badge label="chime" variant="secondary" size="sm" />
                    </View>
                    <View style={styles.characterSoundRow}>
                      <Text style={styles.characterSoundName}>🫧 Brown</Text>
                      <Badge label="bubble" variant="secondary" size="sm" />
                    </View>
                    <View style={styles.characterSoundRow}>
                      <Text style={styles.characterSoundName}>🎸 Frankl</Text>
                      <Badge label="deep" variant="secondary" size="sm" />
                    </View>
                    <View style={styles.characterSoundRow}>
                      <Text style={styles.characterSoundName}>🌬️ Epictetus</Text>
                      <Badge label="whisper" variant="secondary" size="sm" />
                    </View>
                    <View style={styles.characterSoundRow}>
                      <Text style={styles.characterSoundName}>🎮 Nietzsche</Text>
                      <Badge label="beep" variant="secondary" size="sm" />
                    </View>
                    <View style={styles.characterSoundRow}>
                      <Text style={styles.characterSoundName}>🎪 Csikszentmihalyi</Text>
                      <Badge label="playful" variant="secondary" size="sm" />
                    </View>
                    <View style={styles.characterSoundRow}>
                      <Text style={styles.characterSoundName}>🐾 Bob</Text>
                      <Badge label="blip" variant="secondary" size="sm" />
                    </View>
                    <View style={styles.characterSoundRow}>
                      <Text style={styles.characterSoundName}>💥 Blackbeard</Text>
                      <Badge label="pop" variant="secondary" size="sm" />
                    </View>
                  </View>
                </View>

                <View style={{ height: 150, marginBottom: 20 }} />
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>

      {/* Custom Character Picker Modal */}
      <Modal
        visible={showCustomPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCustomPicker(false)}
        >
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Character</Text>
              <TouchableOpacity onPress={() => setShowCustomPicker(false)}>
                <Ionicons name="close" size={24} color="#71717a" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
              {availableCharacters.map((char) => (
                <TouchableOpacity
                  key={char.id}
                  style={[
                    styles.pickerItem,
                    customCharacterId === char.id && styles.pickerItemActive
                  ]}
                  onPress={() => {
                    setCustomCharacterId(char.id);
                    setSelectedCharacter(null); // Switch to custom mode
                    setShowCustomPicker(false);
                  }}
                >
                  <View style={[styles.pickerColorDot, { backgroundColor: char.color }]} />
                  <View style={styles.pickerItemText}>
                    <Text style={[
                      styles.pickerItemName,
                      customCharacterId === char.id && { color: char.color }
                    ]}>
                      {char.name}
                    </Text>
                    <Text style={styles.pickerItemRole}>{char.role}</Text>
                  </View>
                  {customCharacterId === char.id && (
                    <Ionicons name="checkmark-circle" size={20} color={char.color} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

// Static styles - dynamic styles are computed inside the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '600',
    color: '#ffffff',
  },
  previewCard: {
    padding: 8,
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
    color: '#71717a',
    textTransform: 'uppercase',
  },
  characterSelector: {
    marginBottom: 12,
  },
  selectorLabel: {
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
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  characterButtonActive: {
    backgroundColor: '#1e1b4b',
  },
  characterButtonText: {
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
  quickControls: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
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
    fontWeight: '600',
    color: '#71717a',
  },
  quickButtonTextActive: {
    color: '#10b981',
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
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#8b5cf6',
  },
  tabText: {
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  categoryChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  categoryChipText: {
    fontWeight: '600',
    color: '#a1a1aa',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  // Expression preset styles
  expressionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  expressionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  expressionChipActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  expressionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  expressionChipTextActive: {
    color: '#ffffff',
  },
  animationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 80,
  },
  animationCard: {
    flexBasis: '48%',
    flexGrow: 0,
    padding: 8,
    borderRadius: 6,
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
    fontWeight: '700',
    color: '#e4e4e7',
    fontFamily: 'monospace',
  },
  animationNameActive: {
    color: '#c4b5fd',
  },
  animationDescription: {
    color: '#71717a',
    lineHeight: 15,
  },
  controlGroup: {
    marginBottom: 20,
  },
  controlGroupTitle: {
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 65,
    minHeight: 44,
  },
  optionButtonActive: {
    borderColor: '#8b5cf6',
    backgroundColor: '#1e1b4b',
  },
  optionIcon: {
    marginBottom: 2,
  },
  optionButtonText: {
    fontWeight: '600',
    color: '#a1a1aa',
  },
  optionButtonTextActive: {
    color: '#c4b5fd',
  },
  optionDescription: {
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
    flexBasis: '30%',
    flexGrow: 0,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#27272a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  presetIcon: {
    marginBottom: 6,
  },
  presetText: {
    fontWeight: '600',
    color: '#a1a1aa',
    textAlign: 'center',
  },
  // Speech bubble speed demo styles
  controlGroupSubtitle: {
    color: '#71717a',
    marginBottom: 12,
  },
  testPoemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
  },
  testPoemButtonText: {
    fontWeight: '600',
    color: '#ffffff',
  },
  // Modal styles for character picker
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  pickerList: {
    padding: 8,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  pickerItemActive: {
    backgroundColor: '#27272a',
  },
  pickerColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  pickerItemText: {
    flex: 1,
  },
  pickerItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e4e4e7',
  },
  pickerItemRole: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  // Sounds tab styles
  soundSettingsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  soundToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#3f3f46',
  },
  soundToggleEnabled: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  soundToggleDisabled: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  soundToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717a',
  },
  soundToggleTextEnabled: {
    color: '#10b981',
  },
  volumeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  volumeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#27272a',
    alignItems: 'center',
  },
  volumeButtonActive: {
    backgroundColor: '#1e1b4b',
    borderColor: '#8b5cf6',
  },
  volumeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  volumeButtonTextActive: {
    color: '#c4b5fd',
  },
  soundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  soundCard: {
    flexBasis: '31%',
    flexGrow: 0,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#27272a',
    alignItems: 'center',
    position: 'relative',
  },
  soundCardActive: {
    backgroundColor: '#1e1b4b',
    borderColor: '#8b5cf6',
  },
  soundIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  soundName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e4e4e7',
    textAlign: 'center',
  },
  soundNameActive: {
    color: '#c4b5fd',
  },
  soundDescription: {
    fontSize: 10,
    color: '#71717a',
    textAlign: 'center',
    marginTop: 2,
  },
  soundActiveIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  characterSoundsList: {
    backgroundColor: '#171717',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  characterSoundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  characterSoundName: {
    fontSize: 13,
    color: '#a1a1aa',
  },
});

export default AnimationsScreen;
