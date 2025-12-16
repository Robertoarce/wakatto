/**
 * Character Selection Screen - Select Wakattors for a New Conversation
 * Users must select 1-5 characters before starting a conversation
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CharacterBehavior, getAllCharacters, registerCustomCharacters } from '../config/characters';
import { getCustomWakattors } from '../services/customWakattorsService';
import { Badge } from '../components/ui';
import { useCustomAlert } from '../components/CustomAlert';
import { useResponsive } from '../constants/Layout';

interface CharacterSelectionScreenProps {
  onStartConversation: (selectedCharacterIds: string[]) => void;
  onCancel: () => void;
}

const MAX_CHARACTERS = 5;

export default function CharacterSelectionScreen({
  onStartConversation,
  onCancel,
}: CharacterSelectionScreenProps) {
  const { showAlert, AlertComponent } = useCustomAlert();
  const { fonts, spacing, layout, isMobile, isTablet } = useResponsive();

  const [characters, setCharacters] = useState<CharacterBehavior[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);

  // Responsive card width
  const cardWidth = isMobile ? '100%' : '48%';

  // Load ALL characters - combine built-in + database characters
  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setLoading(true);

      // Get built-in characters
      const builtInCharacters = getAllCharacters();

      // Get database characters (from Supabase)
      const dbCharacters = await getCustomWakattors();

      // Combine both, with database characters taking priority for duplicates
      const characterMap = new Map<string, CharacterBehavior>();

      // Add built-in first
      builtInCharacters.forEach(char => characterMap.set(char.id, char));

      // Then add database characters (overwrites duplicates)
      dbCharacters.forEach(char => characterMap.set(char.id, char));

      const allCharacters = Array.from(characterMap.values());

      // Register database characters to the global registry
      registerCustomCharacters(dbCharacters);

      setCharacters(allCharacters);
      console.log('[CharacterSelectionScreen] Loaded', allCharacters.length, 'characters');
    } catch (error) {
      console.error('Failed to load characters:', error);
      // Fallback to built-in only
      setCharacters(getAllCharacters());
    } finally {
      setLoading(false);
    }
  };

  // Get unique roles from characters
  const uniqueRoles = useMemo(() => {
    const roles = characters.map((c) => c.role).filter(Boolean);
    return ['All', ...Array.from(new Set(roles))];
  }, [characters]);

  // Filter and search characters
  const filteredCharacters = useMemo(() => {
    let filtered = characters;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (char) =>
          char.name?.toLowerCase().includes(query) ||
          char.description?.toLowerCase().includes(query) ||
          char.role?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (selectedRole !== 'All') {
      filtered = filtered.filter(char =>
        char.role?.toLowerCase() === selectedRole.toLowerCase()
      );
    }

    // Sort by name (alphabetical)
    filtered = [...filtered].sort((a, b) => {
      return (a.name || '').localeCompare(b.name || '');
    });

    return filtered;
  }, [characters, searchQuery, selectedRole]);

  const toggleCharacter = (characterId: string) => {
    setSelectedCharacterIds(prev => {
      if (prev.includes(characterId)) {
        // Remove character
        return prev.filter(id => id !== characterId);
      } else {
        // Add character (with max limit check)
        if (prev.length >= MAX_CHARACTERS) {
          showAlert('Maximum Reached', `You can select up to ${MAX_CHARACTERS} Wakattors maximum.`, [{ text: 'OK' }]);
          return prev;
        }
        return [...prev, characterId];
      }
    });
  };

  const handleStartConversation = () => {
    if (selectedCharacterIds.length === 0) {
      showAlert('No Characters Selected', 'Please select at least one Wakattor to start a conversation.', [{ text: 'OK' }]);
      return;
    }
    onStartConversation(selectedCharacterIds);
  };

  const renderSelectedCharacter = (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return null;

    return (
      <View
        key={characterId}
        style={[styles.selectedCharacterChip, { borderColor: character.color }]}
      >
        <View style={[styles.characterIndicator, { backgroundColor: character.color }]} />
        <Text style={[styles.selectedCharacterName, { fontSize: fonts.sm }]}>
          {character.name}
        </Text>
        <TouchableOpacity
          onPress={() => toggleCharacter(characterId)}
          style={styles.removeCharacterButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={14} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderCharacterCard = (character: CharacterBehavior) => {
    const isSelected = selectedCharacterIds.includes(character.id);

    return (
      <TouchableOpacity
        key={character.id}
        style={[
          styles.characterCard,
          {
            width: cardWidth as any,
            minWidth: isMobile ? undefined : 160,
            maxWidth: isMobile ? undefined : 220,
            padding: spacing.lg,
          },
          isSelected && styles.characterCardSelected,
          isSelected && { borderColor: character.color },
        ]}
        onPress={() => toggleCharacter(character.id)}
      >
        {/* Selection indicator */}
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: character.color }]}>
            <Ionicons name="checkmark" size={14} color="white" />
          </View>
        )}

        <View style={[styles.characterIndicator, { backgroundColor: character.color, alignSelf: 'center', marginBottom: 8 }]} />

        <Text style={[styles.characterName, { color: character.color, fontSize: fonts.md }]} numberOfLines={1}>
          {character.name}
        </Text>

        <Badge label={character.role || 'Character'} variant="primary" size="sm" style={styles.roleBadge} />

        <Text style={[styles.characterDescription, { fontSize: fonts.sm }]} numberOfLines={3}>
          {character.description}
        </Text>

        <View style={[styles.cardFooter, { marginTop: spacing.sm, paddingTop: spacing.md }]}>
          <Text style={[styles.selectText, { fontSize: fonts.sm, color: isSelected ? '#ef4444' : '#22c55e' }]}>
            {isSelected ? 'Tap to remove' : 'Tap to select'}
          </Text>
          <Ionicons
            name={isSelected ? "remove-circle" : "add-circle"}
            size={isMobile ? 18 : 20}
            color={isSelected ? '#ef4444' : '#22c55e'}
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={[styles.loadingText, { fontSize: fonts.md }]}>Loading characters...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AlertComponent />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }]}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Ionicons name="arrow-back" size={24} color="#a1a1aa" />
          <Text style={[styles.cancelText, { fontSize: fonts.md }]}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <MaterialCommunityIcons name="emoticon-happy-outline" size={isMobile ? 24 : 28} color="#8b5cf6" />
          <Text style={[styles.title, { fontSize: isMobile ? fonts.lg : fonts.xxl }]}>Select Wakattors</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={[styles.counterText, { fontSize: fonts.sm }]}>
            {selectedCharacterIds.length}/{MAX_CHARACTERS}
          </Text>
        </View>
      </View>

      {/* Selected Characters Section */}
      {selectedCharacterIds.length > 0 && (
        <View style={styles.selectedSection}>
          <Text style={[styles.sectionLabel, { fontSize: fonts.sm }]}>
            Selected ({selectedCharacterIds.length}/{MAX_CHARACTERS})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedScroll}>
            {selectedCharacterIds.map(renderSelectedCharacter)}
          </ScrollView>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#71717a" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, role, or description..."
          placeholderTextColor="#71717a"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#71717a" />
          </TouchableOpacity>
        )}
      </View>

      {/* Role/Profession Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>
          <Ionicons name="briefcase-outline" size={16} color="#a1a1aa" /> Profession:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {uniqueRoles.map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[styles.roleChipText, selectedRole === role && styles.roleChipTextActive]}>
                {role}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Character Grid */}
      <ScrollView style={styles.characterList} contentContainerStyle={styles.characterListContent}>
        {filteredCharacters.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#52525b" />
            <Text style={styles.emptyTitle}>No characters found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : 'Try adjusting your filters'}
            </Text>
          </View>
        ) : (
          <View style={styles.characterMosaic}>
            {filteredCharacters.map((character) => renderCharacterCard(character))}
          </View>
        )}
      </ScrollView>

      {/* Start Conversation Button */}
      <View style={[styles.footer, { padding: spacing.lg }]}>
        <TouchableOpacity
          style={[
            styles.startButton,
            selectedCharacterIds.length === 0 && styles.startButtonDisabled,
          ]}
          onPress={handleStartConversation}
          disabled={selectedCharacterIds.length === 0}
        >
          <Ionicons name="chatbubbles" size={20} color="white" />
          <Text style={[styles.startButtonText, { fontSize: fonts.md }]}>
            {selectedCharacterIds.length === 0
              ? 'Select at least 1 Wakattor'
              : `Start Conversation (${selectedCharacterIds.length})`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#a1a1aa',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelText: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  counterText: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  selectedSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: '#18181b',
  },
  sectionLabel: {
    color: '#a1a1aa',
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedScroll: {
    flexDirection: 'row',
  },
  selectedCharacterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 2,
  },
  characterIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  selectedCharacterName: {
    color: 'white',
    fontWeight: '500',
    marginRight: 4,
  },
  removeCharacterButton: {
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#18181b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 15,
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  filterLabel: {
    fontSize: 13,
    color: '#a1a1aa',
    fontWeight: '600',
    marginBottom: 10,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#18181b',
    borderWidth: 2,
    borderColor: '#27272a',
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
  characterList: {
    flex: 1,
  },
  characterListContent: {
    padding: 16,
    paddingBottom: 100, // Space for the footer button
  },
  characterMosaic: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  characterCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#27272a',
    width: '48%',
    minWidth: 160,
    maxWidth: 200,
    position: 'relative',
  },
  characterCardSelected: {
    backgroundColor: '#1f1f23',
    borderWidth: 2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleBadge: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  characterDescription: {
    fontSize: 14,
    color: '#d4d4d8',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  selectText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#71717a',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#18181b',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#3f3f46',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
