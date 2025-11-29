/**
 * Enhanced Wakattors Screen - Character Management with Full Customization
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { CharacterDisplay3D, AnimationState } from '../components/CharacterDisplay3D';
import { CharacterCardPreview } from '../components/CharacterCardPreview';
import { getAllCharacters, CharacterBehavior, GenderType, SkinToneType, ClothingType, HairType, AccessoryType } from '../config/characters';
import { ColorPicker } from '../components/ColorPicker';
import { getCustomWakattors, deleteCustomWakattor, addCharacterToWakattors } from '../services/customWakattorsService';
import { useCustomAlert } from '../components/CustomAlert';
import { addToChatMenu, removeFromChatMenu, isInChatMenu, getChatMenuCount, getChatMenuCharacters } from '../services/chatMenuService';
import { getWakattorsInConversations, getCharactersByIds } from '../services/conversationWakattorsService';

// Preset color palettes
const BODY_COLORS = [
  '#8b5cf6', '#a855f7', '#c084fc', '#e879f9',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#a78bfa', '#d946ef',
];

const SKIN_COLORS = ['#f4c8a8', '#d4a574', '#c68642', '#8d5524'];
const HAIR_COLORS = [
  '#1a1a1a', '#2d1a0a', '#451a03', '#3a2a1a',
  '#6b5d4f', '#8b6f47', '#dc2626', '#fbbf24',
  '#f5f5f5', '#4a4a4a',
];

const ROLES = [
  'Therapist', 'Coach', 'Friend', 'Mentor', 'Advisor',
  'Guide', 'Teacher', 'Companion', 'Counselor', 'Supporter',
];

type EditorTab = 'basic' | 'personality' | 'animations' | 'advanced';

type RootStackParamList = {
  Wakattors: { newCharacterId?: string };
};

export default function WakattorsScreenEnhanced() {
  const route = useRoute<RouteProp<RootStackParamList, 'Wakattors'>>();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [characters, setCharacters] = useState<CharacterBehavior[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterBehavior | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCharacter, setEditedCharacter] = useState<CharacterBehavior | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState>('idle');
  const [editorTab, setEditorTab] = useState<EditorTab>('basic');
  const [newCharacterId, setNewCharacterId] = useState<string | null>(null);
  const [chatMenuCharacters, setChatMenuCharacters] = useState<string[]>([]);
  const [conversationCharacters, setConversationCharacters] = useState<CharacterBehavior[]>([]);
  const [collectionCharacterIds, setCollectionCharacterIds] = useState<string[]>([]);
  const [loadingConversationChars, setLoadingConversationChars] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load custom wakattors on mount
  useEffect(() => {
    loadWakattors();
  }, []);

  // Handle new character from navigation
  useEffect(() => {
    if (route.params?.newCharacterId) {
      setNewCharacterId(route.params.newCharacterId);
      startPulseAnimation();
      // Clear after 3 seconds
      const timeout = setTimeout(() => {
        setNewCharacterId(null);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [route.params?.newCharacterId]);

  const loadWakattors = async () => {
    setLoading(true);
    try {
      // 1. Load collection (existing)
      const customWakattors = await getCustomWakattors();
      const limitedWakattors = customWakattors.slice(0, 20);
      setCharacters(limitedWakattors);

      // 2. Track collection IDs for filtering
      const collectionIds = limitedWakattors.map(c => c.id);
      setCollectionCharacterIds(collectionIds);

      // 3. Load conversation character IDs (in background)
      setLoadingConversationChars(true);
      const conversationCharIds = await getWakattorsInConversations();

      // 4. Filter out characters already in collection
      const filteredIds = conversationCharIds.filter(id => !collectionIds.includes(id));

      // 5. Fetch full character data
      const conversationChars = await getCharactersByIds(filteredIds);
      setConversationCharacters(conversationChars);

      // 6. Load chat menu state (existing)
      const chatMenu = getChatMenuCharacters();
      setChatMenuCharacters(chatMenu);
    } catch (error: any) {
      console.error('[Wakattors] Load error:', error);
      showAlert('Error', `Failed to load wakattors: ${error.message}`, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
      setLoadingConversationChars(false);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 3 } // 3 pulses = 3 seconds
    ).start();
  };

  const handleCreateNew = () => {
    const newCharacter: CharacterBehavior = {
      id: `custom_${Date.now()}`,
      name: 'New Wakattor',
      description: 'A new AI character',
      color: '#8b5cf6',
      role: 'Friend',
      systemPrompt: 'You are a helpful AI assistant.',
      responseStyle: 'balanced',
      model3D: {
        bodyColor: '#8b5cf6',
        accessoryColor: '#6d28d9',
        position: [0, 0, 0],
      },
      customization: {
        gender: 'neutral',
        skinTone: 'medium',
        clothing: 'casual',
        hair: 'short',
        accessory: 'none',
        bodyColor: '#8b5cf6',
        accessoryColor: '#6d28d9',
        hairColor: '#1a1a1a',
      },
    };
    setEditedCharacter(newCharacter);
    setIsEditing(true);
    setEditorTab('basic');
  };

  const handleEdit = (character: CharacterBehavior) => {
    setEditedCharacter({ ...character });
    setIsEditing(true);
    setEditorTab('basic');
  };

  const handleAddToChatMenu = (character: CharacterBehavior) => {
    const result = addToChatMenu(character.id);
    if (result.success) {
      setChatMenuCharacters([...chatMenuCharacters, character.id]);
      showAlert('Success', `${character.name} added to chat menu!`, [{ text: 'OK' }]);
    } else {
      showAlert('Error', result.error || 'Failed to add to chat menu', [{ text: 'OK' }]);
    }
  };

  const handleRemoveFromChatMenu = (character: CharacterBehavior) => {
    const result = removeFromChatMenu(character.id);
    if (result.success) {
      setChatMenuCharacters(chatMenuCharacters.filter(id => id !== character.id));
    }
  };

  const handleRemove = async (character: CharacterBehavior) => {
    // Check if character appeared in conversations
    const conversationCharIds = await getWakattorsInConversations();
    const appearsInConversations = conversationCharIds.includes(character.id);

    showAlert(
      'Remove Character',
      appearsInConversations
        ? `${character.name} will be moved to "Wakattors in Your Conversations" since they appear in your chat history. You can add them back anytime!`
        : `Are you sure you want to remove ${character.name} from your Wakattors?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Try to delete from database, but continue even if it fails (demo mode)
              try {
                await deleteCustomWakattor(character.id);
              } catch (dbError) {
                console.log('[Wakattors] Database delete failed (likely demo mode), continuing with local removal');
              }

              // Remove from chat menu if it's there
              handleRemoveFromChatMenu(character);

              // Remove from collection
              setCharacters(prev => prev.filter(c => c.id !== character.id));
              setCollectionCharacterIds(prev => prev.filter(id => id !== character.id));

              // Add to conversation section if they appeared in conversations
              if (appearsInConversations) {
                setConversationCharacters(prev => [...prev, character]);
              }

              showAlert(
                'Success',
                appearsInConversations
                  ? `${character.name} has been moved to your conversations section.`
                  : `${character.name} has been removed.`,
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              console.error('[Wakattors] Remove error:', error);
              showAlert('Error', `Failed to remove character: ${error.message}`, [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  };

  const handleAddToCollection = async (character: CharacterBehavior) => {
    // Check collection limit
    if (characters.length >= 20) {
      showAlert('Limit Reached', 'You can only have 20 wakattors in your collection.', [{ text: 'OK' }]);
      return;
    }

    showAlert(
      'Add to Collection',
      `Add ${character.name} to your Wakattors collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async () => {
            try {
              // Add to database
              await addCharacterToWakattors(character as any);

              // MOVE from conversation section to collection section
              setConversationCharacters(prev =>
                prev.filter(c => c.id !== character.id)
              );
              setCharacters(prev => [...prev, character]);
              setCollectionCharacterIds(prev => [...prev, character.id]);

              showAlert('Success', `${character.name} added to your collection!`, [{ text: 'OK' }]);
            } catch (error: any) {
              showAlert('Error', `Failed to add: ${error.message}`, [{ text: 'OK' }]);
            }
          }
        }
      ]
    );
  };

  const handleSave = () => {
    if (editedCharacter) {
      // TODO: Save character to storage/database
      console.log('Saving character:', editedCharacter);
      setIsEditing(false);
      setEditedCharacter(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedCharacter(null);
  };

  const updateCharacterField = (field: keyof CharacterBehavior, value: any) => {
    if (editedCharacter) {
      setEditedCharacter({ ...editedCharacter, [field]: value });
    }
  };


  const updateCustomization = (field: keyof CharacterBehavior['customization'], value: any) => {
    if (editedCharacter) {
      setEditedCharacter({
        ...editedCharacter,
        customization: { ...editedCharacter.customization, [field]: value },
      });
    }
  };

  const updateModel3D = (field: keyof CharacterBehavior['model3D'], value: any) => {
    if (editedCharacter) {
      setEditedCharacter({
        ...editedCharacter,
        model3D: { ...editedCharacter.model3D, [field]: value },
      });
    }
  };

  return (
    <View style={styles.container}>
      <AlertComponent />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Wakattors</Text>
        <Text style={styles.subtitle}>
          Your collection ({characters.length}/20) • Chat menu ({getChatMenuCount()}/10)
        </Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.createButtonText}>Create New Wakattor</Text>
        </TouchableOpacity>
      </View>

      {/* Character Grid */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.grid}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.loadingText}>Loading your Wakattors...</Text>
          </View>
        ) : characters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#3f3f46" />
            <Text style={styles.emptyText}>No Wakattors yet</Text>
            <Text style={styles.emptySubtext}>
              Go to the Library tab to add characters to your collection!
            </Text>
          </View>
        ) : (
          characters.map((character) => {
            const isNewlyAdded = newCharacterId === character.id;
            return (
              <Animated.View
                key={character.id}
                style={[
                  styles.card,
                  isNewlyAdded && {
                    transform: [{ scale: pulseAnim }],
                    shadowColor: character.color,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.6,
                    shadowRadius: 16,
                    elevation: 12,
                  },
                ]}
              >
                <View style={styles.cardPreview}>
                  <CharacterCardPreview character={character} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: character.color }]}>
                    {character.name}
                  </Text>
                  <Text style={styles.cardRole}>{character.role}</Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {character.description}
                  </Text>
                  <View style={styles.cardActions}>
                    {chatMenuCharacters.includes(character.id) ? (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.inChatMenuButton]}
                        onPress={() => handleRemoveFromChatMenu(character)}
                      >
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                        <Text style={[styles.actionButtonText, styles.inChatMenuText]}>
                          In Chat
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleAddToChatMenu(character)}
                      >
                        <Ionicons name="add-circle" size={20} color="#8b5cf6" />
                        <Text style={styles.actionButtonText}>Add to Chat</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.removeButton]}
                      onPress={() => handleRemove(character)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      <Text style={[styles.actionButtonText, styles.removeButtonText]}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            );
          })
        )}

        {/* Divider */}
        {!loading && characters.length > 0 && (
          <View style={styles.sectionDivider} />
        )}

        {/* Section 2: Wakattors in Your Conversations */}
        {!loading && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Wakattors in Your Conversations</Text>
              <Text style={styles.sectionSubtitle}>
                {loadingConversationChars
                  ? 'Loading...'
                  : conversationCharacters.length > 0
                  ? `${conversationCharacters.length} character${conversationCharacters.length !== 1 ? 's' : ''} (showing 50 most recent)`
                  : 'Characters will appear here after they speak in your conversations'
                }
              </Text>
            </View>

            {conversationCharacters.length === 0 && !loadingConversationChars ? (
              <View style={styles.emptyConversationSection}>
                <Ionicons name="chatbubbles-outline" size={48} color="#3f3f46" />
                <Text style={styles.emptyText}>No conversation characters yet</Text>
                <Text style={styles.emptySubtext}>
                  Characters will appear here after they speak in your conversations
                </Text>
              </View>
            ) : loadingConversationChars ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.loadingText}>Loading conversation characters...</Text>
              </View>
            ) : (
              conversationCharacters.map((character) => (
                <Animated.View
                  key={character.id}
                  style={styles.card}
                >
                  <View style={styles.cardPreview}>
                    <CharacterCardPreview character={character} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardName, { color: character.color }]}>
                      {character.name}
                    </Text>
                    <Text style={styles.cardRole}>{character.role}</Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {character.description}
                    </Text>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.addToCollectionButton,
                          collectionCharacterIds.includes(character.id) && styles.addToCollectionButtonDisabled
                        ]}
                        onPress={() => handleAddToCollection(character)}
                        disabled={collectionCharacterIds.includes(character.id)}
                      >
                        <Ionicons name="add-circle" size={20} color={collectionCharacterIds.includes(character.id) ? "#71717a" : "white"} />
                        <Text style={[
                          styles.actionButtonText,
                          styles.addToCollectionButtonText,
                          collectionCharacterIds.includes(character.id) && { color: '#71717a' }
                        ]}>
                          {collectionCharacterIds.includes(character.id) ? 'In Collection' : 'Add to Collection'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Character Editor Modal */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {editedCharacter && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editedCharacter.id.startsWith('custom_') ? 'Create' : 'Edit'} Wakattor
                  </Text>
                  <TouchableOpacity onPress={handleCancel}>
                    <Ionicons name="close" size={28} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                  <TouchableOpacity
                    style={[styles.tab, editorTab === 'basic' && styles.tabActive]}
                    onPress={() => setEditorTab('basic')}
                  >
                    <Ionicons name="information-circle" size={20} color={editorTab === 'basic' ? '#8b5cf6' : '#71717a'} />
                    <Text style={[styles.tabText, editorTab === 'basic' && styles.tabTextActive]}>Basic</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, editorTab === 'personality' && styles.tabActive]}
                    onPress={() => setEditorTab('personality')}
                  >
                    <Ionicons name="heart" size={20} color={editorTab === 'personality' ? '#8b5cf6' : '#71717a'} />
                    <Text style={[styles.tabText, editorTab === 'personality' && styles.tabTextActive]}>Personality</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, editorTab === 'animations' && styles.tabActive]}
                    onPress={() => setEditorTab('animations')}
                  >
                    <Ionicons name="play-circle" size={20} color={editorTab === 'animations' ? '#8b5cf6' : '#71717a'} />
                    <Text style={[styles.tabText, editorTab === 'animations' && styles.tabTextActive]}>Animations</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, editorTab === 'advanced' && styles.tabActive]}
                    onPress={() => setEditorTab('advanced')}
                  >
                    <Ionicons name="code-slash" size={20} color={editorTab === 'advanced' ? '#8b5cf6' : '#71717a'} />
                    <Text style={[styles.tabText, editorTab === 'advanced' && styles.tabTextActive]}>Advanced</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  {/* Live Preview */}
                  <View style={styles.editorPreview}>
                    <CharacterDisplay3D
                      characterId={editedCharacter.id}
                      isActive={true}
                      animation={currentAnimation === 'talking' ? 'idle' : currentAnimation}
                      isTalking={currentAnimation === 'talking'}
                    />
                  </View>

                  {/* Basic Tab */}
                  {editorTab === 'basic' && (
                    <View style={styles.tabContent}>
                      <View style={styles.formSection}>
                        <Text style={styles.formLabel}>Name</Text>
                        <TextInput
                          style={styles.input}
                          value={editedCharacter.name}
                          onChangeText={(value) => updateCharacterField('name', value)}
                          placeholder="Character name"
                          placeholderTextColor="#71717a"
                        />
                      </View>

                      <View style={styles.formSection}>
                        <Text style={styles.formLabel}>Role</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={styles.roleRow}>
                            {ROLES.map((role) => (
                              <TouchableOpacity
                                key={role}
                                style={[
                                  styles.roleChip,
                                  editedCharacter.role === role && styles.roleChipActive,
                                ]}
                                onPress={() => updateCharacterField('role', role)}
                              >
                                <Text style={[
                                  styles.roleChipText,
                                  editedCharacter.role === role && styles.roleChipTextActive,
                                ]}>
                                  {role}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      </View>

                      <View style={styles.formSection}>
                        <Text style={styles.formLabel}>Description</Text>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={editedCharacter.description}
                          onChangeText={(value) => updateCharacterField('description', value)}
                          placeholder="Brief description"
                          placeholderTextColor="#71717a"
                          multiline
                          numberOfLines={3}
                        />
                      </View>

                      <ColorPicker
                        label="Primary Color"
                        selectedColor={editedCharacter.color}
                        onColorSelect={(color) => updateCharacterField('color', color)}
                        colors={BODY_COLORS}
                      />
                    </View>
                  )}

                  {/* Personality Tab */}
                  {editorTab === 'personality' && (
                    <View style={styles.tabContent}>
                      <Text style={styles.sectionTitle}>System Prompt</Text>
                      <Text style={styles.sectionSubtitle}>Define how your Wakattor behaves and responds</Text>

                      <View style={styles.formSection}>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={editedCharacter.systemPrompt}
                          onChangeText={(value) => updateCharacterField('systemPrompt', value)}
                          placeholder="Define character behavior and personality..."
                          placeholderTextColor="#71717a"
                          multiline
                          numberOfLines={12}
                        />
                      </View>
                    </View>
                  )}

                  {/* Animations Tab */}
                  {editorTab === 'animations' && (
                    <View style={styles.tabContent}>
                      <Text style={styles.sectionTitle}>Test Animations</Text>
                      <Text style={styles.sectionSubtitle}>Preview different animation states</Text>

                      <View style={styles.animationGrid}>
                        {(['idle', 'thinking', 'talking', 'confused', 'happy', 'excited', 'winning', 'walking', 'jump', 'surprise_jump', 'surprise_happy'] as AnimationState[]).map((animation) => (
                          <TouchableOpacity
                            key={animation}
                            style={[
                              styles.animationButton,
                              currentAnimation === animation && styles.animationButtonActive,
                            ]}
                            onPress={() => setCurrentAnimation(animation)}
                          >
                            <Text style={[
                              styles.animationButtonText,
                              currentAnimation === animation && styles.animationButtonTextActive,
                            ]}>
                              {animation.replace('_', ' ').split(' ').map(word =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Advanced Tab */}
                  {editorTab === 'advanced' && (
                    <View style={styles.tabContent}>
                      <Text style={styles.sectionTitle}>Advanced Settings</Text>

                      <View style={styles.formSection}>
                        <Text style={styles.formLabel}>Custom System Prompt</Text>
                        <Text style={styles.formHint}>Define custom behavior and personality</Text>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={editedCharacter.systemPrompt}
                          onChangeText={(value) => updateCharacterField('systemPrompt', value)}
                          placeholder="Optional: Define custom behavior"
                          placeholderTextColor="#71717a"
                          multiline
                          numberOfLines={8}
                        />
                      </View>

                      <View style={styles.formSection}>
                        <Text style={styles.formLabel}>Response Style</Text>
                        <TextInput
                          style={styles.input}
                          value={editedCharacter.responseStyle}
                          onChangeText={(value) => updateCharacterField('responseStyle', value)}
                          placeholder="e.g., analytical, warm, direct"
                          placeholderTextColor="#71717a"
                        />
                      </View>
                    </View>
                  )}

                  {/* Save/Cancel Buttons */}
                  <View style={styles.formActions}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                      <Ionicons name="checkmark-circle" size={24} color="white" />
                      <Text style={styles.saveButtonText}>Save Wakattor</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa',
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    alignSelf: 'flex-start',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  card: {
    width: 200,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cardPreview: {
    height: 140,
    backgroundColor: '#0a0a0a',
    padding: 12,
  },
  cardInfo: {
    padding: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardRole: {
    fontSize: 11,
    color: '#8b5cf6',
    marginBottom: 6,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#27272a',
  },
  actionButtonText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  removeButtonText: {
    color: '#ef4444',
  },
  inChatMenuButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  inChatMenuText: {
    color: '#10b981',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#d4d4d8',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#71717a',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 800,
    height: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#0f0f0f',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#8b5cf6',
  },
  tabText: {
    color: '#71717a',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#8b5cf6',
  },
  modalScroll: {
    flex: 1,
  },
  editorPreview: {
    height: 300,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  tabContent: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 24,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  formHint: {
    color: '#71717a',
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  roleChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  roleChipText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '600',
  },
  roleChipTextActive: {
    color: 'white',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  optionButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  optionButtonText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '600',
  },
  optionButtonTextActive: {
    color: 'white',
  },
  animationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  animationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  animationButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  animationButtonText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '600',
  },
  animationButtonTextActive: {
    color: 'white',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#d4d4d8',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 24,
    marginHorizontal: 16,
    width: '100%',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    width: '100%',
  },
  emptyConversationSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    width: '100%',
  },
  addToCollectionButton: {
    backgroundColor: '#8b5cf6',
    flex: 1,
  },
  addToCollectionButtonDisabled: {
    backgroundColor: '#27272a',
    opacity: 0.6,
  },
  addToCollectionButtonText: {
    color: 'white',
  },
});
