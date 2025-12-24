interface ConversationState {
  conversations: any[];
  currentConversation: any | null;
  messages: any[];
  selectedCharacters: string[]; // Currently selected wakattors for the conversation
  storyContext: string | null; // Story context from conversation starter, for later reference
}

const initialState: ConversationState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  selectedCharacters: [],
  storyContext: null,
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
    default:
      return state;
  }
};
