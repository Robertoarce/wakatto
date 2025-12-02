import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ColorPickerProps {
  label: string;
  selectedColor: string;
  onColorSelect: (color: string) => void;
  colors: string[];
}

export function ColorPicker({ label, selectedColor, onColorSelect, colors }: ColorPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.colorGrid}>
        {colors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorSwatch,
              { backgroundColor: color },
              selectedColor === color && styles.colorSwatchSelected,
            ]}
            onPress={() => onColorSelect(color)}
          >
            {selectedColor === color && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderColor: '#8b5cf6',
    borderWidth: 3,
  },
  checkmark: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
  },
  checkmarkText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
