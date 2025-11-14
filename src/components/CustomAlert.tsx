import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  // Default buttons if none provided
  const defaultButtons: AlertButton[] = [{ text: 'OK', onPress: onClose }];
  const displayButtons = buttons || defaultButtons;

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
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
        <View style={styles.container}>
          <TouchableOpacity activeOpacity={1} style={styles.alertBox}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={buttons?.some(b => b.style === 'destructive') ? 'warning' : 'information-circle'}
                  size={24}
                  color={buttons?.some(b => b.style === 'destructive') ? '#ef4444' : '#8b5cf6'}
                />
              </View>
              <Text style={styles.title}>{title}</Text>
            </View>

            <Text style={styles.message}>{message}</Text>

            <View style={styles.buttonContainer}>
              {displayButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'cancel' && styles.buttonCancel,
                    button.style === 'destructive' && styles.buttonDestructive,
                    displayButtons.length === 1 && styles.buttonSingle,
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text
                    style={[
                      styles.buttonText,
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
  container: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
  },
  alertBox: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  message: {
    fontSize: 14,
    color: '#a1a1aa',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#8b5cf6',
    minWidth: 80,
    alignItems: 'center',
  },
  buttonSingle: {
    flex: 1,
  },
  buttonCancel: {
    backgroundColor: '#27272a',
  },
  buttonDestructive: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextCancel: {
    color: '#a1a1aa',
  },
  buttonTextDestructive: {
    color: 'white',
  },
});
