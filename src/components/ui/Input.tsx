import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  const isSecure = showPasswordToggle ? !showPassword : secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
        {icon && iconPosition === 'left' && (
          <Ionicons name={icon} size={20} color="#71717a" style={styles.iconLeft} />
        )}

        <TextInput
          {...props}
          secureTextEntry={isSecure}
          style={[
            styles.input,
            icon && iconPosition === 'left' && styles.inputWithLeftIcon,
            (icon && iconPosition === 'right' || showPasswordToggle) && styles.inputWithRightIcon,
            props.style,
          ]}
          placeholderTextColor="#71717a"
        />

        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.iconRight}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#71717a"
            />
          </TouchableOpacity>
        )}

        {icon && iconPosition === 'right' && !showPasswordToggle && (
          <Ionicons name={icon} size={20} color="#71717a" style={styles.iconRight} />
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    paddingVertical: 12,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  iconLeft: {
    marginRight: 4,
  },
  iconRight: {
    marginLeft: 4,
  },
  error: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 4,
  },
});
