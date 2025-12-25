import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useResponsive } from '../constants/Layout';

interface TraitSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function TraitSlider({ label, value, onChange, min = 1, max = 10 }: TraitSliderProps) {
  const { fonts, spacing, scalePx } = useResponsive();

  const dynamicStyles = useMemo(() => ({
    container: {
      marginBottom: spacing.xl,
    },
    labelRow: {
      marginBottom: spacing.sm,
    },
    label: {
      fontSize: fonts.sm,
    },
    value: {
      fontSize: fonts.lg,
    },
    slider: {
      height: scalePx(40),
    },
    labelsRow: {
      paddingHorizontal: spacing.xs,
    },
    minLabel: {
      fontSize: fonts.xs,
    },
    maxLabel: {
      fontSize: fonts.xs,
    },
  }), [fonts, spacing, scalePx]);

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.labelRow, dynamicStyles.labelRow]}>
        <Text style={[styles.label, dynamicStyles.label]}>{label}</Text>
        <Text style={[styles.value, dynamicStyles.value]}>{value}</Text>
      </View>
      <Slider
        style={[styles.slider, dynamicStyles.slider]}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#8b5cf6"
        maximumTrackTintColor="#3a3a3a"
        thumbTintColor="#8b5cf6"
      />
      <View style={[styles.labelsRow, dynamicStyles.labelsRow]}>
        <Text style={[styles.minLabel, dynamicStyles.minLabel]}>{min}</Text>
        <Text style={[styles.maxLabel, dynamicStyles.maxLabel]}>{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#d1d5db',
    fontWeight: '500',
  },
  value: {
    color: '#8b5cf6',
    fontWeight: '700',
  },
  slider: {
    width: '100%',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  minLabel: {
    color: '#71717a',
  },
  maxLabel: {
    color: '#71717a',
  },
});
