import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/actions/authActions';
import { useCustomAlert } from './CustomAlert';
import { useResponsive } from '../constants/Layout';

export function Header() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isMobile, isTablet, fonts, spacing, layout } = useResponsive();

  const handleLogout = () => {
    showAlert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logout() as any);
            navigation.navigate('Login' as never);
          },
        },
      ]
    );
  };

  // Responsive sizes
  const logoSize = isMobile ? 28 : 32;
  const titleSize = isMobile ? fonts.lg : fonts.xl;
  const iconSize = isMobile ? 18 : 20;

  return (
    <>
      <AlertComponent />
      <View style={[
        styles.header,
        {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          minHeight: layout.headerHeight,
        }
      ]}>
        <View style={[styles.leftContainer, { gap: spacing.sm }]}>
          <View style={[
            styles.logoContainer,
            {
              width: logoSize,
              height: logoSize,
              borderRadius: isMobile ? 6 : 8,
            }
          ]}>
            <Image
              source={require('../assets/images/logo.svg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { fontSize: titleSize }]}>Wakatto</Text>
        </View>

        <View style={[styles.rightContainer, { gap: spacing.md }]}>
          {user && (
            <>
              {/* Hide email on mobile, show on tablet+ */}
              {!isMobile && (
                <View style={[
                  styles.userInfo,
                  {
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    maxWidth: isTablet ? 150 : 200,
                  }
                ]}>
                  <Text 
                    style={[styles.userEmail, { fontSize: fonts.sm }]} 
                    numberOfLines={1}
                  >
                    {user.email}
                  </Text>
                </View>
              )}
              <TouchableOpacity 
                onPress={handleLogout} 
                style={[
                  styles.logoutButton,
                  {
                    paddingHorizontal: isMobile ? spacing.sm : spacing.md,
                    paddingVertical: spacing.sm,
                    minWidth: layout.minTouchTarget,
                    minHeight: layout.minTouchTarget,
                  }
                ]}
              >
                <Ionicons name="log-out-outline" size={iconSize} color="#ef4444" />
                {/* Show text only on desktop */}
                {!isMobile && !isTablet && (
                  <Text style={[styles.logoutButtonText, { fontSize: fonts.sm }]}>
                    Logout
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: '#0f0f0f',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: 'white',
    fontWeight: '600',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    backgroundColor: '#27272a',
    borderRadius: 6,
  },
  userEmail: {
    color: '#a1a1aa',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: 'transparent',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontWeight: '600',
  },
});
