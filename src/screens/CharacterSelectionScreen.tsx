/**
 * Character Selection Screen - Select Wakattors for a New Conversation
 * Features: Profession filters, search, mosaic grid layout
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CharacterBehavior, getAllCharacters, registerCustomCharacters } from '../config/characters';
import { getCustomWakattors } from '../services/customWakattorsService';
import { useCustomAlert } from '../components/CustomAlert';

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
  const [characters, setCharacters] = useState<CharacterBehavior[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedProfession, setSelectedProfession] = useState('all');

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
          styles.mosaicCard,
          selected && { borderColor: char.color, borderWidth: 2 },
        ]}
        onPress={() => toggle(char.id)}
        activeOpacity={0.7}
      >
        {selected && (
          <View style={[styles.checkBadge, { backgroundColor: char.color }]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}

        <View style={[styles.mosaicAvatar, { backgroundColor: char.color + '30' }]}>
          <Text style={[styles.mosaicAvatarText, { color: char.color }]}>
            {char.name?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.mosaicName, { color: char.color }]} numberOfLines={1}>
          {char.name}
        </Text>
        <Text style={styles.mosaicRole} numberOfLines={1}>
          {char.role || 'Character'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AlertComponent />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.cancelText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>New Conversation</Text>

        <TouchableOpacity
          onPress={start}
          style={[styles.startBtn, selectedIds.length === 0 && styles.startBtnDisabled]}
          disabled={selectedIds.length === 0}
        >
          <Text style={styles.startText}>Start ({selectedIds.length})</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Selected Preview */}
      {selectedIds.length > 0 && (
        <View style={styles.selectedBar}>
          {selectedIds.map(id => {
            const c = characters.find(x => x.id === id);
            if (!c) return null;
            return (
              <TouchableOpacity key={id} onPress={() => toggle(id)} style={styles.selectedChip}>
                <View style={[styles.dot, { backgroundColor: c.color }]} />
                <Text style={styles.selectedName}>{c.name}</Text>
                <Ionicons name="close" size={14} color="#f87171" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Profession Filter - Horizontal scroll */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.filterScroll}
        >
          {PROFESSIONS.map(prof => (
            <TouchableOpacity
              key={prof.id}
              style={[
                styles.filterChip,
                selectedProfession === prof.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedProfession(prof.id)}
            >
              <Ionicons
                name={prof.icon as any}
                size={16}
                color={selectedProfession === prof.id ? '#fff' : '#a1a1aa'}
              />
              <Text
                style={[
                  styles.filterChipText,
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
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#71717a" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search characters..."
          placeholderTextColor="#71717a"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#71717a" />
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
              padding: 12,
            }}
          >
            {filtered.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color="#3f3f46" />
                <Text style={styles.emptyText}>No characters found</Text>
              </View>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  justifyContent: 'flex-start',
                }}
              >
                {filtered.map(char => renderCard(char))}
              </div>
            )}
          </div>
        ) : (
          <ScrollView style={styles.listContainer} contentContainerStyle={styles.mosaicGrid}>
            {filtered.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color="#3f3f46" />
                <Text style={styles.emptyText}>No characters found</Text>
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
  loadingText: {
    color: '#71717a',
    marginTop: 12,
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelText: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startBtnDisabled: {
    backgroundColor: '#3f3f46',
  },
  startText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectedName: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '500',
  },
  filterContainer: {
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#27272a',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#8b5cf6',
  },
  filterChipText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#18181b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
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
    padding: 12,
    gap: 12,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#52525b',
    marginTop: 12,
    fontSize: 14,
  },
  // Mosaic card styles
  mosaicCard: {
    width: 140,
    padding: 16,
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mosaicAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mosaicAvatarText: {
    fontSize: 26,
    fontWeight: '700',
  },
  mosaicName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  mosaicRole: {
    fontSize: 11,
    color: '#8b5cf6',
    textAlign: 'center',
  },
});
