/**
 * Enhanced Wakattors Screen - Character Management with Full Customization
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CharacterDisplay3D, AnimationState } from '../components/CharacterDisplay3D';
import { getAllCharacters, CharacterBehavior, GenderType, SkinToneType, ClothingType, HairType, AccessoryType } from '../config/characters';
import { ColorPicker } from '../components/ColorPicker';
import { TraitSlider } from '../components/TraitSlider';

// Preset color palettes
const BODY_COLORS = [
  '#8b5cf6', '#a855f7', '#c084fc', '#e879f9',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
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

type EditorTab = 'basic' | 'personality' | 'appearance' | 'advanced';

export default function WakattorsScreenEnhanced() {
  const [characters] = useState<CharacterBehavior[]>(getAllCharacters());
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterBehavior | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCharacter, setEditedCharacter] = useState<CharacterBehavior | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState>('idle');
  const [editorTab, setEditorTab] = useState<EditorTab>('basic');

  const handleCreateNew = () => {
    const newCharacter: CharacterBehavior = {
      id: `custom_${Date.now()}`,
      name: 'New Wakattor',
      description: 'A new AI character',
      color: '#8b5cf6',
      role: 'Friend',
      promptStyle: 'compassionate',
      systemPrompt: 'You are a helpful AI assistant.',
      traits: {
        empathy: 5,
        directness: 5,
        formality: 5,
        humor: 5,
        creativity: 5,
        patience: 5,
        wisdom: 5,
        energy: 5,
      },
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

  const updateTrait = (trait: keyof CharacterBehavior['traits'], value: number) => {
    if (editedCharacter) {
      setEditedCharacter({
        ...editedCharacter,
        traits: { ...editedCharacter.traits, [trait]: value },
      });
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
        {characters.map((character) => (
          <View key={character.id} style={styles.card}>
            <View style={styles.cardPreview}>
              <CharacterDisplay3D characterId={character.id} isActive={false} />
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
                  style={styles.actionButton}
                  onPress={() => setSelectedCharacter(character)}
                >
                  <Ionicons name="eye" size={20} color="#06b6d4" />
                  <Text style={styles.actionButtonText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(character)}
                >
                  <Ionicons name="create" size={20} color="#8b5cf6" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
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
                    style={[styles.tab, editorTab === 'appearance' && styles.tabActive]}
                    onPress={() => setEditorTab('appearance')}
                  >
                    <Ionicons name="body" size={20} color={editorTab === 'appearance' ? '#8b5cf6' : '#71717a'} />
                    <Text style={[styles.tabText, editorTab === 'appearance' && styles.tabTextActive]}>Appearance</Text>
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
                    <CharacterDisplay3D characterId={editedCharacter.id} isActive={true} animation={currentAnimation} />
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
                      <Text style={styles.sectionTitle}>Personality Traits</Text>
                      <Text style={styles.sectionSubtitle}>Adjust how your Wakattor behaves and responds</Text>

                      <TraitSlider
                        label="Empathy"
                        value={editedCharacter.traits.empathy}
                        onChange={(value) => updateTrait('empathy', value)}
                      />
                      <TraitSlider
                        label="Directness"
                        value={editedCharacter.traits.directness}
                        onChange={(value) => updateTrait('directness', value)}
                      />
                      <TraitSlider
                        label="Formality"
                        value={editedCharacter.traits.formality}
                        onChange={(value) => updateTrait('formality', value)}
                      />
                      <TraitSlider
                        label="Humor"
                        value={editedCharacter.traits.humor}
                        onChange={(value) => updateTrait('humor', value)}
                      />
                      <TraitSlider
                        label="Creativity"
                        value={editedCharacter.traits.creativity}
                        onChange={(value) => updateTrait('creativity', value)}
                      />
                      <TraitSlider
                        label="Patience"
                        value={editedCharacter.traits.patience}
                        onChange={(value) => updateTrait('patience', value)}
                      />
                      <TraitSlider
                        label="Wisdom"
                        value={editedCharacter.traits.wisdom}
                        onChange={(value) => updateTrait('wisdom', value)}
                      />
                      <TraitSlider
                        label="Energy"
                        value={editedCharacter.traits.energy}
                        onChange={(value) => updateTrait('energy', value)}
                      />
                    </View>
                  )}

                  {/* Appearance Tab */}
                  {editorTab === 'appearance' && (
                    <View style={styles.tabContent}>
                      <Text style={styles.sectionTitle}>Personalize Appearance</Text>
                      <Text style={styles.sectionSubtitle}>Customize how your Wakattor looks</Text>

                      {/* Gender */}
                      <View style={styles.formSection}>
                        <Text style={styles.formLabel}>Gender</Text>
                        <View style={styles.optionRow}>
                          {(['male', 'female', 'neutral'] as GenderType[]).map((gender) => (
                            <TouchableOpacity
                              key={gender}
                              style={[
                                styles.optionButton,
                                editedCharacter.customization.gender === gender && styles.optionButtonActive,
                              ]}
                              onPress={() => updateCustomization('gender', gender)}
                            >
                              <Text style={[
                                styles.optionButtonText,
                                editedCharacter.customization.gender === gender && styles.optionButtonTextActive,
                              ]}>
                                {gender.charAt(0).toUpperCase() + gender.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Skin Tone */}
                      <View style={styles.formSection}>
                        <Text style={styles.formLabel}>Skin Tone</Text>
                        <View style={styles.optionRow}>
                          {(['light', 'medium', 'tan', 'dark'] as SkinToneType[]).map((tone) => (
                            <TouchableOpacity
                              key={tone}
                              style={[
                                styles.optionButton,
                                editedCharacter.customization.skinTone === tone && styles.optionButtonActive,
                              ]}
                              onPress={() => updateCustomization('skinTone', tone)}
                            >
                              <Text style={[
                                styles.optionButtonText,
                                editedCharacter.customization.skinTone === tone && styles.optionButtonTextActive,
                              ]}>
                                {tone.charAt(0).toUpperCase() + tone.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Clothing */}
                      <View style={styles.formSection}>
                        <Text style={styles.formLabel}>Clothing</Text>
                        <View style={styles.optionRow}>
                          {(['suit', 'tshirt', 'dress', 'casual'] as ClothingType[]).map((clothing) => (
                            <TouchableOpacity
                              key={clothing}
                              style={[
                                styles.optionButton,
                                editedCharacter.customization.clothing === clothing && styles.optionButtonActive,
                              ]}
                              onPress={() => updateCustomization('clothing', clothing)}
                            >
                              <Text style={[
                                styles.optionButtonText,
                                editedCharacter.customization.clothing === clothing && styles.optionButtonTextActive,
                              ]}>
                                {clothing.charAt(0).toUpperCase() + clothing.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Hair */}
                      <View style={styles.formSection}>
                        <Text style={styles.formLabel}>Hair Style</Text>
                        <View style={styles.optionRow}>
                          {(['short', 'medium', 'long', 'none'] as HairType[]).map((hair) => (
                            <TouchableOpacity
                              key={hair}
                              style={[
                                styles.optionButton,
                                editedCharacter.customization.hair === hair && styles.optionButtonActive,
                              ]}
                              onPress={() => updateCustomization('hair', hair)}
                            >
                              <Text style={[
                                styles.optionButtonText,
                                editedCharacter.customization.hair === hair && styles.optionButtonTextActive,
                              ]}>
                                {hair.charAt(0).toUpperCase() + hair.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Accessory */}
                      <View style={styles.formSection}>
                        <Text style={styles.formLabel}>Accessory</Text>
                        <View style={styles.optionRow}>
                          {(['none', 'glasses', 'hat', 'tie'] as AccessoryType[]).map((acc) => (
                            <TouchableOpacity
                              key={acc}
                              style={[
                                styles.optionButton,
                                editedCharacter.customization.accessory === acc && styles.optionButtonActive,
                              ]}
                              onPress={() => updateCustomization('accessory', acc)}
                            >
                              <Text style={[
                                styles.optionButtonText,
                                editedCharacter.customization.accessory === acc && styles.optionButtonTextActive,
                              ]}>
                                {acc.charAt(0).toUpperCase() + acc.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <ColorPicker
                        label="Body Color"
                        selectedColor={editedCharacter.customization.bodyColor}
                        onColorSelect={(color) => {
                          updateCustomization('bodyColor', color);
                          updateModel3D('bodyColor', color);
                        }}
                        colors={BODY_COLORS}
                      />

                      <ColorPicker
                        label="Hair Color"
                        selectedColor={editedCharacter.customization.hairColor}
                        onColorSelect={(color) => updateCustomization('hairColor', color)}
                        colors={HAIR_COLORS}
                      />

                      <ColorPicker
                        label="Accessory Color"
                        selectedColor={editedCharacter.customization.accessoryColor}
                        onColorSelect={(color) => {
                          updateCustomization('accessoryColor', color);
                          updateModel3D('accessoryColor', color);
                        }}
                        colors={BODY_COLORS}
                      />
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
  },
  card: {
    width: 280,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cardPreview: {
    height: 200,
    backgroundColor: '#0a0a0a',
  },
  cardInfo: {
    padding: 16,
  },
  cardName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardRole: {
    fontSize: 12,
    color: '#8b5cf6',
    marginBottom: 8,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  actionButtonText: {
    color: '#d4d4d8',
    fontSize: 14,
    fontWeight: '500',
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
});
