/**
 * Test screen for viewing the Freud & Jung 3D models
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import FreudJung3D from '../components/FreudJung3D';

export default function Model3DTestScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>3D Models - Freud & Jung</Text>
        <Text style={styles.subtitle}>
          Interact with the models: drag to rotate, scroll to zoom, right-click to pan
        </Text>
      </View>

      <View style={styles.modelContainer}>
        <FreudJung3D />
      </View>

      <View style={styles.info}>
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Left: Sigmund Freud</Text>
          <Text style={styles.infoText}>• Dark brown suit</Text>
          <Text style={styles.infoText}>• White hair and beard</Text>
          <Text style={styles.infoText}>• Round metal glasses</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Right: Carl Jung</Text>
          <Text style={styles.infoText}>• Grey suit</Text>
          <Text style={styles.infoText}>• Brown hair</Text>
          <Text style={styles.infoText}>• No glasses</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modelContainer: {
    height: 400,
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    gap: 20,
  },
  infoSection: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 5,
  },
});
