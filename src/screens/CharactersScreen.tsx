import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface Entity {
  id: string;
  name: string;
  type: 'person' | 'place' | 'organization';
  mention_count: number;
  first_mentioned: string;
  last_mentioned: string;
}

interface EntityMention {
  id: string;
  message_content: string;
  conversation_title: string;
  created_at: string;
}

export default function CharactersScreen() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [mentions, setMentions] = useState<EntityMention[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'person' | 'place' | 'organization'>('all');
  
  const { user } = useSelector((state: RootState) => state.auth);

  const loadEntities = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Query entities with their mention counts
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('user_id', user.id)
        .order('mention_count', { ascending: false });

      if (error) throw error;
      
      setEntities(data || []);
    } catch (error) {
      console.error('Error loading entities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMentions = async (entityId: string) => {
    if (!user) return;
    
    try {
      // Get all mentions of this entity from relationships
      const { data: relationships, error: relError } = await supabase
        .from('relationships')
        .select('message_id')
        .eq('entity_id', entityId);

      if (relError) throw relError;

      if (!relationships || relationships.length === 0) {
        setMentions([]);
        return;
      }

      const messageIds = relationships.map(r => r.message_id);

      // Get the actual messages with conversation info
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          conversation_id,
          conversations (
            title
          )
        `)
        .in('id', messageIds)
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      const formattedMentions = messages?.map(msg => ({
        id: msg.id,
        message_content: msg.content,
        conversation_title: (msg.conversations as any)?.title || 'Unknown',
        created_at: msg.created_at,
      })) || [];

      setMentions(formattedMentions);
    } catch (error) {
      console.error('Error loading mentions:', error);
    }
  };

  const handleEntityPress = (entity: Entity) => {
    setSelectedEntity(entity);
    loadMentions(entity.id);
  };

  const handleBackToList = () => {
    setSelectedEntity(null);
    setMentions([]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEntities();
  };

  useEffect(() => {
    loadEntities();
  }, [user]);

  const filteredEntities = filterType === 'all' 
    ? entities 
    : entities.filter(e => e.type === filterType);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'person': return 'person';
      case 'place': return 'location';
      case 'organization': return 'business';
      default: return 'help-circle';
    }
  };

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'person': return '#8b5cf6';
      case 'place': return '#06b6d4';
      case 'organization': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading characters...</Text>
      </View>
    );
  }

  // Detail view for selected entity
  if (selectedEntity) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={[styles.entityIconLarge, { backgroundColor: getEntityColor(selectedEntity.type) }]}>
              <Ionicons name={getEntityIcon(selectedEntity.type) as any} size={32} color="white" />
            </View>
            <View>
              <Text style={styles.entityNameLarge}>{selectedEntity.name}</Text>
              <Text style={styles.entityTypeLarge}>{selectedEntity.type}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{selectedEntity.mention_count}</Text>
            <Text style={styles.statLabel}>Mentions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatDate(selectedEntity.first_mentioned)}</Text>
            <Text style={styles.statLabel}>First Seen</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatDate(selectedEntity.last_mentioned)}</Text>
            <Text style={styles.statLabel}>Last Seen</Text>
          </View>
        </View>

        <Text style={styles.mentionsTitle}>All Mentions</Text>
        <ScrollView style={styles.mentionsList}>
          {mentions.map((mention) => (
            <View key={mention.id} style={styles.mentionCard}>
              <View style={styles.mentionHeader}>
                <Text style={styles.conversationTitle}>{mention.conversation_title}</Text>
                <Text style={styles.mentionDate}>{formatDate(mention.created_at)}</Text>
              </View>
              <Text style={styles.mentionContent} numberOfLines={3}>
                {mention.message_content}
              </Text>
            </View>
          ))}
          {mentions.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#52525b" />
              <Text style={styles.emptyText}>No mentions found</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // List view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Characters</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#a1a1aa" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'person', 'place', 'organization'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setFilterType(type)}
            style={[
              styles.filterButton,
              filterType === type && styles.filterButtonActive,
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === type && styles.filterButtonTextActive,
            ]}>
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
      >
        {filteredEntities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#52525b" />
            <Text style={styles.emptyText}>No characters found</Text>
            <Text style={styles.emptySubtext}>
              Characters are automatically extracted from your diary entries
            </Text>
          </View>
        ) : (
          filteredEntities.map((entity) => (
            <TouchableOpacity
              key={entity.id}
              onPress={() => handleEntityPress(entity)}
              style={styles.entityCard}
            >
              <View style={[styles.entityIcon, { backgroundColor: getEntityColor(entity.type) }]}>
                <Ionicons name={getEntityIcon(entity.type) as any} size={24} color="white" />
              </View>
              <View style={styles.entityInfo}>
                <Text style={styles.entityName}>{entity.name}</Text>
                <Text style={styles.entityMeta}>
                  {entity.mention_count} {entity.mention_count === 1 ? 'mention' : 'mentions'} • {entity.type}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#71717a" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  backButton: {
    marginRight: 16,
  },
  entityIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityNameLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  entityTypeLarge: {
    fontSize: 14,
    color: '#a1a1aa',
    textTransform: 'capitalize',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#18181b',
  },
  filterButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  filterButtonText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  list: {
    flex: 1,
  },
  entityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#18181b',
    borderRadius: 12,
    gap: 12,
  },
  entityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityInfo: {
    flex: 1,
  },
  entityName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  entityMeta: {
    fontSize: 12,
    color: '#71717a',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#a1a1aa',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#71717a',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#18181b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#71717a',
  },
  mentionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  mentionsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mentionCard: {
    backgroundColor: '#18181b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  mentionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  mentionDate: {
    fontSize: 12,
    color: '#71717a',
  },
  mentionContent: {
    fontSize: 14,
    color: '#d4d4d8',
    lineHeight: 20,
  },
});

