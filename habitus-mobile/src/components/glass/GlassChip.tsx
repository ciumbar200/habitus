/**
 * GlassChip - Liquid Glass chip/tag component
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { liquidGlassTheme } from '../../theme/liquidGlass';

interface GlassChipProps {
  label: string;
  variant?: 'default' | 'active' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  onRemove?: () => void;
  onPress?: () => void;
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
}

export const GlassChip = memo(({
  label,
  variant = 'default',
  size = 'medium',
  onRemove,
  onPress,
  style,
  leftIcon,
}: GlassChipProps) => {
  const Container = onPress || onRemove ? TouchableOpacity : View;
  const containerProps = onPress
    ? { onPress }
    : onRemove
    ? { onPress: () => {} }
    : {};

  const sizeStyles = React.useMemo(() => {
    const sizes = {
      small: {
        paddingHorizontal: liquidGlassTheme.spacing.md,
        paddingVertical: liquidGlassTheme.spacing.xs,
        minHeight: 24,
      },
      medium: {
        paddingHorizontal: liquidGlassTheme.spacing.lg,
        paddingVertical: liquidGlassTheme.spacing.sm,
        minHeight: 32,
      },
      large: {
        paddingHorizontal: liquidGlassTheme.spacing.xl,
        paddingVertical: liquidGlassTheme.spacing.md,
        minHeight: 40,
      },
    };
    return sizes[size];
  }, [size]);

  const variantStyles = React.useMemo(() => {
    const variants = {
      default: {
        backgroundColor: liquidGlassTheme.colors.light.glass.card,
        borderColor: liquidGlassTheme.colors.light.border.default,
        textColor: liquidGlassTheme.colors.light.text.primary,
      },
      active: {
        backgroundColor: liquidGlassTheme.colors.brand.primary + '15',
        borderColor: liquidGlassTheme.colors.brand.primary,
        textColor: liquidGlassTheme.colors.brand.primary,
      },
      success: {
        backgroundColor: liquidGlassTheme.colors.brand.success + '15',
        borderColor: liquidGlassTheme.colors.brand.success,
        textColor: liquidGlassTheme.colors.brand.success,
      },
      warning: {
        backgroundColor: liquidGlassTheme.colors.brand.warning + '15',
        borderColor: liquidGlassTheme.colors.brand.warning,
        textColor: liquidGlassTheme.colors.brand.warning,
      },
      error: {
        backgroundColor: liquidGlassTheme.colors.brand.error + '15',
        borderColor: liquidGlassTheme.colors.brand.error,
        textColor: liquidGlassTheme.colors.brand.error,
      },
    };
    return variants[variant];
  }, [variant]);

  const fontSize = React.useMemo(() => {
    const sizes = { small: 13, medium: 15, large: 17 };
    return sizes[size];
  }, [size]);

  return (
    <Container
      style={[
        styles.container,
        sizeStyles,
        { borderColor: variantStyles.borderColor },
        style,
      ]}
      {...containerProps}
    >
      <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <Text
          style={[
            styles.label,
            { color: variantStyles.textColor, fontSize },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {onRemove && (
          <View style={styles.removeIcon}>
            <CloseIcon size={fontSize * 1.2} />
          </View>
        )}
      </View>
    </Container>
  );
});

GlassChip.displayName = 'GlassChip';

const CloseIcon = memo(({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

CloseIcon.displayName = 'CloseIcon';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: liquidGlassTheme.borderRadius.xxl,
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leftIcon: {
    marginRight: -2,
  },
  label: {
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  removeIcon: {
    marginLeft: 2,
    opacity: 0.6,
  },
});
