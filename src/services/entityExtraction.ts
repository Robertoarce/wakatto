import { supabase } from '../lib/supabase';

export interface ExtractedEntity {
  name: string;
  type: 'person' | 'place' | 'organization';
}

/**
 * Extract entities from text using simple pattern matching
 * In a production app, this would use NLP libraries or AI APIs
 */
export function extractEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();

  // Common place indicators
  const placePatterns = [
    /(?:at|in|to|from|visiting|went to|traveled to|arrived in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /(?:in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:city|town|restaurant|cafe|park|beach|museum|airport|hotel)/gi,
  ];

  // Common person indicators
  const personPatterns = [
    /(?:with|met|saw|called|texted|talked to|had lunch with|dinner with|coffee with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    /(?:my friend|my brother|my sister|my mom|my dad|my cousin|my aunt|my uncle)\s+([A-Z][a-z]+)/gi,
    /([A-Z][a-z]+)\s+(?:said|told me|asked|called|texted|invited)/g,
  ];

  // Common organization patterns
  const orgPatterns = [
    /(?:at|for|with|from)\s+([A-Z][a-z]+(?:\s+(?:Inc|Corp|LLC|Company|Corporation|Ltd|Group))?)/g,
    /work(?:ing)?\s+(?:at|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
  ];

  // Common names (you can expand this list)
  const commonFirstNames = new Set([
    'Alex', 'Sarah', 'John', 'Emily', 'Michael', 'Jessica', 'David', 'Emma',
    'Chris', 'Anna', 'James', 'Lisa', 'Robert', 'Maria', 'Daniel', 'Laura',
    'Tom', 'Sophie', 'Mark', 'Julia', 'Peter', 'Kate', 'Paul', 'Amy',
  ]);

  // Words to exclude (common words that match patterns but aren't entities)
  const excludeWords = new Set([
    'Today', 'Yesterday', 'Tomorrow', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
    'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May',
    'June', 'July', 'August', 'September', 'October', 'November', 'December',
    'Am', 'As', 'Be', 'By', 'Do', 'If', 'In', 'Is', 'It', 'No', 'Of', 'On', 'Or',
    'So', 'To', 'Up', 'We', 'My', 'Me', 'He', 'She', 'They', 'The', 'This', 'That',
  ]);

  // Extract places
  placePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name && !excludeWords.has(name) && !seen.has(name.toLowerCase())) {
        entities.push({ name, type: 'place' });
        seen.add(name.toLowerCase());
      }
    }
  });

  // Extract people
  personPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name && !excludeWords.has(name) && !seen.has(name.toLowerCase())) {
        entities.push({ name, type: 'person' });
        seen.add(name.toLowerCase());
      }
    }
  });

  // Extract organizations
  orgPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name && !excludeWords.has(name) && !seen.has(name.toLowerCase())) {
        entities.push({ name, type: 'organization' });
        seen.add(name.toLowerCase());
      }
    }
  });

  // Also look for capitalized words that might be names
  const capitalizedWords = text.match(/\b[A-Z][a-z]+\b/g) || [];
  capitalizedWords.forEach(word => {
    if (commonFirstNames.has(word) && !seen.has(word.toLowerCase()) && !excludeWords.has(word)) {
      entities.push({ name: word, type: 'person' });
      seen.add(word.toLowerCase());
    }
  });

  return entities;
}

/**
 * Process a message and store extracted entities
 */
export async function processMessageEntities(
  userId: string,
  messageId: string,
  messageContent: string,
  conversationId: string
): Promise<void> {
  try {
    const extracted = extractEntities(messageContent);

    if (extracted.length === 0) {
      return;
    }

    for (const entity of extracted) {
      // Check if entity already exists
      const { data: existing, error: findError } = await supabase
        .from('entities')
        .select('id, mention_count')
        .eq('user_id', userId)
        .eq('name', entity.name)
        .eq('type', entity.type)
        .single();

      let entityId: string;

      if (existing) {
        // Update existing entity
        const { error: updateError } = await supabase
          .from('entities')
          .update({
            mention_count: existing.mention_count + 1,
            last_mentioned: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating entity:', updateError);
          continue;
        }

        entityId = existing.id;
      } else {
        // Create new entity
        const { data: newEntity, error: createError } = await supabase
          .from('entities')
          .insert({
            user_id: userId,
            name: entity.name,
            type: entity.type,
            mention_count: 1,
            first_mentioned: new Date().toISOString(),
            last_mentioned: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (createError || !newEntity) {
          console.error('Error creating entity:', createError);
          continue;
        }

        entityId = newEntity.id;
      }

      // Create relationship between entity and message
      const { error: relError } = await supabase
        .from('relationships')
        .insert({
          entity_id: entityId,
          message_id: messageId,
          conversation_id: conversationId,
        });

      if (relError) {
        console.error('Error creating relationship:', relError);
      }
    }
  } catch (error) {
    console.error('Error processing message entities:', error);
  }
}

/**
 * Batch process all existing messages for a user
 * Useful for initial extraction or re-processing
 */
export async function batchProcessUserMessages(userId: string): Promise<void> {
  try {
    // Get all user's messages
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId);

    if (convError) throw convError;

    for (const conv of conversations || []) {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, content, conversation_id')
        .eq('conversation_id', conv.id)
        .eq('role', 'user'); // Only process user messages

      if (msgError) {
        console.error('Error fetching messages:', msgError);
        continue;
      }

      for (const msg of messages || []) {
        await processMessageEntities(userId, msg.id, msg.content, msg.conversation_id);
      }
    }
  } catch (error) {
    console.error('Error batch processing messages:', error);
    throw error;
  }
}

