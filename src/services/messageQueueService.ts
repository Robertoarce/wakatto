/**
 * Message Queue Service
 * 
 * Handles smart debouncing for multi-user conversations to optimize LLM costs.
 * 
 * Strategy:
 * - First message starts a short timer (1.5s debounce window)
 * - If more messages arrive before timer expires, batch them and reset timer
 * - When timer expires, process all batched messages in a single LLM call
 * - If LLM is still processing, queue incoming messages for the next batch
 */

export interface QueuedMessage {
  id: string;
  userId: string;
  userEmail?: string;
  content: string;
  timestamp: number;
}

export interface MessageBatch {
  conversationId: string;
  messages: QueuedMessage[];
  selectedCharacters: string[];
}

export interface MessageQueueCallbacks {
  onBatchReady: (batch: MessageBatch) => Promise<void>;
  onProcessingStart?: () => void;
  onProcessingEnd?: () => void;
  onError?: (error: Error) => void;
}

// Debounce window in milliseconds
const DEBOUNCE_WINDOW_MS = 1500;

// Maximum messages in a single batch (to prevent extremely large prompts)
const MAX_BATCH_SIZE = 5;

// Per-conversation queue state
interface ConversationQueue {
  // Messages waiting to be batched
  pendingMessages: QueuedMessage[];
  // Messages queued while LLM is processing
  queuedForNextBatch: QueuedMessage[];
  // Debounce timer
  debounceTimer: NodeJS.Timeout | null;
  // Is LLM currently processing?
  isProcessing: boolean;
  // Selected characters for this conversation
  selectedCharacters: string[];
  // Callbacks
  callbacks: MessageQueueCallbacks;
}

class MessageQueueService {
  private queues: Map<string, ConversationQueue> = new Map();

  /**
   * Initialize queue for a conversation
   */
  initQueue(
    conversationId: string,
    selectedCharacters: string[],
    callbacks: MessageQueueCallbacks
  ): void {
    // Clear existing queue if any
    this.clearQueue(conversationId);

    this.queues.set(conversationId, {
      pendingMessages: [],
      queuedForNextBatch: [],
      debounceTimer: null,
      isProcessing: false,
      selectedCharacters,
      callbacks,
    });
  }

  /**
   * Update selected characters for a conversation queue
   */
  updateSelectedCharacters(conversationId: string, selectedCharacters: string[]): void {
    const queue = this.queues.get(conversationId);
    if (queue) {
      queue.selectedCharacters = selectedCharacters;
    }
  }

  /**
   * Add a message to the queue
   * Returns true if message was queued, false if queue not initialized
   */
  queueMessage(
    conversationId: string,
    userId: string,
    content: string,
    userEmail?: string
  ): boolean {
    const queue = this.queues.get(conversationId);
    if (!queue) {
      console.warn('[MessageQueue] Queue not initialized for conversation:', conversationId);
      return false;
    }

    const message: QueuedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userEmail,
      content,
      timestamp: Date.now(),
    };

    // If LLM is processing, queue for next batch
    if (queue.isProcessing) {
      console.log('[MessageQueue] LLM processing, queuing for next batch:', message.id);
      queue.queuedForNextBatch.push(message);
      return true;
    }

    // Add to pending messages
    queue.pendingMessages.push(message);
    console.log('[MessageQueue] Added to pending:', message.id, 'Total pending:', queue.pendingMessages.length);

    // Check if batch is full
    if (queue.pendingMessages.length >= MAX_BATCH_SIZE) {
      console.log('[MessageQueue] Batch full, processing immediately');
      this.processBatch(conversationId);
      return true;
    }

    // Reset debounce timer
    if (queue.debounceTimer) {
      clearTimeout(queue.debounceTimer);
    }

    // Start new debounce timer
    queue.debounceTimer = setTimeout(() => {
      console.log('[MessageQueue] Debounce timer expired, processing batch');
      this.processBatch(conversationId);
    }, DEBOUNCE_WINDOW_MS);

    return true;
  }

  /**
   * Process the current batch of messages
   */
  private async processBatch(conversationId: string): Promise<void> {
    const queue = this.queues.get(conversationId);
    if (!queue || queue.pendingMessages.length === 0) {
      return;
    }

    // Clear timer
    if (queue.debounceTimer) {
      clearTimeout(queue.debounceTimer);
      queue.debounceTimer = null;
    }

    // Mark as processing
    queue.isProcessing = true;
    queue.callbacks.onProcessingStart?.();

    // Take current pending messages
    const messagesToProcess = [...queue.pendingMessages];
    queue.pendingMessages = [];

    const batch: MessageBatch = {
      conversationId,
      messages: messagesToProcess,
      selectedCharacters: queue.selectedCharacters,
    };

    console.log('[MessageQueue] Processing batch:', {
      conversationId,
      messageCount: messagesToProcess.length,
      userIds: messagesToProcess.map(m => m.userId),
    });

    try {
      await queue.callbacks.onBatchReady(batch);
    } catch (error: any) {
      console.error('[MessageQueue] Error processing batch:', error);
      queue.callbacks.onError?.(error);
    } finally {
      // Mark processing complete
      queue.isProcessing = false;
      queue.callbacks.onProcessingEnd?.();

      // Check if there are queued messages from during processing
      if (queue.queuedForNextBatch.length > 0) {
        console.log('[MessageQueue] Processing queued messages from during LLM call:', 
          queue.queuedForNextBatch.length);
        
        // Move queued messages to pending
        queue.pendingMessages = [...queue.queuedForNextBatch];
        queue.queuedForNextBatch = [];

        // Start debounce timer for next batch
        queue.debounceTimer = setTimeout(() => {
          this.processBatch(conversationId);
        }, DEBOUNCE_WINDOW_MS);
      }
    }
  }

  /**
   * Force immediate processing of pending messages
   */
  async flush(conversationId: string): Promise<void> {
    const queue = this.queues.get(conversationId);
    if (queue && queue.pendingMessages.length > 0 && !queue.isProcessing) {
      await this.processBatch(conversationId);
    }
  }

  /**
   * Check if a conversation has pending messages
   */
  hasPendingMessages(conversationId: string): boolean {
    const queue = this.queues.get(conversationId);
    return queue ? queue.pendingMessages.length > 0 || queue.queuedForNextBatch.length > 0 : false;
  }

  /**
   * Check if LLM is currently processing for a conversation
   */
  isProcessing(conversationId: string): boolean {
    const queue = this.queues.get(conversationId);
    return queue?.isProcessing ?? false;
  }

  /**
   * Get count of pending messages (including queued)
   */
  getPendingCount(conversationId: string): number {
    const queue = this.queues.get(conversationId);
    if (!queue) return 0;
    return queue.pendingMessages.length + queue.queuedForNextBatch.length;
  }

  /**
   * Clear queue for a conversation
   */
  clearQueue(conversationId: string): void {
    const queue = this.queues.get(conversationId);
    if (queue) {
      if (queue.debounceTimer) {
        clearTimeout(queue.debounceTimer);
      }
      this.queues.delete(conversationId);
    }
  }

  /**
   * Clear all queues
   */
  clearAll(): void {
    this.queues.forEach((queue, conversationId) => {
      if (queue.debounceTimer) {
        clearTimeout(queue.debounceTimer);
      }
    });
    this.queues.clear();
  }
}

// Export singleton instance
export const messageQueueService = new MessageQueueService();
export default messageQueueService;

/**
 * Helper: Format batched messages for LLM prompt
 * Combines multiple user messages into a single context string
 */
export function formatBatchedMessages(messages: QueuedMessage[]): string {
  if (messages.length === 1) {
    // Single message, return as-is
    return messages[0].content;
  }

  // Multiple messages from different users
  // Format them so the LLM understands the context
  const formattedMessages = messages.map((msg, index) => {
    const userName = msg.userEmail?.split('@')[0] || `User ${index + 1}`;
    return `[${userName}]: ${msg.content}`;
  });

  return `[Multiple users are speaking at the same time]\n\n${formattedMessages.join('\n\n')}`;
}

/**
 * Helper: Check if batch has messages from multiple users
 */
export function hasMultipleUsers(messages: QueuedMessage[]): boolean {
  if (messages.length <= 1) return false;
  const userIds = new Set(messages.map(m => m.userId));
  return userIds.size > 1;
}

