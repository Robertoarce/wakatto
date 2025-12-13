import { Platform, ViewStyle } from 'react-native';

interface ShadowConfig {
  color?: string;
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
  radius?: number;
  elevation?: number; // Android-specific
}

/**
 * Creates cross-platform shadow styles.
 * - On iOS: Uses native shadow* props
 * - On Android: Uses elevation
 * - On Web: Uses boxShadow (avoiding deprecated shadow* props)
 */
export function createShadow({
  color = '#000',
  offsetX = 0,
  offsetY = 2,
  opacity = 0.25,
  radius = 4,
  elevation = 4,
}: ShadowConfig = {}): ViewStyle {
  if (Platform.OS === 'web') {
    // Convert color and opacity to rgba for web
    const hexToRgba = (hex: string, alpha: number): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      // Handle named colors or other formats
      return hex;
    };
    
    const shadowColor = hexToRgba(color, opacity);
    return {
      // @ts-ignore - boxShadow is valid for web
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${shadowColor}`,
    };
  }
  
  if (Platform.OS === 'android') {
    return {
      elevation,
    };
  }
  
  // iOS
  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
  };
}

/**
 * Common shadow presets for consistent usage across the app
 */
export const shadows = {
  sm: createShadow({ offsetY: 1, opacity: 0.1, radius: 2, elevation: 2 }),
  md: createShadow({ offsetY: 2, opacity: 0.15, radius: 4, elevation: 4 }),
  lg: createShadow({ offsetY: 4, opacity: 0.2, radius: 8, elevation: 8 }),
  xl: createShadow({ offsetY: 8, opacity: 0.25, radius: 16, elevation: 12 }),
  
  // For colored shadows (e.g., glow effects)
  glow: (color: string) => createShadow({ color, offsetY: 4, opacity: 0.3, radius: 8, elevation: 6 }),
  
  // Menu/dropdown shadow
  dropdown: createShadow({ offsetY: 4, opacity: 0.3, radius: 8, elevation: 10 }),
  
  // Modal shadow
  modal: createShadow({ offsetY: 8, opacity: 0.5, radius: 24, elevation: 16 }),
  
  // Card shadow
  card: createShadow({ offsetY: 2, opacity: 0.1, radius: 4, elevation: 4 }),
  cardHover: createShadow({ offsetY: 8, opacity: 0.3, radius: 16, elevation: 8 }),
};

