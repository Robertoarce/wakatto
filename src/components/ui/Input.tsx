import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../constants/Layout';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  containerStyle?: ViewStyle;
  showPasswordToggle?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  containerStyle,
  showPasswordToggle = false,
  secureTextEntry,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { fonts, spacing, layout, isMobile } = useResponsive();

  const isSecure = showPasswordToggle ? !showPassword : secureTextEntry;

  return (
    <View style={[styles.container, { marginBottom: spacing.lg }, containerStyle]}>
      {label && (
        <Text style={[styles.label, { fontSize: fonts.sm, marginBottom: spacing.sm }]}>
          {label}
        </Text>
      )}

      <View style={[
        styles.inputWrapper, 
        { 
          paddingHorizontal: spacing.md, 
          minHeight: layout.inputMinHeight,
        },
        error ? styles.inputWrapperError : null
      ]}>
        {icon && iconPosition === 'left' && (
          <Ionicons 
            name={icon} 
            size={isMobile ? 18 : 20} 
            color="#71717a" 
            style={{ marginRight: spacing.xs }} 
          />
        )}

        <TextInput
          {...props}
          secureTextEntry={isSecure}
          style={[
            styles.input,
            { 
              fontSize: fonts.md,
              paddingVertical: spacing.md,
            },
            icon && iconPosition === 'left' && { paddingLeft: spacing.sm },
            (icon && iconPosition === 'right' || showPasswordToggle) && { paddingRight: spacing.sm },
            props.style,
          ]}
          placeholderTextColor="#71717a"
        />

        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={[
              styles.iconRight, 
              { 
                minWidth: layout.minTouchTarget,
                minHeight: layout.minTouchTarget,
                alignItems: 'center',
                justifyContent: 'center',
              }
            ]}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={isMobile ? 18 : 20}
              color="#71717a"
            />
          </TouchableOpacity>
        )}

        {icon && iconPosition === 'right' && !showPasswordToggle && (
          <Ionicons 
            name={icon} 
            size={isMobile ? 18 : 20} 
            color="#71717a" 
            style={{ marginLeft: spacing.xs }} 
          />
        )}
      </View>

      {error && (
        <Text style={[styles.error, { fontSize: fonts.xs, marginTop: spacing.xs }]}>
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text style={[styles.helperText, { fontSize: fonts.xs, marginTop: spacing.xs }]}>
          {helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  label: {
    fontWeight: '600',
    color: '#d1d5db',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  input: {
    flex: 1,
    color: '#ffffff',
  },
  iconRight: {
  },
  error: {
    color: '#ef4444',
  },
  helperText: {
    color: '#71717a',
  },
});
