/**
 * Character Creation Wizard
 * 3-step LLM-assisted character creation flow
 */

import React, { useState, useMemo } from 'react';
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
  const { fonts, spacing, layout, borderRadius, scalePx, components, isMobile } = useResponsive();
  const [step, setStep] = useState<WizardStep>('name');

  const dynamicStyles = useMemo(() => ({
    header: {
      padding: spacing.xl,
    },
    headerTitle: {
      fontSize: fonts.xxl,
    },
    contentContainer: {
      padding: spacing.xl,
    },
    iconContainer: {
      marginBottom: spacing.xl,
    },
    stepTitle: {
      fontSize: isMobile ? fonts.xl : fonts.xxl,
      marginBottom: spacing.md,
    },
    stepDescription: {
      fontSize: fonts.lg,
      marginBottom: spacing.xl,
      lineHeight: scalePx(24),
    },
    nameInput: {
      fontSize: fonts.lg,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      marginBottom: spacing.xl,
    },
    inputLabel: {
      fontSize: fonts.lg,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    input: {
      fontSize: fonts.lg,
      padding: spacing.md,
      borderRadius: borderRadius.sm,
      marginBottom: spacing.md,
    },
    textArea: {
      minHeight: scalePx(100),
    },
    primaryButton: {
      gap: spacing.sm,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xxl,
      borderRadius: borderRadius.md,
      marginTop: spacing.lg,
    },
    primaryButtonText: {
      fontSize: fonts.lg,
    },
    loadingText: {
      fontSize: fonts.xl,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    errorText: {
      fontSize: fonts.sm,
      marginTop: spacing.md,
    },
    questionsContainer: {
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      marginBottom: spacing.xl,
    },
    questionsTitle: {
      fontSize: fonts.lg,
      marginBottom: spacing.md,
    },
    questionText: {
      fontSize: fonts.sm,
      marginBottom: spacing.sm,
      lineHeight: scalePx(20),
    },
    previewContainer: {
      height: isMobile ? scalePx(200) : scalePx(250),
      borderRadius: borderRadius.md,
      marginBottom: spacing.xl,
    },
    infoContainer: {
      maxHeight: scalePx(300),
      marginBottom: spacing.lg,
    },
    infoRow: {
      marginBottom: spacing.md,
    },
    infoLabel: {
      fontSize: fonts.sm,
      marginRight: spacing.sm,
      minWidth: scalePx(100),
    },
    infoValue: {
      fontSize: fonts.sm,
    },
    iconSize: isMobile ? components.iconSizes.xl : scalePx(64),
    iconSizeMd: components.iconSizes.lg,
    iconSizeSm: components.iconSizes.md,
  }), [fonts, spacing, borderRadius, scalePx, components, isMobile]);
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
            <View style={[styles.iconContainer, dynamicStyles.iconContainer]}>
              <Ionicons name="person-add" size={dynamicStyles.iconSize} color="#8b5cf6" />
            </View>
            <Text style={[styles.stepTitle, dynamicStyles.stepTitle]}>
              What's the character's name?
            </Text>
            <Text style={[styles.stepDescription, dynamicStyles.stepDescription]}>
              Enter a known character (Einstein, Socrates, Shakespeare) or create your own fictional character
            </Text>
            <TextInput
              style={[
                styles.nameInput,
                dynamicStyles.nameInput,
                { maxWidth: isMobile ? '100%' : scalePx(500) }
              ]}
              value={characterName}
              onChangeText={setCharacterName}
              placeholder="e.g., Albert Einstein, Incredible Man"
              placeholderTextColor="#71717a"
              autoFocus
              onSubmitEditing={handleNameSubmit}
            />
            {error && <Text style={[styles.errorText, dynamicStyles.errorText]}>{error}</Text>}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                dynamicStyles.primaryButton,
                { minHeight: layout.minTouchTarget }
              ]}
              onPress={handleNameSubmit}
            >
              <Text style={[styles.primaryButtonText, dynamicStyles.primaryButtonText]}>Analyze Character</Text>
              <Ionicons name="arrow-forward" size={dynamicStyles.iconSizeSm} color="white" />
            </TouchableOpacity>
          </View>
        );

      case 'analyzing':
        return (
          <View style={styles.stepContent}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={[styles.loadingText, dynamicStyles.loadingText]}>
              Analyzing "{characterName}"...
            </Text>
            <Text style={[styles.stepDescription, dynamicStyles.stepDescription]}>
              Our AI is determining if this is a known character
            </Text>
          </View>
        );

      case 'known-review':
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, dynamicStyles.stepTitle]}>Character Found!</Text>
            <Text style={[styles.stepDescription, dynamicStyles.stepDescription]}>
              We've generated a configuration for {generatedCharacter?.name}. Review and adjust as needed.
            </Text>
            {generatedCharacter && (
              <>
                <View style={[styles.previewContainer, dynamicStyles.previewContainer]}>
                  <CharacterDisplay3D character={generatedCharacter} isActive={true} />
                </View>
                <ScrollView style={[styles.infoContainer, dynamicStyles.infoContainer]}>
                  <View style={[styles.infoRow, dynamicStyles.infoRow]}>
                    <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Name:</Text>
                    <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{generatedCharacter.name}</Text>
                  </View>
                  <View style={[styles.infoRow, dynamicStyles.infoRow]}>
                    <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Role:</Text>
                    <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{generatedCharacter.role}</Text>
                  </View>
                  <View style={[styles.infoRow, dynamicStyles.infoRow]}>
                    <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Description:</Text>
                    <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{generatedCharacter.description}</Text>
                  </View>
                  <View style={[styles.infoRow, dynamicStyles.infoRow]}>
                    <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>System Prompt:</Text>
                    <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{generatedCharacter.systemPrompt}</Text>
                  </View>
                </ScrollView>
                {error && <Text style={[styles.errorText, dynamicStyles.errorText]}>{error}</Text>}
                <TouchableOpacity style={[styles.primaryButton, dynamicStyles.primaryButton]} onPress={handleSaveCharacter}>
                  <Ionicons name="checkmark-circle" size={dynamicStyles.iconSizeMd} color="white" />
                  <Text style={[styles.primaryButtonText, dynamicStyles.primaryButtonText]}>Create Character</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );

      case 'fictional-input':
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, dynamicStyles.stepTitle]}>Describe Your Character</Text>
            <Text style={[styles.stepDescription, dynamicStyles.stepDescription]}>
              Help us create "{characterName}" by providing 2-3 key traits or a description
            </Text>

            {analysis?.suggestedQuestions && analysis.suggestedQuestions.length > 0 && (
              <View style={[styles.questionsContainer, dynamicStyles.questionsContainer]}>
                <Text style={[styles.questionsTitle, dynamicStyles.questionsTitle]}>Consider these questions:</Text>
                {analysis.suggestedQuestions.map((question, index) => (
                  <Text key={index} style={[styles.questionText, dynamicStyles.questionText]}>• {question}</Text>
                ))}
              </View>
            )}

            <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Key Traits (2-3)</Text>
            {userTraits.map((trait, index) => (
              <TextInput
                key={index}
                style={[styles.input, dynamicStyles.input]}
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

            <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Additional Description (Optional)</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input, styles.textArea, dynamicStyles.textArea]}
              value={userDescription}
              onChangeText={setUserDescription}
              placeholder="Describe your character's personality, appearance, and role..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={4}
            />

            {error && <Text style={[styles.errorText, dynamicStyles.errorText]}>{error}</Text>}
            <TouchableOpacity style={[styles.primaryButton, dynamicStyles.primaryButton]} onPress={handleFictionalSubmit}>
              <Text style={[styles.primaryButtonText, dynamicStyles.primaryButtonText]}>Generate Character</Text>
              <Ionicons name="arrow-forward" size={dynamicStyles.iconSizeSm} color="white" />
            </TouchableOpacity>
          </View>
        );

      case 'generating':
        return (
          <View style={styles.stepContent}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Creating "{characterName}"...</Text>
            <Text style={[styles.stepDescription, dynamicStyles.stepDescription]}>Our AI is generating your character's personality and appearance</Text>
          </View>
        );

      case 'final-review':
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, dynamicStyles.stepTitle]}>Your Character is Ready!</Text>
            <Text style={[styles.stepDescription, dynamicStyles.stepDescription]}>
              Review your new character and adjust traits if needed
            </Text>
            {generatedCharacter && (
              <>
                <View style={[styles.previewContainer, dynamicStyles.previewContainer]}>
                  <CharacterDisplay3D character={generatedCharacter} isActive={true} />
                </View>
                <ScrollView style={[styles.infoContainer, dynamicStyles.infoContainer]}>
                  <View style={[styles.infoRow, dynamicStyles.infoRow]}>
                    <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Name:</Text>
                    <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{generatedCharacter.name}</Text>
                  </View>
                  <View style={[styles.infoRow, dynamicStyles.infoRow]}>
                    <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Role:</Text>
                    <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{generatedCharacter.role}</Text>
                  </View>
                  <View style={[styles.infoRow, dynamicStyles.infoRow]}>
                    <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Description:</Text>
                    <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{generatedCharacter.description}</Text>
                  </View>
                  <View style={[styles.infoRow, dynamicStyles.infoRow]}>
                    <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>System Prompt:</Text>
                    <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{generatedCharacter.systemPrompt}</Text>
                  </View>
                </ScrollView>
                {error && <Text style={[styles.errorText, dynamicStyles.errorText]}>{error}</Text>}
                <TouchableOpacity style={[styles.primaryButton, dynamicStyles.primaryButton]} onPress={handleSaveCharacter}>
                  <Ionicons name="checkmark-circle" size={dynamicStyles.iconSizeMd} color="white" />
                  <Text style={[styles.primaryButtonText, dynamicStyles.primaryButtonText]}>Create Character</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );

      case 'saving':
        return (
          <View style={styles.stepContent}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Saving your character...</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Create New Wakattor</Text>
        <TouchableOpacity onPress={onCancel} disabled={step === 'saving'}>
          <Ionicons name="close" size={dynamicStyles.iconSizeMd} color="white" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={dynamicStyles.contentContainer}>
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
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    alignItems: 'center',
  },
  iconContainer: {},
  stepTitle: {
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  stepDescription: {
    color: '#a1a1aa',
    textAlign: 'center',
  },
  nameInput: {
    width: '100%',
    backgroundColor: '#27272a',
    color: 'white',
    borderWidth: 2,
    borderColor: '#3f3f46',
  },
  inputLabel: {
    alignSelf: 'flex-start',
    fontWeight: '600',
    color: '#8b5cf6',
  },
  input: {
    width: '100%',
    backgroundColor: '#27272a',
    color: 'white',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  textArea: {
    textAlignVertical: 'top',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingText: {
    color: 'white',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
  },
  questionsContainer: {
    width: '100%',
    backgroundColor: '#27272a',
  },
  questionsTitle: {
    fontWeight: '600',
    color: '#8b5cf6',
  },
  questionText: {
    color: '#d4d4d8',
  },
  previewContainer: {
    width: '100%',
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
  },
  infoContainer: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#8b5cf6',
  },
  infoValue: {
    flex: 1,
    color: '#d4d4d8',
  },
});
