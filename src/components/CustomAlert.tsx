import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../constants/Layout';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onClose: () => void;
}

export function CustomAlert({ visible, title, message, buttons, onClose }: CustomAlertProps) {
  const { fonts, spacing, borderRadius, scalePx, components } = useResponsive();

  // Default buttons if none provided
  const defaultButtons: AlertButton[] = [{ text: 'OK', onPress: onClose }];
  const displayButtons = buttons || defaultButtons;

  const dynamicStyles = useMemo(() => ({
    container: {
      width: '85%' as const,
      maxWidth: '20%' as const,
    },
    alertBox: {
      borderRadius: borderRadius.md,
      padding: spacing.xl,
    },
    header: {
      marginBottom: spacing.xs, 
      gap: spacing.sm,
    },
    iconContainer: {
      width: scalePx(10),
      height: scalePx(10),
      borderRadius: scalePx(14),
    },
    iconSize: components.iconSizes.lg,
    title: {
      fontSize: fonts.xl,
    },
    message: {
      fontSize: fonts.md,
      lineHeight: fonts.md * 1.3,
      marginTop: spacing.sm,
      marginBottom: spacing.xl,
    },
    buttonContainer: {
      gap: spacing.sm,
    },
    button: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.sm,
    },
    buttonText: {
      fontSize: fonts.sm,
    },
  }), [fonts, spacing, borderRadius, scalePx, components]);

  const handleButtonPress = async (button: AlertButton) => {
    // Close the modal first to provide immediate feedback
    onClose();
    
    // Then execute the callback (allow async callbacks to complete)
    if (button.onPress) {
      try {
        await button.onPress();
      } catch (error) {
        console.error('[CustomAlert] Button onPress error:', error);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.container, dynamicStyles.container]}>
          <TouchableOpacity activeOpacity={1} style={[styles.alertBox, dynamicStyles.alertBox]}>
            <View style={[styles.header, dynamicStyles.header]}>
              <View style={[styles.iconContainer, dynamicStyles.iconContainer]}>
                <Ionicons
                  name={buttons?.some(b => b.style === 'destructive') ? 'warning' : 'information-circle'}
                  size={dynamicStyles.iconSize}
                  color={buttons?.some(b => b.style === 'destructive') ? '#ef4444' : '#8b5cf6'}
                />
              </View>
              <Text style={[styles.title, dynamicStyles.title]}>{title}</Text>
            </View>

            <Text style={[styles.message, dynamicStyles.message]}>{message}</Text>

            <View style={[styles.buttonContainer, dynamicStyles.buttonContainer]}>
              {displayButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    dynamicStyles.button,
                    button.style === 'cancel' && styles.buttonCancel,
                    button.style === 'destructive' && styles.buttonDestructive,
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      dynamicStyles.buttonText,
                      button.style === 'cancel' && styles.buttonTextCancel,
                      button.style === 'destructive' && styles.buttonTextDestructive,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// Hook to manage alert state
interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
}

export function useCustomAlert() {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: undefined,
  });

  const showAlert = (title: string, message: string, buttons?: AlertButton[]) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons,
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const AlertComponent = () => (
    <CustomAlert
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      buttons={alertState.buttons}
      onClose={hideAlert}
    />
  );

  return { showAlert, hideAlert, AlertComponent };
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {},
  alertBox: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#27272a',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontWeight: 'bold',
    color: 'white',
  },
  message: {
    color: '#a1a1aa',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#27272a',
  },
  buttonDestructive: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  buttonTextCancel: {
    color: '#a1a1aa',
  },
  buttonTextDestructive: {
    color: 'white',
  },
});
