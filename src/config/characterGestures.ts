/**
 * Character Gestures & Body Language System
 *
 * Defines available physical and verbal gestures for multi-character conversations.
 * These gestures can be used by the LLM to add non-verbal communication.
 */

export type GestureCategory =
  | 'thinking'
  | 'agreeing'
  | 'disagreeing'
  | 'questioning'
  | 'emphasizing'
  | 'listening'
  | 'reacting'
  | 'interrupting'
  | 'concluding'
  | 'neutral';

export interface CharacterGesture {
  id: string;
  name: string;
  category: GestureCategory;
  description: string;
  animation?: string; // For 3D character animation
  intensity: 'subtle' | 'moderate' | 'strong';
}

/**
 * Complete list of available gestures
 */
export const CHARACTER_GESTURES: CharacterGesture[] = [
  // THINKING GESTURES
  {
    id: 'thinking_hand_on_chin',
    name: 'Hand on Chin',
    category: 'thinking',
    description: 'Thoughtfully rests hand on chin while contemplating',
    animation: 'thinking',
    intensity: 'moderate'
  },
  {
    id: 'thinking_look_away',
    name: 'Look Away Thoughtfully',
    category: 'thinking',
    description: 'Looks away briefly while considering the question',
    animation: 'thinking',
    intensity: 'subtle'
  },
  {
    id: 'thinking_finger_on_temple',
    name: 'Finger on Temple',
    category: 'thinking',
    description: 'Taps finger on temple indicating deep thought',
    animation: 'thinking',
    intensity: 'moderate'
  },
  {
    id: 'thinking_pause_collect',
    name: 'Pause to Collect Thoughts',
    category: 'thinking',
    description: 'Brief pause before speaking, collecting thoughts',
    animation: 'thinking',
    intensity: 'subtle'
  },
  {
    id: 'thinking_lean_back',
    name: 'Lean Back Thoughtfully',
    category: 'thinking',
    description: 'Leans back in contemplation',
    animation: 'lean_back',
    intensity: 'moderate'
  },
  {
    id: 'thinking_stroke_beard',
    name: 'Stroke Beard/Face',
    category: 'thinking',
    description: 'Strokes beard or face while pondering',
    animation: 'thinking',
    intensity: 'moderate'
  },

  // AGREEING GESTURES
  {
    id: 'agree_nod',
    name: 'Nod',
    category: 'agreeing',
    description: 'Nods head in agreement',
    animation: 'talking', // Use talking with head bob
    intensity: 'subtle'
  },
  {
    id: 'agree_nod_enthusiastic',
    name: 'Enthusiastic Nod',
    category: 'agreeing',
    description: 'Nods head enthusiastically multiple times',
    animation: 'happy',
    intensity: 'moderate'
  },
  {
    id: 'agree_smile',
    name: 'Smile and Nod',
    category: 'agreeing',
    description: 'Smiles warmly while nodding in agreement',
    animation: 'happy',
    intensity: 'moderate'
  },
  {
    id: 'agree_gesture_support',
    name: 'Supportive Hand Gesture',
    category: 'agreeing',
    description: 'Open hand gesture showing support',
    animation: 'talking',
    intensity: 'moderate'
  },
  {
    id: 'agree_lean_forward',
    name: 'Lean Forward in Agreement',
    category: 'agreeing',
    description: 'Leans forward showing engagement and agreement',
    animation: 'lean_forward',
    intensity: 'moderate'
  },
  {
    id: 'agree_point_affirm',
    name: 'Point Affirmatively',
    category: 'agreeing',
    description: 'Points finger in affirmation (not aggressive)',
    animation: 'talking',
    intensity: 'moderate'
  },

  // DISAGREEING GESTURES
  {
    id: 'disagree_shake_head',
    name: 'Shake Head',
    category: 'disagreeing',
    description: 'Shakes head gently in disagreement',
    animation: 'confused',
    intensity: 'subtle'
  },
  {
    id: 'disagree_raise_hand',
    name: 'Raise Hand to Object',
    category: 'disagreeing',
    description: 'Raises hand politely to object',
    animation: 'talking',
    intensity: 'moderate'
  },
  {
    id: 'disagree_lean_back',
    name: 'Lean Back Skeptically',
    category: 'disagreeing',
    description: 'Leans back with slight skepticism',
    animation: 'lean_back',
    intensity: 'subtle'
  },
  {
    id: 'disagree_frown_slight',
    name: 'Slight Frown',
    category: 'disagreeing',
    description: 'Shows slight frown of disagreement',
    animation: 'confused',
    intensity: 'subtle'
  },
  {
    id: 'disagree_cross_arms',
    name: 'Cross Arms',
    category: 'disagreeing',
    description: 'Crosses arms showing reservation',
    animation: 'cross_arms',
    intensity: 'moderate'
  },
  {
    id: 'disagree_wave_hand',
    name: 'Wave Hand Dismissively',
    category: 'disagreeing',
    description: 'Waves hand gently to dismiss a point',
    animation: 'talking',
    intensity: 'moderate'
  },

  // QUESTIONING GESTURES
  {
    id: 'question_tilt_head',
    name: 'Tilt Head Curiously',
    category: 'questioning',
    description: 'Tilts head showing curiosity',
    animation: 'confused',
    intensity: 'subtle'
  },
  {
    id: 'question_raise_eyebrow',
    name: 'Raise Eyebrow',
    category: 'questioning',
    description: 'Raises eyebrow questioningly',
    animation: 'confused',
    intensity: 'subtle'
  },
  {
    id: 'question_hand_gesture',
    name: 'Open Hand Question',
    category: 'questioning',
    description: 'Opens hands in questioning gesture',
    animation: 'talking',
    intensity: 'moderate'
  },
  {
    id: 'question_lean_forward',
    name: 'Lean Forward Inquiringly',
    category: 'questioning',
    description: 'Leans forward with curiosity',
    animation: 'lean_forward',
    intensity: 'moderate'
  },
  {
    id: 'question_scratch_head',
    name: 'Scratch Head in Confusion',
    category: 'questioning',
    description: 'Scratches head showing puzzlement',
    animation: 'confused',
    intensity: 'moderate'
  },

  // EMPHASIZING GESTURES
  {
    id: 'emphasize_point_finger',
    name: 'Point for Emphasis',
    category: 'emphasizing',
    description: 'Points finger to emphasize a point',
    animation: 'talking',
    intensity: 'strong'
  },
  {
    id: 'emphasize_hand_chop',
    name: 'Hand Chop Gesture',
    category: 'emphasizing',
    description: 'Chops hand for emphasis',
    animation: 'excited',
    intensity: 'strong'
  },
  {
    id: 'emphasize_lean_forward',
    name: 'Lean Forward Intently',
    category: 'emphasizing',
    description: 'Leans forward to emphasize importance',
    animation: 'lean_forward',
    intensity: 'strong'
  },
  {
    id: 'emphasize_both_hands',
    name: 'Both Hands Gesture',
    category: 'emphasizing',
    description: 'Uses both hands to emphasize point',
    animation: 'excited',
    intensity: 'strong'
  },
  {
    id: 'emphasize_tap_table',
    name: 'Tap Table for Emphasis',
    category: 'emphasizing',
    description: 'Taps table/surface to emphasize',
    animation: 'point',
    intensity: 'strong'
  },
  {
    id: 'emphasize_stand_gesture',
    name: 'Stand and Gesture',
    category: 'emphasizing',
    description: 'Stands up briefly to emphasize importance',
    animation: 'excited',
    intensity: 'strong'
  },

  // LISTENING GESTURES
  {
    id: 'listen_attentive',
    name: 'Attentive Posture',
    category: 'listening',
    description: 'Sits attentively while listening',
    animation: 'idle',
    intensity: 'subtle'
  },
  {
    id: 'listen_nod_understanding',
    name: 'Nod While Listening',
    category: 'listening',
    description: 'Nods occasionally showing understanding',
    animation: 'talking',
    intensity: 'subtle'
  },
  {
    id: 'listen_lean_in',
    name: 'Lean In to Listen',
    category: 'listening',
    description: 'Leans in showing interest',
    animation: 'lean_forward',
    intensity: 'moderate'
  },
  {
    id: 'listen_hand_on_chin',
    name: 'Hand on Chin While Listening',
    category: 'listening',
    description: 'Rests hand on chin while listening',
    animation: 'thinking',
    intensity: 'moderate'
  },
  {
    id: 'listen_maintain_eye_contact',
    name: 'Maintain Eye Contact',
    category: 'listening',
    description: 'Maintains steady eye contact',
    animation: 'idle',
    intensity: 'subtle'
  },

  // REACTING GESTURES
  {
    id: 'react_surprise',
    name: 'Surprised Reaction',
    category: 'reacting',
    description: 'Shows surprise at statement',
    animation: 'confused',
    intensity: 'moderate'
  },
  {
    id: 'react_laugh',
    name: 'Laugh',
    category: 'reacting',
    description: 'Laughs at comment',
    animation: 'happy',
    intensity: 'moderate'
  },
  {
    id: 'react_smile',
    name: 'Smile',
    category: 'reacting',
    description: 'Smiles in response',
    animation: 'happy',
    intensity: 'subtle'
  },
  {
    id: 'react_concerned',
    name: 'Show Concern',
    category: 'reacting',
    description: 'Shows concerned expression',
    animation: 'confused',
    intensity: 'moderate'
  },
  {
    id: 'react_eyes_widen',
    name: 'Eyes Widen',
    category: 'reacting',
    description: 'Eyes widen in realization',
    animation: 'surprise_happy',
    intensity: 'subtle'
  },
  {
    id: 'react_gasp',
    name: 'Small Gasp',
    category: 'reacting',
    description: 'Small gasp of realization',
    animation: 'surprise_jump',
    intensity: 'subtle'
  },

  // INTERRUPTING GESTURES
  {
    id: 'interrupt_raise_hand',
    name: 'Raise Hand to Interrupt',
    category: 'interrupting',
    description: 'Raises hand to interrupt politely',
    animation: 'talking',
    intensity: 'moderate'
  },
  {
    id: 'interrupt_lean_forward',
    name: 'Lean Forward to Interject',
    category: 'interrupting',
    description: 'Leans forward to interject',
    animation: 'lean_forward',
    intensity: 'strong'
  },
  {
    id: 'interrupt_gesture_stop',
    name: 'Stop Gesture',
    category: 'interrupting',
    description: 'Makes stop gesture to interject',
    animation: 'talking',
    intensity: 'strong'
  },
  {
    id: 'interrupt_clear_throat',
    name: 'Clear Throat',
    category: 'interrupting',
    description: 'Clears throat to get attention',
    animation: 'talking',
    intensity: 'subtle'
  },
  {
    id: 'interrupt_finger_up',
    name: 'Finger Up (Wait)',
    category: 'interrupting',
    description: 'Raises one finger asking to speak',
    animation: 'talking',
    intensity: 'moderate'
  },

  // CONCLUDING GESTURES
  {
    id: 'conclude_open_hands',
    name: 'Open Hands Conclusively',
    category: 'concluding',
    description: 'Opens both hands showing conclusion',
    animation: 'talking',
    intensity: 'moderate'
  },
  {
    id: 'conclude_lean_back',
    name: 'Lean Back Having Concluded',
    category: 'concluding',
    description: 'Leans back satisfied with conclusion',
    animation: 'lean_back',
    intensity: 'moderate'
  },
  {
    id: 'conclude_nod_firmly',
    name: 'Firm Nod',
    category: 'concluding',
    description: 'Nods firmly to conclude point',
    animation: 'talking',
    intensity: 'moderate'
  },
  {
    id: 'conclude_hands_together',
    name: 'Bring Hands Together',
    category: 'concluding',
    description: 'Brings hands together showing completion',
    animation: 'clap',
    intensity: 'moderate'
  },

  // NEUTRAL/IDLE GESTURES
  {
    id: 'neutral_standing',
    name: 'Standing Neutrally',
    category: 'neutral',
    description: 'Stands in neutral position',
    animation: 'idle',
    intensity: 'subtle'
  },
  {
    id: 'neutral_sitting',
    name: 'Sitting Comfortably',
    category: 'neutral',
    description: 'Sits comfortably',
    animation: 'idle',
    intensity: 'subtle'
  },
  {
    id: 'neutral_hands_folded',
    name: 'Hands Folded',
    category: 'neutral',
    description: 'Hands folded in neutral position',
    animation: 'idle',
    intensity: 'subtle'
  },
  {
    id: 'neutral_relaxed',
    name: 'Relaxed Posture',
    category: 'neutral',
    description: 'Relaxed, open posture',
    animation: 'idle',
    intensity: 'subtle'
  },

  // ADDITIONAL EXPRESSIVE GESTURES
  {
    id: 'express_shrug',
    name: 'Shrug',
    category: 'questioning',
    description: 'Shrugs shoulders showing uncertainty',
    animation: 'shrug',
    intensity: 'moderate'
  },
  {
    id: 'express_sigh',
    name: 'Sigh',
    category: 'reacting',
    description: 'Sighs in response',
    animation: 'lean_back',
    intensity: 'subtle'
  },
  {
    id: 'express_pace',
    name: 'Pace While Thinking',
    category: 'thinking',
    description: 'Paces back and forth while thinking',
    animation: 'walking',
    intensity: 'strong'
  },
  {
    id: 'express_excited_bounce',
    name: 'Excited Bounce',
    category: 'reacting',
    description: 'Bounces excitedly at idea',
    animation: 'excited',
    intensity: 'strong'
  },
  {
    id: 'express_palm_up',
    name: 'Palm Up (Offering)',
    category: 'agreeing',
    description: 'Offers palm up gesture showing openness',
    animation: 'talking',
    intensity: 'moderate'
  },
  {
    id: 'express_palm_down',
    name: 'Palm Down (Calming)',
    category: 'concluding',
    description: 'Palm down gesture showing calming/concluding',
    animation: 'talking',
    intensity: 'moderate'
  },
  {
    id: 'express_look_at_another',
    name: 'Look at Another Character',
    category: 'listening',
    description: 'Looks at another character while they speak',
    animation: 'idle',
    intensity: 'subtle'
  },
  {
    id: 'express_gesture_to_user',
    name: 'Gesture Toward User',
    category: 'emphasizing',
    description: 'Gestures toward user to include them',
    animation: 'talking',
    intensity: 'moderate'
  },

  // NEW EXPRESSIVE ANIMATIONS
  {
    id: 'express_facepalm',
    name: 'Facepalm',
    category: 'reacting',
    description: 'Hand to face showing frustration or disbelief',
    animation: 'facepalm',
    intensity: 'moderate'
  },
  {
    id: 'express_dance',
    name: 'Celebratory Dance',
    category: 'reacting',
    description: 'Dancing joyfully to celebrate',
    animation: 'dance',
    intensity: 'strong'
  },
  {
    id: 'express_laugh_hard',
    name: 'Laugh Out Loud',
    category: 'reacting',
    description: 'Laughing heartily with head back',
    animation: 'laugh',
    intensity: 'strong'
  },
  {
    id: 'express_cry',
    name: 'Cry',
    category: 'reacting',
    description: 'Shows sadness, crying',
    animation: 'cry',
    intensity: 'strong'
  },
  {
    id: 'express_angry',
    name: 'Show Anger',
    category: 'disagreeing',
    description: 'Displays anger with tense posture',
    animation: 'angry',
    intensity: 'strong'
  },
  {
    id: 'express_nervous',
    name: 'Act Nervous',
    category: 'reacting',
    description: 'Fidgets nervously, looks around',
    animation: 'nervous',
    intensity: 'moderate'
  },
  {
    id: 'express_celebrate',
    name: 'Celebrate Victory',
    category: 'reacting',
    description: 'Arms up celebration, jumping',
    animation: 'celebrate',
    intensity: 'strong'
  },
  {
    id: 'express_peek',
    name: 'Peek Curiously',
    category: 'questioning',
    description: 'Peeks to the side with curiosity',
    animation: 'peek',
    intensity: 'subtle'
  },
  {
    id: 'express_doze',
    name: 'Doze Off',
    category: 'reacting',
    description: 'Getting sleepy, head drooping',
    animation: 'doze',
    intensity: 'subtle'
  },
  {
    id: 'express_stretch',
    name: 'Stretch',
    category: 'neutral',
    description: 'Stretching arms up, yawning',
    animation: 'stretch',
    intensity: 'moderate'
  },
];

/**
 * Get gestures by category
 */
export function getGesturesByCategory(category: GestureCategory): CharacterGesture[] {
  return CHARACTER_GESTURES.filter(g => g.category === category);
}

/**
 * Get gesture by ID
 */
export function getGestureById(id: string): CharacterGesture | undefined {
  return CHARACTER_GESTURES.find(g => g.id === id);
}

/**
 * Get random gesture from category
 */
export function getRandomGestureFromCategory(category: GestureCategory): CharacterGesture {
  const gestures = getGesturesByCategory(category);
  return gestures[Math.floor(Math.random() * gestures.length)];
}

/**
 * Format gesture list for LLM prompt
 */
export function formatGesturesForPrompt(): string {
  const categories = CHARACTER_GESTURES.reduce((acc, gesture) => {
    if (!acc[gesture.category]) {
      acc[gesture.category] = [];
    }
    acc[gesture.category].push(`  - ${gesture.id}: ${gesture.description}`);
    return acc;
  }, {} as Record<string, string[]>);

  return Object.entries(categories)
    .map(([category, gestures]) => {
      return `${category.toUpperCase()}:\n${gestures.join('\n')}`;
    })
    .join('\n\n');
}

/**
 * Validate gesture exists
 */
export function isValidGesture(gestureId: string): boolean {
  return CHARACTER_GESTURES.some(g => g.id === gestureId);
}
