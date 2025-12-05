/**
 * Test screen for viewing the Freud & Jung 3D models
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import FreudJung3D from '../components/FreudJung3D';

export default function Model3DTestScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>3D Models - Freud, Adler & Jung</Text>
        <Text style={styles.subtitle}>
          Drag to rotate • Scroll to zoom • Right-click to pan
        </Text>
      </View>

      <View style={styles.modelContainer}>
        <FreudJung3D />
      </View>

      <View style={styles.info}>
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Freud</Text>
          <Text style={styles.infoText}>Brown suit, white beard, glasses</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Adler</Text>
          <Text style={styles.infoText}>Blue suit, mustache, balding</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Jung</Text>
          <Text style={styles.infoText}>Grey suit, blonde hair</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  modelContainer: {
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#e8d4b8',
    minHeight: 400,
  },
  info: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 20,
    gap: 10,
  },
  infoSection: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#aaaaaa',
  },
});
