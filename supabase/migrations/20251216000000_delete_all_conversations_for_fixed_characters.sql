-- Migration: Delete all existing conversations for fixed character feature
-- This migration is part of the "fixed characters per conversation" feature
-- where characters must be selected at conversation creation time and cannot be changed.
--
-- WARNING: This is DESTRUCTIVE and irreversible. All existing conversations will be deleted.
-- Run this migration AFTER deploying the code changes.

-- First delete all messages (they reference conversations via foreign key)
DELETE FROM messages;

-- Then delete all conversations
DELETE FROM conversations;

-- Add a comment for documentation
COMMENT ON TABLE conversations IS 'Conversations now have fixed characters set at creation time. Characters cannot be changed after conversation creation. (post-migration 2025-12-16)';
