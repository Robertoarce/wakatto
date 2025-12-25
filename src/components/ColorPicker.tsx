import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useResponsive } from '../constants/Layout';

interface ColorPickerProps {
  label: string;
  selectedColor: string;
  onColorSelect: (color: string) => void;
  colors: string[];
}

export function ColorPicker({ label, selectedColor, onColorSelect, colors }: ColorPickerProps) {
  const { fonts, spacing, borderRadius, scalePx } = useResponsive();

  const dynamicStyles = useMemo(() => ({
    container: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: fonts.sm,
      marginBottom: spacing.sm,
    },
    colorGrid: {
      gap: spacing.sm,
    },
    colorSwatch: {
      width: scalePx(44),
      height: scalePx(44),
      borderRadius: borderRadius.sm,
    },
    checkmark: {
      borderRadius: borderRadius.xs,
    },
    checkmarkText: {
      fontSize: scalePx(20),
    },
  }), [fonts, spacing, borderRadius, scalePx]);

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.label, dynamicStyles.label]}>{label}</Text>
      <View style={[styles.colorGrid, dynamicStyles.colorGrid]}>
        {colors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorSwatch,
              dynamicStyles.colorSwatch,
              { backgroundColor: color },
              selectedColor === color && styles.colorSwatchSelected,
            ]}
            onPress={() => onColorSelect(color)}
          >
            {selectedColor === color && (
              <View style={[styles.checkmark, dynamicStyles.checkmark]}>
                <Text style={[styles.checkmarkText, dynamicStyles.checkmarkText]}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  label: {
    color: '#d1d5db',
    fontWeight: '500',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorSwatch: {
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
  },
  checkmarkText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
