// Multi-user types
export interface Participant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'participant' | 'viewer';
  invited_by: string | null;
  email?: string;
  display_name?: string;
  joined_at: string;
}

interface ConversationState {
  conversations: any[];
  currentConversation: any | null;
  messages: any[];
  selectedCharacters: string[]; // Currently selected wakattors for the conversation
  storyContext: string | null; // Story context from conversation starter, for later reference
  // Multi-user state
  participants: { [conversationId: string]: Participant[] };
  typingUsers: { [conversationId: string]: string[] }; // User IDs currently typing
  isSubscribed: { [conversationId: string]: boolean }; // Real-time subscription status
  userRole: 'admin' | 'participant' | 'viewer' | null; // Current user's role in current conversation
}

const initialState: ConversationState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  selectedCharacters: [],
  storyContext: null,
  // Multi-user initial state
  participants: {},
  typingUsers: {},
  isSubscribed: {},
  userRole: null,
};

export const conversationReducer = (state = initialState, action: any): ConversationState => {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'ADD_CONVERSATION':
      return { 
        ...state, 
        conversations: [action.payload, ...state.conversations] 
      };
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_SELECTED_CHARACTERS':
      return { ...state, selectedCharacters: action.payload };
    case 'TOGGLE_CHARACTER':
      const characterId = action.payload;
      const isSelected = state.selectedCharacters.includes(characterId);
      if (isSelected) {
        return { ...state, selectedCharacters: state.selectedCharacters.filter(id => id !== characterId) };
      } else if (state.selectedCharacters.length < 5) {
        return { ...state, selectedCharacters: [...state.selectedCharacters, characterId] };
      }
      return state;
    case 'SET_STORY_CONTEXT':
      return { ...state, storyContext: action.payload };
    case 'CLEAR_STORY_CONTEXT':
      return { ...state, storyContext: null };

    // ============================
    // MULTI-USER ACTIONS
    // ============================
    case 'SET_PARTICIPANTS':
      return {
        ...state,
        participants: {
          ...state.participants,
          [action.payload.conversationId]: action.payload.participants,
        },
      };

    case 'ADD_PARTICIPANT':
      const { conversationId: addConvId, participant } = action.payload;
      const existingParticipants = state.participants[addConvId] || [];
      // Avoid duplicates
      if (existingParticipants.some(p => p.user_id === participant.user_id)) {
        return state;
      }
      return {
        ...state,
        participants: {
          ...state.participants,
          [addConvId]: [...existingParticipants, participant],
        },
      };

    case 'REMOVE_PARTICIPANT':
      const { conversationId: removeConvId, userId: removeUserId } = action.payload;
      return {
        ...state,
        participants: {
          ...state.participants,
          [removeConvId]: (state.participants[removeConvId] || []).filter(
            p => p.user_id !== removeUserId
          ),
        },
      };

    case 'SET_USER_ROLE':
      return { ...state, userRole: action.payload };

    case 'SET_TYPING_USER':
      const { conversationId: typingConvId, userId: typingUserId, isTyping } = action.payload;
      const currentTyping = state.typingUsers[typingConvId] || [];
      let newTyping: string[];
      if (isTyping && !currentTyping.includes(typingUserId)) {
        newTyping = [...currentTyping, typingUserId];
      } else if (!isTyping) {
        newTyping = currentTyping.filter(id => id !== typingUserId);
      } else {
        newTyping = currentTyping;
      }
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [typingConvId]: newTyping,
        },
      };

    case 'CLEAR_TYPING_USERS':
      const { conversationId: clearTypingConvId } = action.payload;
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [clearTypingConvId]: [],
        },
      };

    case 'SET_SUBSCRIBED':
      return {
        ...state,
        isSubscribed: {
          ...state.isSubscribed,
          [action.payload.conversationId]: action.payload.subscribed,
        },
      };

    case 'ADD_REALTIME_MESSAGE':
      // Add message from real-time subscription (avoid duplicates)
      const newMessage = action.payload;
      if (state.messages.some((m: any) => m.id === newMessage.id)) {
        return state;
      }
      return {
        ...state,
        messages: [...state.messages, newMessage],
      };

    default:
      return state;
  }
};
