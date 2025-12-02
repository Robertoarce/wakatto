import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface TraitSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function TraitSlider({ label, value, onChange, min = 1, max = 10 }: TraitSliderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#8b5cf6"
        maximumTrackTintColor="#3a3a3a"
        thumbTintColor="#8b5cf6"
      />
      <View style={styles.labelsRow}>
        <Text style={styles.minLabel}>{min}</Text>
        <Text style={styles.maxLabel}>{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  minLabel: {
    color: '#71717a',
    fontSize: 12,
  },
  maxLabel: {
    color: '#71717a',
    fontSize: 12,
  },
});
