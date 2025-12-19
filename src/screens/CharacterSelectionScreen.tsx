/**
 * Character Selection Screen - Select Wakattors for a New Conversation
 * Features: Profession filters, search, mosaic grid layout
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CharacterBehavior, getAllCharacters, registerCustomCharacters } from '../config/characters';
import { getCustomWakattors } from '../services/customWakattorsService';
import { useCustomAlert } from '../components/CustomAlert';
import { useResponsive } from '../constants/Layout';

interface Props {
  onStartConversation: (selectedCharacterIds: string[]) => void;
  onCancel: () => void;
}

const MAX_CHARACTERS = 5;

// Profession filter options
const PROFESSIONS = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'psychologist', label: 'Psychology', icon: 'brain' },
  { id: 'philosopher', label: 'Philosophy', icon: 'school' },
  { id: 'coach', label: 'Coaching', icon: 'fitness' },
  { id: 'spiritual', label: 'Spiritual', icon: 'leaf' },
  { id: 'creative', label: 'Creative', icon: 'color-palette' },
];

export default function CharacterSelectionScreen({ onStartConversation, onCancel }: Props) {
  const { showAlert, AlertComponent } = useCustomAlert();
  const { fonts, spacing, layout, isMobile, isTablet, width: screenWidth } = useResponsive();
  const [characters, setCharacters] = useState<CharacterBehavior[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedProfession, setSelectedProfession] = useState('all');

  // Responsive card dimensions
  const cardWidth = useMemo(() => {
    if (isMobile) return Math.floor((screenWidth - spacing.lg * 3) / 2); // 2 columns on mobile
    if (isTablet) return Math.floor((screenWidth - spacing.lg * 4) / 3); // 3 columns on tablet
    return Math.floor((screenWidth - spacing.lg * 5) / 4); // 4 columns on desktop
  }, [isMobile, isTablet, screenWidth, spacing.lg]);

  const avatarSize = useMemo(() => {
    return isMobile ? 50 : isTablet ? 56 : 64;
  }, [isMobile, isTablet]);

  // Dynamic styles based on responsive values
  const dynamicStyles = useMemo(() => ({
    mosaicCard: {
      width: cardWidth,
      minWidth: isMobile ? 130 : 150,
      maxWidth: isMobile ? 180 : 220,
      padding: spacing.md,
      backgroundColor: '#18181b',
      borderRadius: spacing.md,
      borderWidth: 1,
      borderColor: '#27272a',
      alignItems: 'center' as const,
      position: 'relative' as const,
    },
    checkBadge: {
      position: 'absolute' as const,
      top: spacing.sm,
      right: spacing.sm,
      width: layout.minTouchTarget * 0.5,
      height: layout.minTouchTarget * 0.5,
      borderRadius: layout.minTouchTarget * 0.25,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    mosaicAvatar: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
    },
    mosaicAvatarText: {
      fontSize: fonts.xxl,
      fontWeight: '700' as const,
    },
    mosaicName: {
      fontSize: fonts.md,
      fontWeight: '600' as const,
      marginBottom: spacing.xs,
      textAlign: 'center' as const,
    },
    mosaicRole: {
      fontSize: fonts.xs,
      color: '#8b5cf6',
      textAlign: 'center' as const,
    },
    topBar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: '#18181b',
      borderBottomWidth: 1,
      borderBottomColor: '#27272a',
    },
    title: {
      color: '#fff',
      fontSize: fonts.lg,
      fontWeight: '600' as const,
    },
    cancelText: {
      color: '#a1a1aa',
      fontSize: fonts.md,
    },
    startBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      backgroundColor: '#22c55e',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: spacing.sm,
      minHeight: layout.minTouchTarget,
    },
    startText: {
      color: '#fff',
      fontSize: fonts.md,
      fontWeight: '600' as const,
    },
    selectedChip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      backgroundColor: '#27272a',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: spacing.lg,
      minHeight: layout.minTouchTarget * 0.75,
    },
    selectedName: {
      color: '#e4e4e7',
      fontSize: fonts.sm,
      fontWeight: '500' as const,
    },
    filterChip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderRadius: spacing.xl,
      backgroundColor: '#27272a',
      marginRight: spacing.sm,
      minHeight: layout.minTouchTarget,
    },
    filterChipText: {
      color: '#a1a1aa',
      fontSize: fonts.sm,
      fontWeight: '500' as const,
    },
    searchInput: {
      flex: 1,
      color: '#fff',
      fontSize: fonts.md,
    },
    loadingText: {
      color: '#71717a',
      marginTop: spacing.sm,
      fontSize: fonts.md,
    },
    emptyText: {
      color: '#52525b',
      marginTop: spacing.sm,
      fontSize: fonts.md,
    },
  }), [fonts, spacing, layout, cardWidth, avatarSize, isMobile]);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      const builtIn = getAllCharacters();
      const custom = await getCustomWakattors();
      const map = new Map<string, CharacterBehavior>();
      builtIn.forEach(c => map.set(c.id, c));
      custom.forEach(c => map.set(c.id, { ...c, isCustom: true }));
      registerCustomCharacters(custom);
      setCharacters(Array.from(map.values()));
    } catch (e) {
      setCharacters(getAllCharacters());
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = characters;

    // Filter by profession
    if (selectedProfession !== 'all') {
      result = result.filter(c => {
          const role = (c.role || '').toLowerCase();
          const desc = (c.description || '').toLowerCase();
          const name = (c.name || '').toLowerCase();

          switch (selectedProfession) {
            case 'psychologist':
              return role.includes('psycho') || role.includes('therap') ||
                     desc.includes('psycho') || desc.includes('therap') ||
                     name.includes('freud') || name.includes('jung') || name.includes('adler');
            case 'philosopher':
              return role.includes('philoso') || desc.includes('philoso') ||
                     role.includes('socrat') || desc.includes('existential');
            case 'coach':
              return role.includes('coach') || desc.includes('coach') ||
                     role.includes('mentor') || desc.includes('motivation');
            case 'spiritual':
              return role.includes('spirit') || desc.includes('spirit') ||
                     role.includes('mindful') || desc.includes('mindful') ||
                     role.includes('meditat') || desc.includes('zen');
            case 'creative':
              return role.includes('creativ') || desc.includes('creativ') ||
                     role.includes('artist') || desc.includes('art') ||
                     role.includes('writer') || desc.includes('storytell');
            default:
              return true;
          }
        });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.role?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [characters, searchQuery, selectedProfession]);

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= MAX_CHARACTERS) {
        showAlert('Limit Reached', `Maximum ${MAX_CHARACTERS} characters allowed.`);
        return prev;
      }
      return [...prev, id];
    });
  }, [showAlert]);

  const start = () => {
    if (selectedIds.length === 0) {
      showAlert('Select Characters', 'Please select at least one character.');
      return;
    }
    onStartConversation(selectedIds);
  };

  // Render a single character card (mosaic tile)
  const renderCard = (char: CharacterBehavior) => {
    const selected = selectedIds.includes(char.id);
    return (
      <TouchableOpacity
        key={char.id}
        style={[
          dynamicStyles.mosaicCard,
          selected && { borderColor: char.color, borderWidth: 2 },
        ]}
        onPress={() => toggle(char.id)}
        activeOpacity={0.7}
      >
        {selected && (
          <View style={[dynamicStyles.checkBadge, { backgroundColor: char.color }]}>
            <Ionicons name="checkmark" size={Math.round(fonts.sm)} color="#fff" />
          </View>
        )}

        <View style={[dynamicStyles.mosaicAvatar, { backgroundColor: char.color + '30' }]}>
          <Text style={[dynamicStyles.mosaicAvatarText, { color: char.color }]}>
            {char.name?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={[dynamicStyles.mosaicName, { color: char.color }]} numberOfLines={1}>
          {char.name}
        </Text>
        <Text style={dynamicStyles.mosaicRole} numberOfLines={1}>
          {char.role || 'Character'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={dynamicStyles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AlertComponent />

      {/* Top Bar */}
      <View style={dynamicStyles.topBar}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Ionicons name="arrow-back" size={Math.round(fonts.xl)} color="#fff" />
          <Text style={dynamicStyles.cancelText}>Back</Text>
        </TouchableOpacity>

        <Text style={dynamicStyles.title}>New Conversation</Text>

        <TouchableOpacity
          onPress={start}
          style={[dynamicStyles.startBtn, selectedIds.length === 0 && styles.startBtnDisabled]}
          disabled={selectedIds.length === 0}
        >
          <Text style={dynamicStyles.startText}>Start ({selectedIds.length})</Text>
          <Ionicons name="arrow-forward" size={Math.round(fonts.lg)} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Selected Preview */}
      {selectedIds.length > 0 && (
        <View style={[styles.selectedBar, { padding: spacing.sm, gap: spacing.sm }]}>
          {selectedIds.map(id => {
            const c = characters.find(x => x.id === id);
            if (!c) return null;
            return (
              <TouchableOpacity key={id} onPress={() => toggle(id)} style={dynamicStyles.selectedChip}>
                <View style={[styles.dot, { backgroundColor: c.color }]} />
                <Text style={dynamicStyles.selectedName}>{c.name}</Text>
                <Ionicons name="close" size={Math.round(fonts.sm)} color="#f87171" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Profession Filter - Horizontal scroll */}
      <View style={[styles.filterContainer, { paddingVertical: spacing.sm }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={[styles.filterScroll, { paddingHorizontal: spacing.sm, gap: spacing.sm }]}
        >
          {PROFESSIONS.map(prof => (
            <TouchableOpacity
              key={prof.id}
              style={[
                dynamicStyles.filterChip,
                selectedProfession === prof.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedProfession(prof.id)}
            >
              <Ionicons
                name={prof.icon as any}
                size={Math.round(fonts.lg)}
                color={selectedProfession === prof.id ? '#fff' : '#a1a1aa'}
              />
              <Text
                style={[
                  dynamicStyles.filterChipText,
                  selectedProfession === prof.id && styles.filterChipTextActive,
                ]}
              >
                {prof.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search */}
      <View style={[styles.searchBox, { margin: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Ionicons name="search" size={Math.round(fonts.lg)} color="#71717a" />
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Search characters..."
          placeholderTextColor="#71717a"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={Math.round(fonts.lg)} color="#71717a" />
          </TouchableOpacity>
        )}
      </View>

      {/* Character Grid - Mosaic Layout */}
      <View style={styles.listWrapper}>
        {Platform.OS === 'web' ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: spacing.sm,
            }}
          >
            {filtered.length === 0 ? (
              <View style={[styles.empty, { paddingTop: spacing.xxxl }]}>
                <Ionicons name="people-outline" size={Math.round(fonts.xxxl * 1.5)} color="#3f3f46" />
                <Text style={dynamicStyles.emptyText}>No characters found</Text>
              </View>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: spacing.sm,
                  justifyContent: 'flex-start',
                }}
              >
                {filtered.map(char => renderCard(char))}
              </div>
            )}
          </div>
        ) : (
          <ScrollView style={styles.listContainer} contentContainerStyle={[styles.mosaicGrid, { padding: spacing.sm, gap: spacing.sm }]}>
            {filtered.length === 0 ? (
              <View style={[styles.empty, { paddingTop: spacing.xxxl }]}>
                <Ionicons name="people-outline" size={Math.round(fonts.xxxl * 1.5)} color="#3f3f46" />
                <Text style={dynamicStyles.emptyText}>No characters found</Text>
              </View>
            ) : (
              filtered.map(char => renderCard(char))
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// Static styles (non-responsive) - dynamic styles are computed in component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    // @ts-ignore - web-specific
    ...Platform.select({
      web: {
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
      },
    }),
  },
  loading: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startBtnDisabled: {
    backgroundColor: '#3f3f46',
  },
  selectedBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterContainer: {
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChipActive: {
    backgroundColor: '#8b5cf6',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#18181b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  listWrapper: {
    flex: 1,
    position: 'relative',
  },
  listContainer: {
    flex: 1,
  },
  mosaicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
