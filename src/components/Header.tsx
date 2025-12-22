import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/actions/authActions';
import { toggleSidebar } from '../store/actions/uiActions';
import { useCustomAlert } from './CustomAlert';
import { useResponsive } from '../constants/Layout';

export function Header() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { user } = useSelector((state: RootState) => state.auth);
  const { showSidebar } = useSelector((state: RootState) => state.ui);
  const { isMobile, isTablet, fonts, spacing, layout } = useResponsive();

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

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
  const logoSize = isMobile ? 36 : 40;
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
        {/* Left: Hamburger menu (only show when sidebar is closed) */}
        <View style={[styles.leftContainer, { minWidth: 60 }]}>
          {!showSidebar && (
            <TouchableOpacity
              onPress={handleToggleSidebar}
              style={[
                styles.hamburgerButton,
                {
                  minWidth: layout.minTouchTarget,
                  minHeight: layout.minTouchTarget,
                }
              ]}
              accessibilityLabel="Open sidebar"
            >
              <Ionicons name="time-outline" size={isMobile ? 22 : 24} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Center: Logo + Wakatto */}
        <View style={[styles.centerContainer, { gap: spacing.sm }]}>
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
              style={{ width: logoSize, height: logoSize, borderRadius: 6 }}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { fontSize: titleSize }]}>Wakatto</Text>
        </View>

        {/* Right: User info + logout */}
        <View style={[styles.rightContainer, { gap: spacing.md, minWidth: 60 }]}>
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
    justifyContent: 'flex-start',
    zIndex: 1,
  },
  centerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    pointerEvents: 'none',
  },
  hamburgerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#f92a82',
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  title: {
    color: 'white',
    fontWeight: '600',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1,
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
