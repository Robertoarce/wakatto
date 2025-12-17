/**
 * Type definitions for ChatInterface
 */

import { OrchestrationScene } from '../../../services/animationOrchestration';
import { AnimationState, ComplementaryAnimation } from '../../CharacterDisplay3D';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  characterId?: string; // Which character is speaking (for assistant messages)
}

// Early animation setup from streaming
export interface EarlyAnimationSetup {
  detectedCharacters: string[];
  estimatedDuration?: number;
  canStartThinkingAnimation: boolean;
}

export interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string, selectedCharacters: string[]) => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  isLoading?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  // Animation orchestration
  animationScene?: OrchestrationScene | null;
  // Early animation setup from streaming (before full scene is ready)
  earlyAnimationSetup?: EarlyAnimationSetup | null;
  // Callback for character greeting in new conversations
  onGreeting?: (characterId: string, greetingMessage: string) => void;
  // Conversation context for persistence
  conversationId?: string | null;
  // Saved characters from database (fixed at conversation creation, read-only)
  savedCharacters?: string[] | null;
  // Callback to save idle conversation messages
  onSaveIdleMessage?: (characterId: string, content: string, metadata?: Record<string, any>) => void;
}

// Interface for idle animation state
export interface IdleAnimationState {
  animation: AnimationState;
  complementary: ComplementaryAnimation;
}
