/**
 * Character Creation Wizard
 * 3-step LLM-assisted character creation flow
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CharacterDisplay3D } from './CharacterDisplay3D';
import { CharacterBehavior } from '../config/characters';
import {
  analyzeCharacterName,
  generateCharacterFromDescription,
  buildCharacterBehavior,
  validateCharacterConfig,
  CharacterAnalysis,
  CharacterDescription,
} from '../services/characterGenerationService';
import { createCustomWakattor } from '../services/customWakattorsService';
import { useResponsive } from '../constants/Layout';

type WizardStep = 'name' | 'analyzing' | 'known-review' | 'fictional-input' | 'generating' | 'final-review' | 'saving';

interface Props {
  onComplete: (character: CharacterBehavior) => void;
  onCancel: () => void;
}

export function CharacterCreationWizard({ onComplete, onCancel }: Props) {
  const { fonts, spacing, layout, isMobile } = useResponsive();
  const [step, setStep] = useState<WizardStep>('name');
  const [characterName, setCharacterName] = useState('');
  const [analysis, setAnalysis] = useState<CharacterAnalysis | null>(null);
  const [userTraits, setUserTraits] = useState<string[]>(['', '', '']);
  const [userDescription, setUserDescription] = useState('');
  const [generatedCharacter, setGeneratedCharacter] = useState<CharacterBehavior | null>(null);
  const [error, setError] = useState<string>('');

  // Step 1: Name Input
  const handleNameSubmit = async () => {
    if (!characterName.trim()) {
      setError('Please enter a character name');
      return;
    }

    setError('');
    setStep('analyzing');

    try {
      const result = await analyzeCharacterName(characterName.trim());
      setAnalysis(result);

      if (result.isKnown && result.characterConfig) {
        // Known character - go to review
        const character = buildCharacterBehavior(result.characterConfig, 'temp');
        setGeneratedCharacter(character);
        setStep('known-review');
      } else {
        // Unknown/fictional - ask for traits
        setStep('fictional-input');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze character. Please try again.');
      setStep('name');
    }
  };

  // Step 3b: Generate from user description
  const handleFictionalSubmit = async () => {
    const validTraits = userTraits.filter(t => t.trim().length > 0);

    if (validTraits.length === 0 && !userDescription.trim()) {
      setError('Please provide at least one trait or a description');
      return;
    }

    setError('');
    setStep('generating');

    try {
      const description: CharacterDescription = {
        keyTraits: validTraits,
        description: userDescription.trim() || undefined,
      };

      const config = await generateCharacterFromDescription(characterName, description);
      const character = buildCharacterBehavior(config, 'temp');
      setGeneratedCharacter(character);
      setStep('final-review');
    } catch (err: any) {
      setError(err.message || 'Failed to generate character. Please try again.');
      setStep('fictional-input');
    }
  };

  // Final: Save to database
  const handleSaveCharacter = async () => {
    if (!generatedCharacter) return;

    // Validate
    const validationErrors = validateCharacterConfig(generatedCharacter);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setError('');
    setStep('saving');

    try {
      const savedCharacter = await createCustomWakattor(generatedCharacter);
      onComplete(savedCharacter);
    } catch (err: any) {
      setError(err.message || 'Failed to save character. Please try again.');
      setStep('final-review');
    }
  };


  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'name':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { marginBottom: spacing.xl }]}>
              <Ionicons name="person-add" size={isMobile ? 48 : 64} color="#8b5cf6" />
            </View>
            <Text style={[styles.stepTitle, { fontSize: isMobile ? fonts.xl : fonts.xxl, marginBottom: spacing.md }]}>
              What's the character's name?
            </Text>
            <Text style={[styles.stepDescription, { fontSize: fonts.md, marginBottom: spacing.xl }]}>
              Enter a known character (Einstein, Goku, Superman) or create your own fictional character
            </Text>
            <TextInput
              style={[
                styles.nameInput, 
                { 
                  fontSize: fonts.lg, 
                  padding: spacing.lg,
                  marginBottom: spacing.xl,
                  maxWidth: isMobile ? '100%' : 500,
                }
              ]}
              value={characterName}
              onChangeText={setCharacterName}
              placeholder="e.g., Albert Einstein, Incredible Man"
              placeholderTextColor="#71717a"
              autoFocus
              onSubmitEditing={handleNameSubmit}
            />
            {error && <Text style={[styles.errorText, { fontSize: fonts.sm }]}>{error}</Text>}
            <TouchableOpacity 
              style={[
                styles.primaryButton, 
                { 
                  paddingVertical: spacing.lg, 
                  paddingHorizontal: spacing.xxl,
                  minHeight: layout.minTouchTarget,
                }
              ]} 
              onPress={handleNameSubmit}
            >
              <Text style={[styles.primaryButtonText, { fontSize: fonts.lg }]}>Analyze Character</Text>
              <Ionicons name="arrow-forward" size={isMobile ? 18 : 20} color="white" />
            </TouchableOpacity>
          </View>
        );

      case 'analyzing':
        return (
          <View style={styles.stepContent}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={[styles.loadingText, { fontSize: fonts.lg, marginTop: spacing.lg }]}>
              Analyzing "{characterName}"...
            </Text>
            <Text style={[styles.stepDescription, { fontSize: fonts.md }]}>
              Our AI is determining if this is a known character
            </Text>
          </View>
        );

      case 'known-review':
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { fontSize: isMobile ? fonts.xl : fonts.xxl }]}>Character Found!</Text>
            <Text style={[styles.stepDescription, { fontSize: fonts.md }]}>
              We've generated a configuration for {generatedCharacter?.name}. Review and adjust as needed.
            </Text>
            {generatedCharacter && (
              <>
                <View style={[styles.previewContainer, { height: isMobile ? 200 : 250, marginBottom: spacing.xl }]}>
                  <CharacterDisplay3D character={generatedCharacter} isActive={true} />
                </View>
                <ScrollView style={styles.infoContainer}>
                  <View style={[styles.infoRow, { marginBottom: spacing.md }]}>
                    <Text style={[styles.infoLabel, { fontSize: fonts.sm }]}>Name:</Text>
                    <Text style={[styles.infoValue, { fontSize: fonts.sm }]}>{generatedCharacter.name}</Text>
                  </View>
                  <View style={[styles.infoRow, { marginBottom: spacing.md }]}>
                    <Text style={[styles.infoLabel, { fontSize: fonts.sm }]}>Role:</Text>
                    <Text style={styles.infoValue}>{generatedCharacter.role}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Description:</Text>
                    <Text style={styles.infoValue}>{generatedCharacter.description}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>System Prompt:</Text>
                    <Text style={styles.infoValue}>{generatedCharacter.systemPrompt}</Text>
                  </View>
                </ScrollView>
                {error && <Text style={styles.errorText}>{error}</Text>}
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveCharacter}>
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                  <Text style={styles.primaryButtonText}>Create Character</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );

      case 'fictional-input':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Describe Your Character</Text>
            <Text style={styles.stepDescription}>
              Help us create "{characterName}" by providing 2-3 key traits or a description
            </Text>

            {analysis?.suggestedQuestions && analysis.suggestedQuestions.length > 0 && (
              <View style={styles.questionsContainer}>
                <Text style={styles.questionsTitle}>Consider these questions:</Text>
                {analysis.suggestedQuestions.map((question, index) => (
                  <Text key={index} style={styles.questionText}>• {question}</Text>
                ))}
              </View>
            )}

            <Text style={styles.inputLabel}>Key Traits (2-3)</Text>
            {userTraits.map((trait, index) => (
              <TextInput
                key={index}
                style={styles.input}
                value={trait}
                onChangeText={(text) => {
                  const newTraits = [...userTraits];
                  newTraits[index] = text;
                  setUserTraits(newTraits);
                }}
                placeholder={`Trait ${index + 1} (e.g., brave, intelligent, funny)`}
                placeholderTextColor="#71717a"
              />
            ))}

            <Text style={styles.inputLabel}>Additional Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={userDescription}
              onChangeText={setUserDescription}
              placeholder="Describe your character's personality, appearance, and role..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={4}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity style={styles.primaryButton} onPress={handleFictionalSubmit}>
              <Text style={styles.primaryButtonText}>Generate Character</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        );

      case 'generating':
        return (
          <View style={styles.stepContent}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.loadingText}>Creating "{characterName}"...</Text>
            <Text style={styles.stepDescription}>Our AI is generating your character's personality and appearance</Text>
          </View>
        );

      case 'final-review':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Your Character is Ready!</Text>
            <Text style={styles.stepDescription}>
              Review your new character and adjust traits if needed
            </Text>
            {generatedCharacter && (
              <>
                <View style={styles.previewContainer}>
                  <CharacterDisplay3D character={generatedCharacter} isActive={true} />
                </View>
                <ScrollView style={styles.infoContainer}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoValue}>{generatedCharacter.name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Role:</Text>
                    <Text style={styles.infoValue}>{generatedCharacter.role}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Description:</Text>
                    <Text style={styles.infoValue}>{generatedCharacter.description}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>System Prompt:</Text>
                    <Text style={styles.infoValue}>{generatedCharacter.systemPrompt}</Text>
                  </View>
                </ScrollView>
                {error && <Text style={styles.errorText}>{error}</Text>}
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveCharacter}>
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                  <Text style={styles.primaryButtonText}>Create Character</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );

      case 'saving':
        return (
          <View style={styles.stepContent}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.loadingText}>Saving your character...</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create New Wakattor</Text>
        <TouchableOpacity onPress={onCancel} disabled={step === 'saving'}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {renderStepContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  stepContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#a1a1aa',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  nameInput: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#27272a',
    color: 'white',
    fontSize: 18,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3f3f46',
    marginBottom: 24,
  },
  inputLabel: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: '#27272a',
    color: 'white',
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 20,
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  questionsContainer: {
    width: '100%',
    backgroundColor: '#27272a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  questionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 14,
    color: '#d4d4d8',
    marginBottom: 8,
    lineHeight: 20,
  },
  previewContainer: {
    height: 250,
    width: '100%',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  infoContainer: {
    width: '100%',
    maxHeight: 300,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
    marginRight: 8,
    minWidth: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#d4d4d8',
  },
});
