/**
 * Liquid Glass Design System for iOS
 * Inspired by Apple's latest design language with glassmorphism, blur, and depth
 */

import { Platform } from 'react-native';

// ============================================
// COLOR TOKENS - Liquid Glass Palette
// ============================================
export const colors = {
  // Brand Colors
  brand: {
    primary: '#0c4a6e',      // Deep ocean blue
    secondary: '#06b6d4',    // Cyan accent
    accent: '#f59e0b',       // Warm amber
    success: '#10b981',      // Emerald
    warning: '#f59e0b',
    error: '#ef4444',        // Red
  },

  // Semantic Colors - Light Mode
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceVariant: '#f1f5f9',
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#94a3b8',
      inverse: '#ffffff',
    },
    border: {
      subtle: 'rgba(0, 0, 0, 0.06)',
      default: 'rgba(0, 0, 0, 0.1)',
      strong: 'rgba(0, 0, 0, 0.15)',
    },
    overlay: {
      subtle: 'rgba(0, 0, 0, 0.2)',
      default: 'rgba(0, 0, 0, 0.4)',
      strong: 'rgba(0, 0, 0, 0.6)',
    },
    glass: {
      surface: 'rgba(255, 255, 255, 0.72)',
      card: 'rgba(255, 255, 255, 0.85)',
      navigation: 'rgba(255, 255, 255, 0.8)',
      modal: 'rgba(255, 255, 255, 0.92)',
    },
    scrim: 'rgba(0, 0, 0, 0.35)',
  },

  // Semantic Colors - Dark Mode
  dark: {
    background: '#0c0a09',
    surface: '#1c1917',
    surfaceVariant: '#292524',
    text: {
      primary: '#fafaf9',
      secondary: '#a8a29e',
      tertiary: '#78716c',
      inverse: '#0c0a09',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      default: 'rgba(255, 255, 255, 0.1)',
      strong: 'rgba(255, 255, 255, 0.15)',
    },
    overlay: {
      subtle: 'rgba(255, 255, 255, 0.05)',
      default: 'rgba(255, 255, 255, 0.1)',
      strong: 'rgba(255, 255, 255, 0.15)',
    },
    glass: {
      surface: 'rgba(28, 25, 23, 0.72)',
      card: 'rgba(28, 25, 23, 0.85)',
      navigation: 'rgba(28, 25, 23, 0.8)',
      modal: 'rgba(28, 25, 23, 0.92)',
    },
    scrim: 'rgba(0, 0, 0, 0.6)',
  },

  // Gradients
  gradients: {
    primary: ['#0c4a6e', '#0369a1'] as const,
    accent: ['#06b6d4', '#0891b2'] as const,
    warm: ['#f59e0b', '#d97706'] as const,
    glass: [
      'rgba(255, 255, 255, 0.1)',
      'rgba(255, 255, 255, 0.05)',
    ] as const,
    aurora: [
      'rgba(6, 182, 212, 0.3)',
      'rgba(139, 92, 246, 0.2)',
      'rgba(236, 72, 153, 0.1)',
    ] as const,
  },

  // Legacy compatibility
  deepNavy: '#0c0a09',
  tealAccent: '#14b8a6',
  warmSlate: '#57534e',
  onSurface: '#1c1917',
  borderLight: '#e7e5e4',
  outline: '#78716c',
  background: '#fafaf9',
  surfaceLowest: '#ffffff',
  surfaceLow: '#f5f5f4',
  primaryContainer: '#131b2e',
  onPrimaryContainer: '#7c839b',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  white: '#ffffff',
  primaryFixedDim: '#bec6e0',
  sand: '#f5f0e8',
  black: '#000000',
} as const;

// ============================================
// TYPOGRAPHY - iOS Dynamic Type Scale
// ============================================
export const typography = {
  // Font Families
  fontFamily: {
    primary: 'Outfit',           // SF Pro-like
    secondary: 'Instrument-Serif', // For elegant headings
    mono: 'Menlo',               // For numbers/code
  },

  // iOS-style Type Scale
  fontSize: {
    largeTitle: 34,      // Bold, prominent headings
    title1: 28,          // Bold, high-emphasis
    title2: 22,          // Bold, medium-emphasis
    title3: 20,          // SemiBold, medium-emphasis
    headline: 17,        // SemiBold, body-emphasis
    body: 17,            // Regular, primary body
    callout: 16,         // Regular, secondary body
    subheadline: 15,     // Regular, tertiary body
    footnote: 13,        // Regular, supporting text
    caption1: 12,        // Regular, minor text
    caption2: 11,        // Regular, de-emphasized
  },

  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },

  // Line Heights (optimal for readability)
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },

  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
} as const;

// ============================================
// SPACING - 8pt Grid System
// ============================================
export const spacing = {
  // Base unit: 4pt (iOS standard)
  unit: 4,

  // Spacing scale
  xs: 4,     // 1 unit - tight spacing
  sm: 8,     // 2 units - compact spacing
  md: 12,    // 3 units - default spacing
  lg: 16,    // 4 units - comfortable spacing
  xl: 20,    // 5 units - section spacing
  xxl: 24,   // 6 units - large spacing
  xxxl: 32,  // 8 units - extra large spacing

  // Component-specific
  screenPadding: 16,
  cardPadding: 16,
  buttonPadding: 12,
  inputPadding: 12,
} as const;

// ============================================
// BORDER RADIUS - Liquid Glass Curves
// ============================================
export const borderRadius = {
  // iOS-style corner radius
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,

  // Component-specific
  button: 14,
  card: 18,
  modal: 24,
  sheet: 28,
  pill: 999, // Fully rounded

  // Special shapes
  circle: 999,
} as const;

// ============================================
// SHADOWS - Depth & Elevation
// ============================================
export const shadows = {
  // iOS-style soft shadows
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },

  xxl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },

  // Inner shadow for pressed states
  inner: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 0,
  },
} as const;

// ============================================
// BLUR EFFECTS - Glassmorphism
// ============================================
export const blur = {
  // iOS blur effect intensities
  none: 0,
  subtle: 10,
  light: 20,
  medium: 30,
  heavy: 40,
  ultra: 60,

  // Component-specific blur amounts
  navigation: 30,
  card: 20,
  modal: 40,
  sheet: 30,
  tabBar: 30,
} as const;

// ============================================
// ANIMATION - Spring & Easing
// ============================================
export const animation = {
  // Duration (ms) - iOS standard timings
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 400,
    slower: 500,
  },

  // iOS spring curves (as config for Animated.spring)
  spring: {
    // Default iOS spring
    default: {
      damping: 15,
      stiffness: 150,
      mass: 0.5,
    },
    // Bouncy, playful
    bouncy: {
      damping: 10,
      stiffness: 200,
      mass: 0.6,
    },
    // Smooth, controlled
    smooth: {
      damping: 20,
      stiffness: 120,
      mass: 0.5,
    },
    // Snappy, responsive
    snappy: {
      damping: 18,
      stiffness: 180,
      mass: 0.4,
    },
  },

  // Easing curves (for timing functions)
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // Custom bezier curves
    iosDefault: [0.25, 0.1, 0.25, 1] as const,
    iosDecelerate: [0.0, 0.0, 0.2, 1] as const,
    iosAccelerate: [0.4, 0.0, 1, 1] as const,
  },

  // Scale transforms
  scale: {
    press: 0.96,
    hover: 1.02,
    active: 0.98,
  },

  // Opacity levels
  opacity: {
    invisible: 0,
    subtle: 0.3,
    faint: 0.5,
    visible: 0.7,
    full: 1,
  },
} as const;

// ============================================
// Z-INDEX - Elevation Hierarchy
// ============================================
export const zIndex = {
  // Background layers
  background: 0,
  content: 10,

  // Overlays
  card: 20,
  dropdown: 30,
  sticky: 40,

  // Navigation
  navigation: 50,
  tabBar: 50,

  // Modals
  modalBackdrop: 90,
  modalContent: 100,

  // Notifications
  toast: 110,
  tooltip: 120,

  // Highest
  statusBar: 1000,
} as const;

// ============================================
// GLASS EFFECT PRESETS
// ============================================
export const glassEffect = {
  // Subtle glass for cards
  card: {
    backgroundColor: colors.light.glass.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.light.border.subtle,
    ...shadows.sm,
  },

  // Navigation bar glass
  navigation: {
    backgroundColor: colors.light.glass.navigation,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border.subtle,
  },

  // Modal glass
  modal: {
    backgroundColor: colors.light.glass.modal,
    borderRadius: borderRadius.modal,
    ...shadows.xl,
  },

  // Bottom sheet glass
  sheet: {
    backgroundColor: colors.light.glass.modal,
    borderTopLeftRadius: borderRadius.sheet,
    borderTopRightRadius: borderRadius.sheet,
    borderTopWidth: 1,
    borderTopColor: colors.light.border.subtle,
    ...shadows.lg,
  },

  // Tab bar glass
  tabBar: {
    backgroundColor: colors.light.glass.navigation,
    borderTopWidth: 1,
    borderTopColor: colors.light.border.subtle,
  },
} as const;

// ============================================
// PLATFORM SPECIFICS
// ============================================
export const platform = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',

  // iOS-specific values
  ios: {
    statusBarHeight: 50, // Will be updated by safe area
    homeIndicatorHeight: 34,
    standardPadding: 16,
  },

  // Android-specific values
  android: {
    statusBarHeight: 24,
    navigationBarHeight: 48,
    standardPadding: 16,
  },
} as const;

// ============================================
// COMPLETE THEME EXPORT
// ============================================
export const liquidGlassTheme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  blur,
  animation,
  zIndex,
  glassEffect,
  platform,
} as const;

// Type for theme usage
export type LiquidGlassTheme = typeof liquidGlassTheme;
