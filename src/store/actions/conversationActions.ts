import {
  getConversations as fetchConversations,
  saveConversation as createConversationInDB
} from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';
import { processMessageEntities } from '../../services/entityExtraction';
import { getBobGreeting } from '../../services/characterGreetings';
import { realtimeService } from '../../services/realtimeService';
import {
  getParticipants,
  getUserRole,
  removeParticipant as removeParticipantService,
  updateParticipantRole as updateRoleService,
  type Participant,
  type ParticipantRole,
} from '../../services/participantService';

// Tutorial character ID - BOB is exclusive to tutorial conversations
export const TUTORIAL_CHARACTER_ID = 'bob-tutorial';

// Existing action types
export const SET_CONVERSATIONS = 'SET_CONVERSATIONS';
export const SET_CURRENT_CONVERSATION = 'SET_CURRENT_CONVERSATION';
export const SET_MESSAGES = 'SET_MESSAGES';
export const ADD_MESSAGE = 'ADD_MESSAGE';
export const CREATE_CONVERSATION = 'CREATE_CONVERSATION';
export const ADD_CONVERSATION = 'ADD_CONVERSATION';
export const SET_SELECTED_CHARACTERS = 'SET_SELECTED_CHARACTERS';
export const TOGGLE_CHARACTER = 'TOGGLE_CHARACTER';
export const SET_STORY_CONTEXT = 'SET_STORY_CONTEXT';
export const CLEAR_STORY_CONTEXT = 'CLEAR_STORY_CONTEXT';

// Multi-user action types
export const SET_PARTICIPANTS = 'SET_PARTICIPANTS';
export const ADD_PARTICIPANT = 'ADD_PARTICIPANT';
export const REMOVE_PARTICIPANT = 'REMOVE_PARTICIPANT';
export const SET_USER_ROLE = 'SET_USER_ROLE';
export const SET_TYPING_USER = 'SET_TYPING_USER';
export const CLEAR_TYPING_USERS = 'CLEAR_TYPING_USERS';
export const SET_SUBSCRIBED = 'SET_SUBSCRIBED';
export const ADD_REALTIME_MESSAGE = 'ADD_REALTIME_MESSAGE';

export const setConversations = (conversations: any[]) => ({
  type: SET_CONVERSATIONS,
  payload: conversations,
});

export const setCurrentConversation = (conversation: any) => ({
  type: SET_CURRENT_CONVERSATION,
  payload: conversation,
});

export const setMessages = (messages: any[]) => ({
  type: SET_MESSAGES,
  payload: messages,
});

export const addMessage = (message: any) => ({
  type: ADD_MESSAGE,
  payload: message,
});

export const addConversation = (conversation: any) => ({
  type: ADD_CONVERSATION,
  payload: conversation,
});

export const setSelectedCharacters = (characterIds: string[]) => ({
  type: SET_SELECTED_CHARACTERS,
  payload: characterIds,
});

export const toggleCharacter = (characterId: string) => ({
  type: TOGGLE_CHARACTER,
  payload: characterId,
});

export const setStoryContext = (storyContext: string) => ({
  type: SET_STORY_CONTEXT,
  payload: storyContext,
});

export const clearStoryContext = () => ({
  type: CLEAR_STORY_CONTEXT,
});

// Async action to load conversations from Supabase
export const loadConversations = () => async (dispatch: any, getState: any) => {
  try {
    const { auth } = getState();
    if (!auth.user) {
      console.error('No user found when loading conversations');
      return;
    }

    const conversations = await fetchConversations(auth.user.id);

    // Enrich conversations with character count and message count
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        // Count unique characters in this conversation (from assistant messages)
        const { data: assistantMessages } = await supabase
          .from('messages')
          .select('character_id')
          .eq('conversation_id', conv.id)
          .eq('role', 'assistant')
          .not('character_id', 'is', null);

        const uniqueCharacters = new Set(assistantMessages?.map((m: any) => m.character_id) || []);

        // Count total messages in conversation
        const { count: messageCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);

        return {
          ...conv,
          characterCount: uniqueCharacters.size,
          messageCount: messageCount || 0,
        };
      })
    );

    dispatch(setConversations(enrichedConversations));
  } catch (error) {
    console.error('Error loading conversations:', error);
    dispatch(setConversations([]));
  }
};

// Async action to find user's tutorial conversation
export const findTutorialConversation = () => async (dispatch: any, getState: any): Promise<any | null> => {
  try {
    const { auth } = getState();
    if (!auth.user) {
      console.error('[findTutorialConversation] No user found');
      return null;
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', auth.user.id)
      .eq('is_tutorial', true)
      .single();

    if (error) {
      // PGRST116 means no rows found - not an error for our use case
      if (error.code === 'PGRST116') {
        console.log('[findTutorialConversation] No tutorial conversation found');
        return null;
      }
      console.error('[findTutorialConversation] Error:', error);
      return null;
    }

    console.log('[findTutorialConversation] Found tutorial:', data?.id);
    return data;
  } catch (error) {
    console.error('[findTutorialConversation] Exception:', error);
    return null;
  }
};

// Async action to create a new conversation
// selectedCharacters parameter is required - conversations must have fixed characters at creation
// isTutorial parameter marks this as the tutorial conversation (only one per user allowed)
export const createConversation = (
  title: string = 'New Conversation',
  selectedCharacters: string[] = [],
  isTutorial: boolean = false
) => async (dispatch: any, getState: any) => {
  try {
    const { auth } = getState();
    if (!auth.user) {
      console.error('No user found when creating conversation');
      return;
    }

    // Validation: BOB can only be in tutorial conversations
    const hasBob = selectedCharacters.includes(TUTORIAL_CHARACTER_ID);
    if (hasBob && !isTutorial) {
      console.error('[createConversation] BOB can only be used in tutorial conversations');
      throw new Error('BOB is exclusive to the tutorial. Please select other characters.');
    }

    // Validation: Tutorial can ONLY have BOB
    if (isTutorial && (selectedCharacters.length !== 1 || !hasBob)) {
      console.error('[createConversation] Tutorial must have exactly BOB as character');
      throw new Error('Tutorial must have BOB as the only character.');
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert([
        {
          user_id: auth.user.id,
          title,
          selected_characters: selectedCharacters,
          is_tutorial: isTutorial,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation for tutorial
      if (error.code === '23505' && isTutorial) {
        console.log('[createConversation] Tutorial already exists, finding it...');
        // Tutorial already exists - find and return it instead
        return dispatch(findTutorialConversation());
      }
      throw error;
    }

    if (data) {
      dispatch(addConversation(data));
      dispatch(setCurrentConversation(data));
      dispatch(setMessages([])); // Clear messages for new conversation
      return data;
    }
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

// Async action to create or navigate to tutorial conversation
export const createOrNavigateToTutorial = () => async (dispatch: any, getState: any) => {
  try {
    const { auth } = getState();
    if (!auth.user) {
      console.error('[createOrNavigateToTutorial] No user found');
      throw new Error('User not authenticated');
    }

    // First, check if tutorial already exists
    const existingTutorial = await dispatch(findTutorialConversation());

    if (existingTutorial) {
      console.log('[createOrNavigateToTutorial] Found existing tutorial, navigating...');
      await dispatch(selectConversation(existingTutorial));
      return existingTutorial;
    }

    // No tutorial exists - create new one
    console.log('[createOrNavigateToTutorial] Creating new tutorial with Bob...');

    const tutorialConv = await dispatch(
      createConversation('awesome dude', [TUTORIAL_CHARACTER_ID], true)
    );

    if (tutorialConv) {
      // Add Bob's greeting message
      const greeting = getBobGreeting();
      await supabase
        .from('messages')
        .insert([
          {
            conversation_id: tutorialConv.id,
            role: 'assistant',
            content: greeting,
            character_id: TUTORIAL_CHARACTER_ID,
            created_at: new Date().toISOString(),
          }
        ]);

      // Reload messages to show greeting
      await dispatch(selectConversation(tutorialConv));

      console.log('[createOrNavigateToTutorial] Tutorial created with Bob\'s greeting');
      return tutorialConv;
    }

    throw new Error('Failed to create tutorial conversation');
  } catch (error: any) {
    console.error('[createOrNavigateToTutorial] Error:', error);
    throw error;
  }
};

// Async action to select a conversation and load its messages
export const selectConversation = (conversation: any) => async (dispatch: any, getState: any) => {
  try {
    const { conversations: convState } = getState();
    const previousConversation = convState.currentConversation;

    // Unsubscribe from previous conversation if different
    if (previousConversation && previousConversation.id !== conversation.id) {
      if (convState.isSubscribed[previousConversation.id]) {
        dispatch(unsubscribeFromConversation(previousConversation.id));
      }
    }

    dispatch(setCurrentConversation(conversation));

    // Load messages for this conversation
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Map character_id to characterId for TypeScript
    const mappedMessages = (messages || []).map((msg: any) => ({
      ...msg,
      characterId: msg.character_id,
    }));

    dispatch(setMessages(mappedMessages));

    // Subscribe to real-time updates for shared conversations
    if (conversation.visibility === 'shared') {
      dispatch(subscribeToConversation(conversation.id));
    }
  } catch (error) {
    console.error('Error selecting conversation:', error);
    dispatch(setMessages([]));
  }
};

// Async action to save a message to the database
export const saveMessage = (conversationId: string, role: 'user' | 'assistant', content: string, characterId?: string, metadata?: Record<string, any>) => async (dispatch: any, getState: any) => {
  try {
    const { auth } = getState();
    
    // Include sender_id for user messages in shared conversations
    const senderId = role === 'user' && auth.user ? auth.user.id : null;
    
    // Add sender name to metadata for display in shared conversations
    const enrichedMetadata = role === 'user' && auth.user ? {
      ...metadata,
      sender_name: auth.user.user_metadata?.name || auth.user.email?.split('@')[0] || 'User',
      sender_email: auth.user.email,
    } : metadata;

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          role,
          content,
          character_id: characterId || null,
          sender_id: senderId,
          created_at: new Date().toISOString(),
          metadata: enrichedMetadata || null,
        }
      ])
      .select()
      .single();

    if (error) throw error;

    if (data) {
      // Map character_id to characterId for TypeScript
      const mappedMessage = {
        ...data,
        characterId: data.character_id,
      };
      dispatch(addMessage(mappedMessage));

      // Update conversation's updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Extract entities from user messages (async, don't block)
      if (role === 'user') {
        const { auth } = getState();
        if (auth.user) {
          processMessageEntities(auth.user.id, data.id, content, conversationId)
            .catch(err => console.error('Entity extraction error:', err));
        }
      }
    }

    return data;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

// Async action to delete a conversation
export const deleteConversation = (conversationId: string) => async (dispatch: any, getState: any) => {
  try {
    console.log('[DELETE] Starting deletion for conversation:', conversationId);
    
    const { auth } = getState();
    if (!auth.user) {
      throw new Error('User not authenticated');
    }
    
    console.log('[DELETE] User ID:', auth.user.id);

    // Check if conversation exists and belongs to user
    const { data: conv, error: checkError } = await supabase
      .from('conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .single();

    if (checkError) {
      console.error('[DELETE] Error checking conversation:', checkError);
      throw checkError;
    }

    if (!conv) {
      throw new Error('Conversation not found');
    }

    console.log('[DELETE] Conversation found:', conv);

    // Delete the conversation (CASCADE will handle messages and relationships)
    const { error: deleteError, data: deleteData } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', auth.user.id);

    if (deleteError) {
      console.error('[DELETE] Delete error:', deleteError);
      throw deleteError;
    }

    console.log('[DELETE] Conversation deleted successfully!');

    // If deleted conversation was current, we need to switch to another
    const { conversations } = getState();
    const wasCurrentConversation = conversations.currentConversation?.id === conversationId;

    // Reload conversations after deletion
    console.log('[DELETE] Reloading conversations list');
    await dispatch(loadConversations());

    // If we deleted the current conversation, auto-switch to another
    if (wasCurrentConversation) {
      const updatedState = getState();
      const remainingConversations = updatedState.conversations.conversations || [];

      if (remainingConversations.length > 0) {
        // Select the first (most recent) conversation
        console.log('[DELETE] Switching to first remaining conversation');
        await dispatch(selectConversation(remainingConversations[0]));
      } else {
        // No conversations left - navigate to Bob tutorial
        console.log('[DELETE] No conversations left, navigating to Bob tutorial');
        await dispatch(createOrNavigateToTutorial());
      }
    }

    console.log('[DELETE] Complete!');
  } catch (error: any) {
    console.error('[DELETE] Error in deleteConversation:', error);
    console.error('[DELETE] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
};

// Async action to rename a conversation
export const renameConversation = (conversationId: string, newTitle: string) => async (dispatch: any) => {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ title: newTitle, updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) throw error;

    // Reload conversations to get updated data
    await dispatch(loadConversations());
  } catch (error) {
    console.error('Error renaming conversation:', error);
    throw error;
  }
};

// Async action to update a message
export const updateMessage = (messageId: string, newContent: string) => async (dispatch: any, getState: any) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ content: newContent })
      .eq('id', messageId);

    if (error) throw error;

    // Reload messages for current conversation
    const { conversations } = getState();
    if (conversations.currentConversation) {
      const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversations.currentConversation.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      dispatch(setMessages(messages || []));
    }
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
};

// Async action to delete a message
export const deleteMessage = (messageId: string) => async (dispatch: any, getState: any) => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;

    // Reload messages for current conversation
    const { conversations } = getState();
    if (conversations.currentConversation) {
      const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversations.currentConversation.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      dispatch(setMessages(messages || []));
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// Async action to save selected characters for a conversation
export const saveSelectedCharacters = (conversationId: string, characterIds: string[]) => async (dispatch: any, getState: any) => {
  try {
    console.log('[saveSelectedCharacters] Saving characters for conversation:', conversationId, characterIds);

    const { error } = await supabase
      .from('conversations')
      .update({
        selected_characters: characterIds,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) {
      console.error('[saveSelectedCharacters] Error:', error);
      throw error;
    }

    // Update the current conversation in state if it matches
    const { conversations } = getState();
    if (conversations.currentConversation?.id === conversationId) {
      dispatch(setCurrentConversation({
        ...conversations.currentConversation,
        selected_characters: characterIds,
      }));
    }

    console.log('[saveSelectedCharacters] Saved successfully');
  } catch (error) {
    console.error('Error saving selected characters:', error);
    // Don't throw - this is a non-critical operation
  }
};

// Async action to load selected characters for a conversation
export const loadSelectedCharacters = (conversationId: string) => async (dispatch: any): Promise<string[] | null> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('selected_characters')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('[loadSelectedCharacters] Error:', error);
      return null;
    }

    const selectedCharacters = data?.selected_characters || [];
    console.log('[loadSelectedCharacters] Loaded characters:', selectedCharacters);
    return selectedCharacters;
  } catch (error) {
    console.error('Error loading selected characters:', error);
    return null;
  }
};

// ============================
// MULTI-USER ACTIONS
// ============================

// Action creators for multi-user
export const setParticipants = (conversationId: string, participants: Participant[]) => ({
  type: SET_PARTICIPANTS,
  payload: { conversationId, participants },
});

export const addParticipantAction = (conversationId: string, participant: Participant) => ({
  type: ADD_PARTICIPANT,
  payload: { conversationId, participant },
});

export const removeParticipantAction = (conversationId: string, userId: string) => ({
  type: REMOVE_PARTICIPANT,
  payload: { conversationId, userId },
});

export const setUserRole = (role: ParticipantRole | null) => ({
  type: SET_USER_ROLE,
  payload: role,
});

export const setTypingUser = (conversationId: string, userId: string, isTyping: boolean) => ({
  type: SET_TYPING_USER,
  payload: { conversationId, userId, isTyping },
});

export const clearTypingUsers = (conversationId: string) => ({
  type: CLEAR_TYPING_USERS,
  payload: { conversationId },
});

export const setSubscribed = (conversationId: string, subscribed: boolean) => ({
  type: SET_SUBSCRIBED,
  payload: { conversationId, subscribed },
});

export const addRealtimeMessage = (message: any) => ({
  type: ADD_REALTIME_MESSAGE,
  payload: message,
});

// Async action to load participants for a conversation
export const loadParticipants = (conversationId: string) => async (dispatch: any) => {
  try {
    const participants = await getParticipants(conversationId);
    dispatch(setParticipants(conversationId, participants as Participant[]));
    return participants;
  } catch (error) {
    console.error('[loadParticipants] Error:', error);
    return [];
  }
};

// Async action to load current user's role in a conversation
export const loadUserRole = (conversationId: string) => async (dispatch: any) => {
  try {
    const role = await getUserRole(conversationId);
    dispatch(setUserRole(role));
    return role;
  } catch (error) {
    console.error('[loadUserRole] Error:', error);
    dispatch(setUserRole(null));
    return null;
  }
};

// Async action to subscribe to real-time updates for a conversation
export const subscribeToConversation = (conversationId: string) => async (dispatch: any, getState: any) => {
  try {
    const { auth } = getState();
    if (!auth.user) {
      console.error('[subscribeToConversation] No user found');
      return;
    }

    // Set current user for filtering own events
    realtimeService.setCurrentUser(auth.user.id);

    // Subscribe with callbacks
    realtimeService.subscribeToConversation(conversationId, {
      onMessage: (message) => {
        console.log('[Realtime] New message received:', message.id);
        dispatch(addRealtimeMessage({
          ...message,
          characterId: message.character_id,
        }));
      },
      onTypingChange: (userId, isTyping) => {
        console.log('[Realtime] Typing change:', userId, isTyping);
        dispatch(setTypingUser(conversationId, userId, isTyping));
      },
      onParticipantJoin: (participant) => {
        console.log('[Realtime] Participant joined:', participant.user_id);
        dispatch(addParticipantAction(conversationId, participant as Participant));
      },
      onParticipantLeave: (userId) => {
        console.log('[Realtime] Participant left:', userId);
        dispatch(removeParticipantAction(conversationId, userId));
      },
      onError: (error) => {
        console.error('[Realtime] Subscription error:', error);
      },
    });

    dispatch(setSubscribed(conversationId, true));

    // Update presence
    realtimeService.updatePresence(conversationId);
  } catch (error) {
    console.error('[subscribeToConversation] Error:', error);
  }
};

// Async action to unsubscribe from real-time updates
export const unsubscribeFromConversation = (conversationId: string) => async (dispatch: any) => {
  try {
    // Clear presence before leaving
    await realtimeService.leavePresence(conversationId);

    // Unsubscribe from channel
    realtimeService.unsubscribe(conversationId);

    dispatch(setSubscribed(conversationId, false));
    dispatch(clearTypingUsers(conversationId));
  } catch (error) {
    console.error('[unsubscribeFromConversation] Error:', error);
  }
};

// Async action to set typing status
export const setTypingStatus = (conversationId: string, isTyping: boolean) => async (dispatch: any, getState: any) => {
  try {
    const { auth } = getState();
    if (!auth.user) return;

    await realtimeService.setTyping(conversationId, isTyping);
  } catch (error) {
    console.error('[setTypingStatus] Error:', error);
  }
};

// Async action to remove a participant from conversation
export const removeParticipant = (conversationId: string, userId: string) => async (dispatch: any) => {
  try {
    await removeParticipantService(conversationId, userId);
    dispatch(removeParticipantAction(conversationId, userId));
    console.log('[removeParticipant] Successfully removed user:', userId);
  } catch (error) {
    console.error('[removeParticipant] Error:', error);
    throw error;
  }
};

// Async action to update a participant's role
export const updateParticipantRole = (conversationId: string, userId: string, role: 'participant' | 'viewer') => async (dispatch: any) => {
  try {
    await updateRoleService(conversationId, userId, role);
    // Reload participants to get updated state
    await dispatch(loadParticipants(conversationId));
    console.log('[updateParticipantRole] Successfully updated role for user:', userId, 'to', role);
  } catch (error) {
    console.error('[updateParticipantRole] Error:', error);
    throw error;
  }
};

