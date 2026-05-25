/**
 * GlassCard - Liquid Glass card component with blur effect
 */

import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { liquidGlassTheme } from '../../theme/liquidGlass';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'subtle';
  blurIntensity?: number;
  radius?: number;
  padding?: number;
}

export const GlassCard = memo(({
  children,
  style,
  variant = 'default',
  blurIntensity = liquidGlassTheme.blur.light,
  radius = liquidGlassTheme.borderRadius.lg,
  padding = liquidGlassTheme.spacing.lg,
}: GlassCardProps) => {
  const cardStyle = React.useMemo(() => {
    const base: ViewStyle = {
      borderRadius: radius,
      overflow: 'hidden',
      backgroundColor: liquidGlassTheme.colors.light.glass.card,
      padding,
    };

    const variantStyles: Record<string, ViewStyle> = {
      default: liquidGlassTheme.shadows.sm,
      elevated: liquidGlassTheme.shadows.lg,
      subtle: liquidGlassTheme.shadows.none,
    };

    return StyleSheet.flatten([base, variantStyles[variant] || {}, style]);
  }, [variant, radius, padding, style]);

  if (Platform.OS === 'ios') {
    return (
      <View style={cardStyle}>
        <BlurView intensity={blurIntensity} style={StyleSheet.absoluteFill} tint="light">
          {children}
        </BlurView>
      </View>
    );
  }

  return <View style={cardStyle}>{children}</View>;
});

GlassCard.displayName = 'GlassCard';
