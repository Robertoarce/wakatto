import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../types';
import { getCharacter } from '../config/characters';

interface MessageItemProps {
    message: Message;
    isEditing: boolean;
    editingContent: string;
    onEditingContentChange: (text: string) => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void;
    onStartEdit: (message: Message) => void;
    onDelete: (messageId: string) => void;
    isLoading: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
    message,
    isEditing,
    editingContent,
    onEditingContentChange,
    onCancelEdit,
    onSaveEdit,
    onStartEdit,
    onDelete,
    isLoading,
}) => {
    const isUser = message.role === 'user';
    const character = message.characterId ? getCharacter(message.characterId) : null;

    const cleanMessageContent = (content: string) => {
        return content.replace(/\[ACTION:\s*\w+\]/gi, '').replace(/\[TONE:\s*\w+\]/gi, '').trim();
    };

    const formatTimestamp = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
            {!isUser && character && (
                <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, { backgroundColor: character.color }]}>
                        <Text style={styles.avatarText}>{character.name[0]}</Text>
                    </View>
                </View>
            )}
            <View style={[styles.messageContent, isUser ? styles.userContent : styles.assistantContent]}>
                {!isUser && character && (
                    <Text style={styles.characterName}>{character.name}</Text>
                )}

                {isEditing ? (
                    <View>
                        <TextInput
                            style={styles.editInput}
                            value={editingContent}
                            onChangeText={onEditingContentChange}
                            multiline
                        />
                        <View style={styles.editActions}>
                            <TouchableOpacity onPress={onCancelEdit} style={styles.editButton}>
                                <Text style={styles.editButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onSaveEdit} style={[styles.editButton, styles.saveButton]}>
                                <Text style={[styles.editButtonText, styles.saveButtonText]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
                        {cleanMessageContent(message.content)}
                    </Text>
                )}

                <View style={styles.messageFooter}>
                    <Text style={styles.timestamp}>{formatTimestamp(message.timestamp)}</Text>
                    {isUser && !isLoading && (
                        <View style={styles.messageActions}>
                            <TouchableOpacity onPress={() => onStartEdit(message)} style={styles.actionButton}>
                                <Ionicons name="pencil" size={14} color="#9ca3af" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onDelete(message.id)} style={styles.actionButton}>
                                <Ionicons name="trash" size={14} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    messageContainer: {
        marginBottom: 16,
        flexDirection: 'row',
        maxWidth: '85%',
    },
    userMessage: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    assistantMessage: {
        alignSelf: 'flex-start',
    },
    avatarContainer: {
        marginRight: 8,
        marginTop: 4,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    messageContent: {
        padding: 12,
        borderRadius: 16,
        backgroundColor: '#1f2937',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    userContent: {
        backgroundColor: '#8b5cf6',
        borderTopRightRadius: 4,
    },
    assistantContent: {
        backgroundColor: '#1f2937',
        borderTopLeftRadius: 4,
    },
    characterName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 24,
        color: 'white',
    },
    userText: {
        color: 'white',
    },
    assistantText: {
        color: 'white',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    timestamp: {
        fontSize: 10,
        color: '#9ca3af',
    },
    messageActions: {
        flexDirection: 'row',
        marginLeft: 8,
    },
    actionButton: {
        marginLeft: 8,
    },
    editInput: {
        fontSize: 16,
        lineHeight: 24,
        color: 'white',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 8,
        padding: 8,
        marginBottom: 8,
        minWidth: 200,
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    editButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#374151',
        marginLeft: 8,
    },
    saveButton: {
        backgroundColor: '#8b5cf6',
    },
    editButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#d1d5db',
    },
    saveButtonText: {
        color: 'white',
    },
});
