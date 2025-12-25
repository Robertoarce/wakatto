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
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CharacterDisplay3D, AnimationState } from '../components/CharacterDisplay3D';
import { CharacterBehavior, getAllCharacters, registerCustomCharacters } from '../config/characters';
import { getCustomWakattors } from '../services/customWakattorsService';
import { Badge } from '../components/ui';
import { useCustomAlert } from '../components/CustomAlert';
import { useResponsive } from '../constants/Layout';


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
  const { fonts, spacing, layout, isMobile, isTablet, borderRadius, scalePx } = useResponsive();
  const [characters, setCharacters] = useState<CharacterBehavior[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterBehavior | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState>('idle');

  // Dynamic styles based on responsive values
  const dynamicStyles = useMemo(() => ({
    loadingText: {
      fontSize: fonts.md,
      color: '#a1a1aa',
      marginTop: spacing.lg,
    },
    title: {
      fontSize: isMobile ? fonts.lg : fonts.xxl,
      fontWeight: '700' as const,
      color: 'white',
    },
    subtitle: {
      fontSize: fonts.xs,
      color: '#71717a',
      marginTop: spacing.xs / 2,
    },
    searchInput: {
      fontSize: fonts.md,
      color: 'white',
    },
    filterLabel: {
      fontSize: fonts.sm,
      color: '#a1a1aa',
      fontWeight: '600' as const,
      marginBottom: spacing.sm,
    },
    roleChipText: {
      fontSize: fonts.md,
      color: '#a1a1aa',
      fontWeight: '600' as const,
    },
    characterName: {
      fontSize: fonts.md,
      fontWeight: '700' as const,
      marginBottom: spacing.sm,
      textAlign: 'center' as const,
    },
    characterRole: {
      fontSize: fonts.sm,
      color: '#a1a1aa',
      marginTop: spacing.xs,
    },
    characterDescription: {
      fontSize: fonts.sm,
      color: '#d4d4d8',
      lineHeight: scalePx(20),
      marginBottom: spacing.md,
    },
    viewDetailsText: {
      fontSize: fonts.sm,
      color: '#8b5cf6',
      fontWeight: '600' as const,
    },
    emptyTitle: {
      fontSize: fonts.lg,
      fontWeight: '700' as const,
      color: 'white',
      marginTop: spacing.lg,
      textAlign: 'center' as const,
    },
    emptySubtext: {
      fontSize: fonts.md,
      color: '#71717a',
      marginTop: spacing.sm,
      textAlign: 'center' as const,
    },
    modalTitle: {
      fontSize: isMobile ? fonts.lg : fonts.xl,
      fontWeight: '700' as const,
      marginBottom: spacing.xs,
    },
    modalSubtitle: {
      fontSize: fonts.sm,
      color: '#a1a1aa',
      marginTop: spacing.xs / 2,
    },
    characterInfoDescription: {
      fontSize: fonts.md,
      color: '#d4d4d8',
      lineHeight: scalePx(24),
      textAlign: 'center' as const,
    },
  }), [fonts, spacing, borderRadius, scalePx, isMobile]);

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
      // This makes them available to getCharacter() for AI responses
      registerCustomCharacters(dbCharacters);

      setCharacters(allCharacters);
      console.log('[LibraryScreen] Loaded', allCharacters.length, 'characters');
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

  const handleCharacterPress = (character: CharacterBehavior) => {
    setSelectedCharacter(character);
    setCurrentAnimation(getRandomAnimation()); // Set random animation
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedCharacter(null);
  };

  const renderCharacterCard = (character: CharacterBehavior) => {
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
        <Text style={[dynamicStyles.characterName, { color: character.color }]} numberOfLines={1}>
          {character.name}
        </Text>

        <Badge label={character.role || 'Character'} variant="primary" size="sm" style={styles.roleBadge} />

        <Text style={dynamicStyles.characterDescription} numberOfLines={3}>
          {character.description}
        </Text>

        <View style={[styles.cardFooter, { marginTop: spacing.sm, paddingTop: spacing.md }]}>
          <Text style={dynamicStyles.viewDetailsText}>Tap to view in 3D</Text>
          <Ionicons name="cube-outline" size={isMobile ? 18 : 20} color="#8b5cf6" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={dynamicStyles.loadingText}>Loading library...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AlertComponent />
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }]}>
        <View style={[styles.headerLeft, { gap: spacing.md }]}>
          <MaterialCommunityIcons name="emoticon-happy-outline" size={isMobile ? 24 : 28} color="#8b5cf6" />
          <View>
            <Text style={dynamicStyles.title}>All Wakattors</Text>
            <Text style={dynamicStyles.subtitle}>{filteredCharacters.length} of {characters.length} Characters</Text>
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
          style={[styles.searchInput, dynamicStyles.searchInput]}
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

      {/* Role/Profession Filter */}
      <View style={styles.filterContainer}>
        <Text style={dynamicStyles.filterLabel}>
          <Ionicons name="briefcase-outline" size={16} color="#a1a1aa" /> Profession:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {uniqueRoles.map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[dynamicStyles.roleChipText, selectedRole === role && styles.roleChipTextActive]}>
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
            <Text style={dynamicStyles.emptyTitle}>No characters found</Text>
            <Text style={dynamicStyles.emptySubtext}>
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
                    <Text style={[dynamicStyles.modalTitle, { color: selectedCharacter.color }]}>
                      {selectedCharacter.name}
                    </Text>
                    <Text style={dynamicStyles.modalSubtitle}>{selectedCharacter.role}</Text>
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
                  characterId={selectedCharacter.id}
                  animation={currentAnimation}
                />
              </View>

              {/* Character Info */}
              <View style={[styles.modalInfo, { padding: spacing.lg }]}>
                <Text style={dynamicStyles.characterInfoDescription}>
                  {selectedCharacter.description}
                </Text>
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
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
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
    borderWidth: 1,
    borderColor: '#27272a',
    // width, minWidth, maxWidth, padding are set dynamically in component
  },
  characterName: {
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleBadge: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  characterRole: {
    color: '#a1a1aa',
    marginTop: 4,
  },
  characterDescription: {
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
    fontWeight: '700',
    color: 'white',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
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
    ...Platform.select({
      web: {
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.5)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
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
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
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
    color: '#d4d4d8',
    lineHeight: 24,
    textAlign: 'center',
  },
});
