/**
 * Wakattors Screen - Character Management
 * Create, view, modify, delete, and fine-tune AI characters
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CharacterDisplay3D, AnimationState } from '../components/CharacterDisplay3D';
import { CharacterCardPreview } from '../components/CharacterCardPreview';
import { CharacterCreationWizard } from '../components/CharacterCreationWizard';
import { getAllCharacters, CharacterBehavior, CHARACTERS } from '../config/characters';
import { getCustomWakattors, deleteCustomWakattor } from '../services/customWakattorsService';

export default function WakattorsScreen() {
  const [builtInCharacters] = useState<CharacterBehavior[]>(getAllCharacters());
  const [customCharacters, setCustomCharacters] = useState<CharacterBehavior[]>([]);
  const [allCharacters, setAllCharacters] = useState<CharacterBehavior[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterBehavior | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editedCharacter, setEditedCharacter] = useState<CharacterBehavior | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load custom characters on mount
  useEffect(() => {
    loadCustomCharacters();
  }, []);

  // Combine built-in and custom characters
  useEffect(() => {
    setAllCharacters([...builtInCharacters, ...customCharacters]);
  }, [builtInCharacters, customCharacters]);

  const loadCustomCharacters = async () => {
    setLoading(true);
    setError('');
    try {
      const customs = await getCustomWakattors();
      setCustomCharacters(customs);
    } catch (err: any) {
      console.error('[Wakattors] Load error:', err);
      setError(err.message || 'Failed to load custom characters');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
  };

  const handleCreationComplete = (character: CharacterBehavior) => {
    setIsCreating(false);
    setCustomCharacters([character, ...customCharacters]);
  };

  const handleCreationCancel = () => {
    setIsCreating(false);
  };

  const handleEdit = (character: CharacterBehavior) => {
    setEditedCharacter({ ...character });
    setIsEditing(true);
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

  const handleDelete = async (characterId: string) => {
    if (!confirm(`Are you sure you want to delete this character?`)) {
      return;
    }

    try {
      await deleteCustomWakattor(characterId);
      setCustomCharacters(customCharacters.filter(c => c.id !== characterId));
    } catch (err: any) {
      console.error('[Wakattors] Delete error:', err);
      alert(`Failed to delete character: ${err.message}`);
    }
  };

  const updateCharacterField = (field: keyof CharacterBehavior, value: any) => {
    if (editedCharacter) {
      setEditedCharacter({ ...editedCharacter, [field]: value });
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Wakattors</Text>
        <Text style={styles.subtitle}>Create and manage your AI characters</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.createButtonText}>Create New Wakattor</Text>
        </TouchableOpacity>
      </View>

      {/* Character Grid */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.grid}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorBanner}>{error}</Text>
          </View>
        )}
        {allCharacters.map((character) => (
          <View key={character.id} style={styles.card}>
            <View style={styles.cardPreview}>
              <CharacterCardPreview character={character} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardName, { color: character.color }]}>
                {character.name}
              </Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {character.description}
              </Text>
              <Text style={styles.cardRole}>{character.role}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    console.log('Edit button clicked for:', character.name);
                    handleEdit(character);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${character.name}`}
                  testID={`edit-button-${character.id}`}
                  // @ts-ignore - onClick is web-only
                  onClick={() => {
                    console.log('Edit button clicked for:', character.name);
                    handleEdit(character);
                  }}
                >
                  <Ionicons name="create" size={20} color="#8b5cf6" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                {!['freud', 'jung', 'adler'].includes(character.id) && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      console.log('Delete button clicked for:', character.id);
                      handleDelete(character.id);
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${character.name}`}
                    testID={`delete-button-${character.id}`}
                    // @ts-ignore - onClick is web-only
                    onClick={() => {
                      console.log('Delete button clicked for:', character.id);
                      handleDelete(character.id);
                    }}
                  >
                    <Ionicons name="trash" size={20} color="#ef4444" />
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
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
                <ScrollView style={styles.modalScroll}>
                  {/* Live Preview */}
                  <View style={styles.editorPreview}>
                    <CharacterDisplay3D characterId={editedCharacter.id} isActive={true} />
                  </View>

                  {/* Basic Info */}
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

                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Primary Color</Text>
                    <TextInput
                      style={styles.input}
                      value={editedCharacter.color}
                      onChangeText={(value) => updateCharacterField('color', value)}
                      placeholder="#8b5cf6"
                      placeholderTextColor="#71717a"
                    />
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>System Prompt</Text>
                    <Text style={styles.formHint}>Define how the character should behave and respond</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={editedCharacter.systemPrompt}
                      onChangeText={(value) => updateCharacterField('systemPrompt', value)}
                      placeholder="Define character behavior and response style"
                      placeholderTextColor="#71717a"
                      multiline
                      numberOfLines={6}
                    />
                  </View>

                  {/* 3D Model Customization */}
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>3D Model Colors</Text>
                    <View style={styles.colorRow}>
                      <View style={styles.colorInput}>
                        <Text style={styles.colorLabel}>Body Color</Text>
                        <TextInput
                          style={styles.input}
                          value={editedCharacter.model3D.bodyColor}
                          onChangeText={(value) => updateModel3D('bodyColor', value)}
                          placeholder="#8b5cf6"
                          placeholderTextColor="#71717a"
                        />
                      </View>
                      <View style={styles.colorInput}>
                        <Text style={styles.colorLabel}>Accessory Color</Text>
                        <TextInput
                          style={styles.input}
                          value={editedCharacter.model3D.accessoryColor}
                          onChangeText={(value) => updateModel3D('accessoryColor', value)}
                          placeholder="#6d28d9"
                          placeholderTextColor="#71717a"
                        />
                      </View>
                    </View>
                  </View>

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

      {/* Character Creation Wizard Modal */}
      <Modal
        visible={isCreating}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCreationCancel}
      >
        <CharacterCreationWizard
          onComplete={handleCreationComplete}
          onCancel={handleCreationCancel}
        />
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
    marginBottom: 8,
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
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
  },
  cardPreview: {
    height: 200,
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
  },
  cardInfo: {
    padding: 16,
    position: 'relative',
    zIndex: 10, // Ensure buttons are above 3D content
  },
  cardName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 8,
  },
  cardRole: {
    fontSize: 13,
    color: '#8b5cf6',
    fontWeight: '600',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#27272a',
    borderRadius: 8,
    cursor: 'pointer', // Web: show pointer cursor
    userSelect: 'none', // Web: prevent text selection
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 800,
    maxHeight: '90%',
    backgroundColor: '#18181b',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  modalScroll: {
    flex: 1,
  },
  modalPreview: {
    height: 300,
    backgroundColor: '#0a0a0a',
  },
  editorPreview: {
    height: 250,
    backgroundColor: '#0a0a0a',
  },
  detailSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#d4d4d8',
    lineHeight: 20,
  },
  traitDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  traitDetailLabel: {
    fontSize: 14,
    color: '#d4d4d8',
  },
  traitDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  formSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#27272a',
    color: 'white',
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorInput: {
    flex: 1,
  },
  colorLabel: {
    fontSize: 14,
    color: '#d4d4d8',
    marginBottom: 8,
  },
  formActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#27272a',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  animationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  animButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#27272a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3f3f46',
  },
  animButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  animButtonText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '600',
  },
  animButtonTextActive: {
    color: 'white',
  },
  formHint: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 4,
    marginBottom: 8,
  },
  errorContainer: {
    width: '100%',
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: '#7f1d1d',
    color: '#fecaca',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});
