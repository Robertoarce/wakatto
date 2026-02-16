/**
 * Ax LLM Signatures
 *
 * Type-safe signature definitions for Wakatto AI interactions.
 * Signatures define inputs and outputs - ax auto-generates optimal prompts.
 *
 * @see https://axllm.dev/signatures
 */

import { AxSignature } from '@ax-llm/ax';

// ============================================
// EMOTION & ANIMATION TYPES
// ============================================

/**
 * Character emotions for 3D avatar expressions
 */
export const EMOTIONS = [
  'joyful', 'happy', 'excited', 'loving', 'proud', 'playful', 'amused',
  'sad', 'angry', 'frustrated', 'annoyed', 'disappointed',
  'thoughtful', 'curious', 'confused', 'skeptical',
  'surprised', 'shocked', 'amazed',
  'nervous', 'worried', 'embarrassed', 'shy',
  'neutral', 'calm', 'serious', 'focused',
  'sleepy', 'bored', 'smug', 'mischievous',
  'sassy', 'unimpressed', 'judging', 'teasing'
] as const;

export type Emotion = typeof EMOTIONS[number];

/**
 * Character body animations
 */
export const ANIMATIONS = [
  'idle', 'thinking', 'talking', 'confused', 'happy', 'excited',
  'nod', 'shake_head', 'shrug', 'wave', 'point', 'clap', 'bow',
  'lean_back', 'lean_forward', 'cross_arms',
  'facepalm', 'laugh', 'cry', 'angry', 'nervous', 'celebrate',
  'head_tilt'
] as const;

export type Animation = typeof ANIMATIONS[number];

// ============================================
// CHARACTER RESPONSE SIGNATURE
// ============================================

/**
 * Single character response with emotion and animation
 */
export const characterResponseSignature = new AxSignature(`
  "Generate a response as a Wakatto AI character with emotional expression"
  
  characterName:string "The name of the character responding",
  characterPersonality:string "The character's personality and speaking style",
  conversationHistory:string "Previous messages in the conversation",
  userMessage:string "The user's current message"
  
  ->
  
  response:string "The character's response text",
  emotion:class "${EMOTIONS.join(', ')}" "The emotional expression to display",
  animation:class "${ANIMATIONS.join(', ')}" "The body animation to perform"
`);

/**
 * Inferred type for character response
 */
export type CharacterResponseOutput = {
  response: string;
  emotion: Emotion;
  animation: Animation;
};

// ============================================
// CONVERSATION TITLE SIGNATURE
// ============================================

/**
 * Generate a discreet conversation title
 */
export const conversationTitleSignature = new AxSignature(`
  "Generate a short, discreet title (3-5 words) for a therapy conversation"
  
  userMessage:string "The first user message in the conversation"
  
  ->
  
  title:string "A short, privacy-respecting title (3-5 words max)"
`);

export type ConversationTitleOutput = {
  title: string;
};

// ============================================
// ENTITY EXTRACTION SIGNATURE
// ============================================

/**
 * Extract entities (people, places, organizations) from text
 */
export const entityExtractionSignature = new AxSignature(`
  "Extract named entities from user message text"
  
  text:string "The text to extract entities from"
  
  ->
  
  entities:json "Array of {name: string, type: 'person'|'place'|'organization'}"
`);

export type ExtractedEntity = {
  name: string;
  type: 'person' | 'place' | 'organization';
};

export type EntityExtractionOutput = {
  entities: ExtractedEntity[];
};

// ============================================
// MULTI-CHARACTER ORCHESTRATION SIGNATURE
// ============================================

/**
 * Orchestrate a multi-character conversation
 */
export const orchestrationSignature = new AxSignature(`
  "Orchestrate a natural multi-character conversation response"
  
  characters:json "Array of {id, name, personality} for each character",
  conversationHistory:string "Previous messages in the conversation",
  userMessage:string "The user's current message",
  maxResponses:number "Maximum number of character responses to generate"
  
  ->
  
  responses:json "Array of character responses with animations"
`);

/**
 * Single character response in orchestration
 */
export interface OrchestrationResponse {
  character: string;
  content: string;
  emotion: Emotion;
  animation: Animation;
  reactsTo?: string;
  interrupts?: boolean;
}

export type OrchestrationOutput = {
  responses: OrchestrationResponse[];
};

// ============================================
// CONVERSATION STARTER SIGNATURE
// ============================================

/**
 * Generate a conversation opening scene
 */
export const conversationStarterSignature = new AxSignature(`
  "Generate an engaging conversation opening between AI characters"
  
  characters:json "Array of {id, name, personality} for each character",
  isSingleCharacter:boolean "Whether this is a single character greeting"
  
  ->
  
  scene:json "Array of opening dialogue with animations"
`);

export interface StarterDialogue {
  character: string;
  content: string;
  emotion: Emotion;
  animation: Animation;
  order: number;
}

export type ConversationStarterOutput = {
  scene: StarterDialogue[];
};

// ============================================
// BOB SALES SIGNATURE
// ============================================

/**
 * Bob's sales and onboarding responses
 */
export const bobSalesSignature = new AxSignature(`
  "Generate Bob's casual, witty sales response"
  
  userMessage:string "The user's message to Bob",
  userStatus:json "User's subscription status and trial info",
  conversationContext:string "Previous messages with Bob"
  
  ->
  
  response:string "Bob's response text",
  suggestedAction:class "show_pricing, create_discount, unlock_preview, none" "Action Bob suggests",
  emotion:class "friendly, excited, sympathetic, playful, persuasive" "Bob's emotional tone"
`);

export type BobSalesOutput = {
  response: string;
  suggestedAction: 'show_pricing' | 'create_discount' | 'unlock_preview' | 'none';
  emotion: 'friendly' | 'excited' | 'sympathetic' | 'playful' | 'persuasive';
};

// ============================================
// SENTIMENT ANALYSIS SIGNATURE
// ============================================

/**
 * Analyze sentiment of user message
 */
export const sentimentSignature = new AxSignature(`
  "Analyze the emotional sentiment of a user message"
  
  text:string "The user message to analyze"
  
  ->
  
  sentiment:class "positive, negative, neutral, mixed" "Overall sentiment",
  confidence:number "Confidence score 0-1",
  primaryEmotion:class "joy, sadness, anger, fear, surprise, disgust, anticipation, trust" "Primary emotion detected"
`);

export type SentimentOutput = {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  primaryEmotion: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'anticipation' | 'trust';
};
