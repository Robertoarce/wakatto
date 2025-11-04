interface ConversationState {
  conversations: any[];
  currentConversation: any | null;
  messages: any[];
}

const initialState: ConversationState = {
  conversations: [],
  currentConversation: null,
  messages: [],
};

export const conversationReducer = (state = initialState, action: any): ConversationState => {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    default:
      return state;
  }
};
