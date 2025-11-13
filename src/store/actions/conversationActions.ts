import { 
  getConversations as fetchConversations, 
  saveConversation as createConversationInDB 
} from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';
import { processMessageEntities } from '../../services/entityExtraction';

export const SET_CONVERSATIONS = 'SET_CONVERSATIONS';
export const SET_CURRENT_CONVERSATION = 'SET_CURRENT_CONVERSATION';
export const SET_MESSAGES = 'SET_MESSAGES';
export const ADD_MESSAGE = 'ADD_MESSAGE';
export const CREATE_CONVERSATION = 'CREATE_CONVERSATION';
export const ADD_CONVERSATION = 'ADD_CONVERSATION';

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

// Async action to load conversations from Supabase
export const loadConversations = () => async (dispatch: any, getState: any) => {
  try {
    const { auth } = getState();
    if (!auth.user) {
      console.error('No user found when loading conversations');
      return;
    }

    const conversations = await fetchConversations(auth.user.id);

    // Enrich conversations with character count
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        // Count unique characters in this conversation
        const { data: messages } = await supabase
          .from('messages')
          .select('character_id')
          .eq('conversation_id', conv.id)
          .eq('role', 'assistant')
          .not('character_id', 'is', null);

        const uniqueCharacters = new Set(messages?.map((m: any) => m.character_id) || []);

        return {
          ...conv,
          characterCount: uniqueCharacters.size,
        };
      })
    );

    dispatch(setConversations(enrichedConversations));
  } catch (error) {
    console.error('Error loading conversations:', error);
    dispatch(setConversations([]));
  }
};

// Async action to create a new conversation
export const createConversation = (title: string = 'New Conversation') => async (dispatch: any, getState: any) => {
  try {
    const { auth } = getState();
    if (!auth.user) {
      console.error('No user found when creating conversation');
      return;
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert([
        { 
          user_id: auth.user.id, 
          title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

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

// Async action to select a conversation and load its messages
export const selectConversation = (conversation: any) => async (dispatch: any) => {
  try {
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
  } catch (error) {
    console.error('Error selecting conversation:', error);
    dispatch(setMessages([]));
  }
};

// Async action to save a message to the database
export const saveMessage = (conversationId: string, role: 'user' | 'assistant', content: string, characterId?: string) => async (dispatch: any, getState: any) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          role,
          content,
          character_id: characterId || null,
          created_at: new Date().toISOString(),
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

    // If deleted conversation was current, clear it BEFORE reloading
    const { conversations } = getState();
    if (conversations.currentConversation?.id === conversationId) {
      console.log('[DELETE] Clearing current conversation');
      dispatch(setCurrentConversation(null));
      dispatch(setMessages([]));
    }

    // Reload conversations after deletion
    console.log('[DELETE] Reloading conversations list');
    await dispatch(loadConversations());
    
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

