/**
 * Wakatinstein Screen - Character Discovery & Search
 * Browse and search through 100+ AI characters
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
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getCustomWakattors, CustomWakattor } from '../services/customWakattorsService';
import { CharacterDisplay3D } from '../components/CharacterDisplay3D';
import { CharacterBehavior } from '../config/characters';

type FilterCategory = 'all' | 'role' | 'style' | 'traits';
type SortOption = 'name' | 'recent' | 'popular';

export default function WakatinsteinScreen() {
  const [characters, setCharacters] = useState<CustomWakattor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedCharacter, setSelectedCharacter] = useState<CustomWakattor | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load characters
  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      const data = await getCustomWakattors();
      // Convert CharacterBehavior[] to CustomWakattor[] format
      // Note: This is a simplified conversion; you may need to adjust based on your data structure
      setCharacters(data as any);
    } catch (error) {
      console.error('Failed to load characters:', error);
    } finally {
      setLoading(false);
    }
  };

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

    // Category filter
    if (selectedCategory !== 'all') {
      // Add specific category filtering logic here
      // For example, filter by role, style, etc.
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'popular':
          // You can add a popularity metric later
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [characters, searchQuery, selectedCategory, sortBy]);

  // Get unique roles for filtering
  const uniqueRoles = useMemo(() => {
    const roles = characters.map((c) => c.role).filter(Boolean);
    return Array.from(new Set(roles));
  }, [characters]);

  const handleCharacterPress = (character: CustomWakattor) => {
    setSelectedCharacter(character);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedCharacter(null);
  };

  const renderCharacterCard = (character: CustomWakattor) => {
    return (
      <TouchableOpacity
        key={character.id}
        style={styles.characterCard}
        onPress={() => handleCharacterPress(character)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.colorDot, { backgroundColor: character.color }]} />
          <View style={styles.cardHeaderText}>
            <Text style={styles.characterName} numberOfLines={1}>
              {character.name}
            </Text>
            <Text style={styles.characterRole} numberOfLines={1}>
              {character.role}
            </Text>
          </View>
        </View>

        <Text style={styles.characterDescription} numberOfLines={2}>
          {character.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.traitBadges}>
            {character.traits && Object.entries(character.traits).slice(0, 3).map(([key, value]) => (
              <View key={key} style={styles.traitBadge}>
                <Text style={styles.traitBadgeText}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                </Text>
              </View>
            ))}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#71717a" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading characters...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="head-lightbulb-outline" size={28} color="#8b5cf6" />
          <View>
            <Text style={styles.title}>Wakatinstein</Text>
            <Text style={styles.subtitle}>{characters.length} Characters</Text>
          </View>
        </View>
        <TouchableOpacity onPress={loadCharacters} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="#a1a1aa" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#71717a" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search characters by name, role, or traits..."
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

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
          {(['recent', 'name', 'popular'] as SortOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.sortButton, sortBy === option && styles.sortButtonActive]}
              onPress={() => setSortBy(option)}
            >
              <Text style={[styles.sortButtonText, sortBy === option && styles.sortButtonTextActive]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Role Filters */}
      {uniqueRoles.length > 0 && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === 'all' && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {uniqueRoles.slice(0, 10).map((role) => (
              <TouchableOpacity
                key={role}
                style={[styles.filterChip]}
                onPress={() => {
                  // Could implement role-based filtering
                }}
              >
                <Text style={styles.filterChipText}>{role}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Character Grid */}
      <ScrollView style={styles.characterList} contentContainerStyle={styles.characterListContent}>
        {filteredCharacters.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#52525b" />
            <Text style={styles.emptyTitle}>No characters found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : 'Start by creating your first character'}
            </Text>
          </View>
        ) : (
          <View style={styles.characterGrid}>
            {filteredCharacters.map((character) => renderCharacterCard(character))}
          </View>
        )}
      </ScrollView>

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <Modal
          visible={showDetailModal}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseDetail}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={[styles.modalColorDot, { backgroundColor: selectedCharacter.color }]} />
                  <View>
                    <Text style={styles.modalTitle}>{selectedCharacter.name}</Text>
                    <Text style={styles.modalSubtitle}>{selectedCharacter.role}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleCloseDetail} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color="#a1a1aa" />
                </TouchableOpacity>
              </View>

              {/* 3D Preview */}
              <View style={styles.preview3D}>
                <CharacterDisplay3D
                  characterId={selectedCharacter.character_id}
                  animation="idle"
                />
              </View>

              {/* Details */}
              <ScrollView style={styles.modalBody}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.sectionContent}>{selectedCharacter.description}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Personality Traits</Text>
                  <View style={styles.traitsGrid}>
                    {selectedCharacter.traits &&
                      Object.entries(selectedCharacter.traits).map(([key, value]) => (
                        <View key={key} style={styles.traitItem}>
                          <Text style={styles.traitName}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </Text>
                          <View style={styles.traitBar}>
                            <View
                              style={[
                                styles.traitBarFill,
                                { width: `${(value / 10) * 100}%`, backgroundColor: selectedCharacter.color },
                              ]}
                            />
                          </View>
                          <Text style={styles.traitValue}>{value}/10</Text>
                        </View>
                      ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Response Style</Text>
                  <Text style={styles.sectionContent}>{selectedCharacter.response_style}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Prompt Style</Text>
                  <Text style={styles.sectionContent}>{selectedCharacter.prompt_style}</Text>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleCloseDetail}>
                  <Ionicons name="chatbox-outline" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Start Conversation</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
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
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  sortLabel: {
    fontSize: 13,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  sortScroll: {
    flex: 1,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#18181b',
  },
  sortButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  sortButtonText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  filterChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  filterChipText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: 'white',
  },
  characterList: {
    flex: 1,
  },
  characterListContent: {
    padding: 16,
  },
  characterGrid: {
    gap: 12,
  },
  characterCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  cardHeaderText: {
    flex: 1,
  },
  characterName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  characterRole: {
    fontSize: 13,
    color: '#a1a1aa',
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
  },
  traitBadges: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  traitBadge: {
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  traitBadgeText: {
    fontSize: 11,
    color: '#a1a1aa',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalColorDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  preview3D: {
    height: 200,
    backgroundColor: '#0f0f0f',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    color: '#d4d4d8',
    lineHeight: 22,
  },
  traitsGrid: {
    gap: 12,
  },
  traitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  traitName: {
    fontSize: 13,
    color: '#a1a1aa',
    width: 80,
  },
  traitBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#27272a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  traitBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  traitValue: {
    fontSize: 13,
    color: '#a1a1aa',
    width: 40,
    textAlign: 'right',
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
