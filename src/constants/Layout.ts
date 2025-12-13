import { Dimensions, ScaledSize } from 'react-native';
import { useState, useEffect, useMemo } from 'react';

// Get initial dimensions
const { width: initialWidth, height: initialHeight } = Dimensions.get('window');

// ============================================
// BREAKPOINTS
// ============================================
export const BREAKPOINTS = {
  mobile: 480,    // < 480px
  tablet: 768,    // 480px - 768px
  desktop: 1024,  // 768px - 1024px
  large: 1200,    // > 1024px
} as const;

// ============================================
// DEVICE TYPE DETECTION
// ============================================
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'large';

export function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  if (width < BREAKPOINTS.desktop) return 'desktop';
  return 'large';
}

// ============================================
// RESPONSIVE FONT SIZES
// ============================================
export interface ResponsiveFonts {
  xs: number;   // 10-12px (badges, timestamps, captions)
  sm: number;   // 12-14px (secondary text, labels)
  md: number;   // 14-16px (body text, inputs)
  lg: number;   // 16-20px (character names, emphasis)
  xl: number;   // 18-24px (subheadings)
  xxl: number;  // 24-32px (headings)
  xxxl: number; // 28-40px (large titles)
}

export function calculateFonts(width: number): ResponsiveFonts {
  // Scale factor based on screen width
  // Mobile (<480): 0.85, Tablet (480-768): 0.92, Desktop (768-1024): 1.0, Large (>1024): 1.1
  const scale = width < BREAKPOINTS.mobile ? 0.85 
    : width < BREAKPOINTS.tablet ? 0.92 
    : width < BREAKPOINTS.desktop ? 1.0 
    : 1.1;
  
  return {
    xs: Math.round(11 * scale),     // 9-11px
    sm: Math.round(12 * scale),     // 10-13px
    md: Math.round(14 * scale),     // 12-15px
    lg: Math.round(16 * scale),     // 14-18px
    xl: Math.round(20 * scale),     // 17-22px
    xxl: Math.round(24 * scale),    // 20-26px
    xxxl: Math.round(32 * scale),   // 27-35px
  };
}

// ============================================
// RESPONSIVE SPACING
// ============================================
export interface ResponsiveSpacing {
  xs: number;   // 4px base
  sm: number;   // 8px base
  md: number;   // 12px base
  lg: number;   // 16px base
  xl: number;   // 24px base
  xxl: number;  // 32px base
  xxxl: number; // 48px base
}

export function calculateSpacing(width: number): ResponsiveSpacing {
  // Spacing scale: smaller on mobile, larger on desktop
  const scale = width < BREAKPOINTS.mobile ? 0.85 
    : width < BREAKPOINTS.tablet ? 0.92 
    : width < BREAKPOINTS.desktop ? 1.0 
    : 1.1;
  
  return {
    xs: Math.round(4 * scale),
    sm: Math.round(8 * scale),
    md: Math.round(12 * scale),
    lg: Math.round(16 * scale),
    xl: Math.round(24 * scale),
    xxl: Math.round(32 * scale),
    xxxl: Math.round(48 * scale),
  };
}

// ============================================
// RESPONSIVE LAYOUT VALUES
// ============================================
export interface ResponsiveLayout {
  // Touch targets (minimum 44px on mobile for accessibility)
  minTouchTarget: number;
  
  // Card widths
  cardWidth: number | string;
  cardMaxWidth: number;
  
  // Modal sizing
  modalWidth: string;
  modalHeight: string;
  modalMaxWidth: number;
  modalBorderRadius: number;
  
  // Input sizing
  inputMinHeight: number;
  inputPadding: number;
  
  // Header sizing
  headerPadding: number;
  headerHeight: number;
  
  // Sidebar
  sidebarWidth: number;
  sidebarCollapsedWidth: number;
  
  // Grid columns
  gridColumns: number;
  gridGap: number;
}

export function calculateLayout(width: number): ResponsiveLayout {
  const isMobile = width < BREAKPOINTS.mobile;
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.tablet;
  
  return {
    // Touch targets - always at least 44px on touch devices
    minTouchTarget: isMobile ? 44 : 40,
    
    // Card widths - full width on mobile, fixed on larger screens
    cardWidth: isMobile ? '100%' : isTablet ? '48%' : 200,
    cardMaxWidth: isMobile ? 9999 : isTablet ? 300 : 220,
    
    // Modal sizing - full screen on mobile
    modalWidth: isMobile ? '100%' : isTablet ? '90%' : '66.67%',
    modalHeight: isMobile ? '100%' : isTablet ? '90%' : '66.67%',
    modalMaxWidth: isMobile ? 9999 : isTablet ? 600 : 800,
    modalBorderRadius: isMobile ? 0 : 20,
    
    // Input sizing
    inputMinHeight: isMobile ? 48 : 44,
    inputPadding: isMobile ? 14 : 12,
    
    // Header sizing
    headerPadding: isMobile ? 12 : 16,
    headerHeight: isMobile ? 56 : 64,
    
    // Sidebar
    sidebarWidth: isMobile ? width : 224,
    sidebarCollapsedWidth: 56,
    
    // Grid
    gridColumns: isMobile ? 1 : isTablet ? 2 : 3,
    gridGap: isMobile ? 12 : 16,
  };
}

// ============================================
// ORIENTATION DETECTION
// ============================================
export type Orientation = 'portrait' | 'landscape';

export function getOrientation(width: number, height: number): Orientation {
  return width > height ? 'landscape' : 'portrait';
}

/**
 * Detect if device is in mobile landscape mode
 * This is when the device is rotated landscape but has mobile-like constraints
 * We check: landscape orientation + height < tablet breakpoint (limited vertical space)
 */
export function isMobileLandscapeMode(width: number, height: number): boolean {
  const isLandscape = width > height;
  // In landscape, height becomes the limiting factor
  // If height is less than tablet breakpoint, treat as mobile landscape
  return isLandscape && height < BREAKPOINTS.tablet;
}

// ============================================
// RESPONSIVE HOOK
// ============================================
export interface ResponsiveValues {
  width: number;
  height: number;
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isMobileLandscape: boolean;
  orientation: Orientation;
  fonts: ResponsiveFonts;
  spacing: ResponsiveSpacing;
  layout: ResponsiveLayout;
}

export function useResponsive(): ResponsiveValues {
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight,
  });

  useEffect(() => {
    const handleChange = ({ window }: { window: ScaledSize }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    };

    const subscription = Dimensions.addEventListener('change', handleChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  return useMemo(() => {
    const { width, height } = dimensions;
    const deviceType = getDeviceType(width);
    const orientation = getOrientation(width, height);
    const isLandscape = orientation === 'landscape';
    const mobileLandscape = isMobileLandscapeMode(width, height);
    
    return {
      width,
      height,
      deviceType,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop' || deviceType === 'large',
      isLandscape,
      isMobileLandscape: mobileLandscape,
      orientation,
      fonts: calculateFonts(width),
      spacing: calculateSpacing(width),
      layout: calculateLayout(width),
    };
  }, [dimensions]);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Returns different values based on device type
 */
export function responsive<T>(
  mobile: T,
  tablet: T,
  desktop: T,
  deviceType: DeviceType
): T {
  switch (deviceType) {
    case 'mobile':
      return mobile;
    case 'tablet':
      return tablet;
    case 'desktop':
    case 'large':
      return desktop;
    default:
      return desktop;
  }
}

/**
 * Calculate width as percentage of screen
 */
export function widthPercent(percent: number, screenWidth: number): number {
  return Math.round((percent / 100) * screenWidth);
}

/**
 * Calculate height as percentage of screen
 */
export function heightPercent(percent: number, screenHeight: number): number {
  return Math.round((percent / 100) * screenHeight);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get responsive value based on width breakpoints
 */
export function getResponsiveValue<T>(
  width: number,
  values: { mobile?: T; tablet?: T; desktop?: T; default: T }
): T {
  if (width < BREAKPOINTS.mobile && values.mobile !== undefined) {
    return values.mobile;
  }
  if (width < BREAKPOINTS.tablet && values.tablet !== undefined) {
    return values.tablet;
  }
  if (values.desktop !== undefined) {
    return values.desktop;
  }
  return values.default;
}

// ============================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================
const Layout = {
  window: {
    width: initialWidth,
    height: initialHeight,
  },
  isSmallDevice: initialWidth < 375,
};

export default Layout;
