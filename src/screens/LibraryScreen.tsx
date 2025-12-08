/**
 * Library Screen - Character Discovery & Search
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
import { useNavigation } from '@react-navigation/native';
import { getCustomWakattors, CustomWakattor, addCharacterToWakattors } from '../services/customWakattorsService';
import { CharacterDisplay3D, AnimationState } from '../components/CharacterDisplay3D';
import { CharacterBehavior } from '../config/characters';
import { Badge } from '../components/ui';
import { useCustomAlert } from '../components/CustomAlert';
import { useResponsive } from '../constants/Layout';

type SortOption = 'name' | 'recent' | 'popular';

// Role/Profession filters
const ROLE_FILTERS = ['All', 'Therapist', 'Coach', 'Analyst', 'Friend', 'Mentor', 'Guide', 'Counselor', 'Philosopher'];

// Available animations for random selection
const AVAILABLE_ANIMATIONS: AnimationState[] = [
  'idle',
  'thinking',
  'happy',
  'excited',
  'winning',
  'walking',
  'confused',
  'talking',
];

// Get random animation
const getRandomAnimation = (): AnimationState => {
  return AVAILABLE_ANIMATIONS[Math.floor(Math.random() * AVAILABLE_ANIMATIONS.length)];
};

export default function LibraryScreen() {
  const navigation = useNavigation();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { fonts, spacing, layout, isMobile, isTablet } = useResponsive();
  const [characters, setCharacters] = useState<CustomWakattor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedCharacter, setSelectedCharacter] = useState<CustomWakattor | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState>('idle');
  const [adding, setAdding] = useState(false);

  // Responsive card width
  const cardWidth = isMobile ? '100%' : '48%';

  // Load characters
  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      const data = await getCustomWakattors();
      setCharacters(data as any);
    } catch (error) {
      console.error('Failed to load characters:', error);
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

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'popular':
          return 0; // Placeholder for popularity metric
        default:
          return 0;
      }
    });

    return filtered;
  }, [characters, searchQuery, selectedRole, sortBy]);

  const handleCharacterPress = (character: CustomWakattor) => {
    setSelectedCharacter(character);
    setCurrentAnimation(getRandomAnimation()); // Set random animation
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedCharacter(null);
  };

  const handleAddToWakattors = async () => {
    if (!selectedCharacter) return;

    setAdding(true);
    try {
      // Check if user has reached the 20 character limit
      const currentWakattors = await getCustomWakattors();
      if (currentWakattors.length >= 20) {
        showAlert(
          'Limit Reached',
          'You can have a maximum of 20 Wakattors. Please remove some characters before adding new ones.',
          [{ text: 'OK' }]
        );
        setAdding(false);
        return;
      }

      const result = await addCharacterToWakattors(selectedCharacter);

      if (result.alreadyExists) {
        showAlert(
          'Already Added',
          `${selectedCharacter.name} is already in your Wakattors!`,
          [{ text: 'OK' }]
        );
      } else {
        showAlert(
          'Success!',
          `${selectedCharacter.name} has been added to your Wakattors!`,
          [{ text: 'OK' }]
        );
      }

      // Close modal and navigate to Wakattors tab with the new character ID
      handleCloseDetail();
      // @ts-ignore - Navigate to Wakattors tab
      navigation.navigate('Wakattors', { newCharacterId: result.characterId });
    } catch (error: any) {
      console.error('[Library] Add to Wakattors error:', error);
      showAlert(
        'Error',
        `Failed to add character: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setAdding(false);
    }
  };

  const renderCharacterCard = (character: CustomWakattor) => {
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
          }
        ]}
        onPress={() => handleCharacterPress(character)}
      >
        <Text style={[styles.characterName, { color: character.color, fontSize: fonts.md }]} numberOfLines={1}>
          {character.name}
        </Text>

        <Badge label={character.role || 'Character'} variant="primary" size="sm" style={styles.roleBadge} />

        <Text style={[styles.characterDescription, { fontSize: fonts.sm }]} numberOfLines={3}>
          {character.description}
        </Text>

        <View style={[styles.cardFooter, { marginTop: spacing.sm, paddingTop: spacing.md }]}>
          <Text style={[styles.viewDetailsText, { fontSize: fonts.sm }]}>Tap to view in 3D</Text>
          <Ionicons name="cube-outline" size={isMobile ? 18 : 20} color="#8b5cf6" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={[styles.loadingText, { fontSize: fonts.md }]}>Loading library...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AlertComponent />
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }]}>
        <View style={[styles.headerLeft, { gap: spacing.md }]}>
          <Ionicons name="library" size={isMobile ? 24 : 28} color="#8b5cf6" />
          <View>
            <Text style={[styles.title, { fontSize: isMobile ? fonts.lg : fonts.xxl }]}>Character Library</Text>
            <Text style={styles.subtitle}>{filteredCharacters.length} of {characters.length} Characters</Text>
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
          placeholder="Search by name, role, style, or traits..."
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

      {/* Sort & Filter Bar */}
      <View style={styles.filterBarContainer}>
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort:</Text>
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

      {/* Character Mosaic Grid */}
      <ScrollView style={styles.characterList} contentContainerStyle={styles.characterListContent}>
        {filteredCharacters.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#52525b" />
            <Text style={styles.emptyTitle}>No characters found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : 'Try adjusting your filters or search terms'}
            </Text>
          </View>
        ) : (
          <View style={styles.characterMosaic}>
            {filteredCharacters.map((character) => renderCharacterCard(character))}
          </View>
        )}
      </ScrollView>

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <Modal
          visible={showDetailModal}
          animationType="fade"
          transparent={!isMobile}
          onRequestClose={handleCloseDetail}
        >
          <View style={[styles.modalOverlay, isMobile && { backgroundColor: '#18181b' }]}>
            <View style={[
              styles.modalContent,
              {
                width: layout.modalWidth as any,
                height: layout.modalHeight as any,
                borderRadius: layout.modalBorderRadius,
              }
            ]}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { padding: spacing.lg }]}>
                <View style={styles.modalHeaderLeft}>
                  <View>
                    <Text style={[styles.modalTitle, { color: selectedCharacter.color, fontSize: isMobile ? fonts.lg : fonts.xl }]}>
                      {selectedCharacter.name}
                    </Text>
                    <Text style={[styles.modalSubtitle, { fontSize: fonts.sm }]}>{selectedCharacter.role}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={handleCloseDetail} 
                  style={[styles.closeButton, { minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget }]}
                >
                  <Ionicons name="close" size={isMobile ? 24 : 28} color="#a1a1aa" />
                </TouchableOpacity>
              </View>

              {/* 3D Preview - Full Screen */}
              <View style={styles.preview3DFullScreen}>
                <CharacterDisplay3D
                  characterId={selectedCharacter.character_id}
                  animation={currentAnimation}
                />
              </View>

              {/* Character Info */}
              <View style={[styles.modalInfo, { padding: spacing.lg }]}>
                <Text style={[styles.characterInfoDescription, { fontSize: fonts.md }]}>
                  {selectedCharacter.description}
                </Text>
              </View>

              {/* Action Button */}
              <View style={[styles.modalActions, { padding: spacing.lg }]}>
                <TouchableOpacity
                  style={[
                    styles.actionButton, 
                    adding && styles.actionButtonDisabled,
                    { minHeight: layout.minTouchTarget, paddingVertical: spacing.lg }
                  ]}
                  onPress={handleAddToWakattors}
                  disabled={adding}
                >
                  {adding ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={isMobile ? 20 : 22} color="white" />
                      <Text style={[styles.actionButtonText, { fontSize: fonts.md }]}>Add to Wakattors</Text>
                    </>
                  )}
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
  filterBarContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    borderWidth: 1,
    borderColor: '#27272a',
  },
  sortButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  filterLabel: {
    fontSize: 13,
    color: '#a1a1aa',
    fontWeight: '600',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
    borderWidth: 1,
    borderColor: '#27272a',
    width: '48%', // Two columns on most screens
    minWidth: 160,
    maxWidth: 200,
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
  characterRole: {
    fontSize: 13,
    color: '#a1a1aa',
    marginTop: 4,
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
  viewDetailsText: {
    fontSize: 13,
    color: '#8b5cf6',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    width: '66.67%', // 2/3 of screen width
    height: '66.67%', // 2/3 of screen height
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
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
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  preview3DFullScreen: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  modalInfo: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  characterInfoDescription: {
    fontSize: 15,
    color: '#d4d4d8',
    lineHeight: 24,
    textAlign: 'center',
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
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
