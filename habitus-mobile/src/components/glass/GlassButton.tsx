/**
 * GlassButton - Liquid Glass button with smooth animations
 */

import React, { memo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  Animated,
  GestureResponderEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { liquidGlassTheme } from '../../theme/liquidGlass';

interface GlassButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const GlassButton = memo(({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}: GlassButtonProps) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = React.useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: liquidGlassTheme.animation.scale.press,
      duration: liquidGlassTheme.animation.duration.fast,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = React.useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...liquidGlassTheme.animation.spring.smooth,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePress = React.useCallback(
    (event: GestureResponderEvent) => {
      if (!disabled && !loading) {
        onPress(event);
      }
    },
    [disabled, loading, onPress]
  );

  const sizeStyles = React.useMemo(() => {
    const sizes = {
      small: {
        paddingVertical: liquidGlassTheme.spacing.sm,
        paddingHorizontal: liquidGlassTheme.spacing.lg,
        minHeight: 36,
      },
      medium: {
        paddingVertical: liquidGlassTheme.spacing.md,
        paddingHorizontal: liquidGlassTheme.spacing.xl,
        minHeight: 44,
      },
      large: {
        paddingVertical: liquidGlassTheme.spacing.lg,
        paddingHorizontal: liquidGlassTheme.spacing.xxl,
        minHeight: 52,
      },
    };
    return sizes[size];
  }, [size]);

  const variantStyles = React.useMemo(() => {
    const variants = {
      primary: {
        backgroundColor: liquidGlassTheme.colors.brand.primary,
        borderColor: 'transparent',
      },
      secondary: {
        backgroundColor: liquidGlassTheme.colors.light.glass.card,
        borderColor: liquidGlassTheme.colors.light.border.default,
      },
      tertiary: {
        backgroundColor: 'transparent',
        borderColor: liquidGlassTheme.colors.light.border.default,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
    };
    return variants[variant];
  }, [variant]);

  const textVariantStyles = React.useMemo(() => {
    const variants = {
      primary: {
        color: liquidGlassTheme.colors.light.text.inverse,
      },
      secondary: {
        color: liquidGlassTheme.colors.light.text.primary,
      },
      tertiary: {
        color: liquidGlassTheme.colors.brand.primary,
      },
      ghost: {
        color: liquidGlassTheme.colors.brand.primary,
      },
    };
    return variants[variant];
  }, [variant]);

  const containerStyle = React.useMemo(
    () => ({
      ...styles.container,
      ...sizeStyles,
      ...variantStyles,
      opacity: disabled ? 0.5 : 1,
    }),
    [sizeStyles, variantStyles, disabled]
  );

  const textStyleFlatten = React.useMemo(
    () => ({
      ...styles.text,
      ...textVariantStyles,
      ...(disabled && styles.textDisabled),
    }),
    [textVariantStyles, disabled]
  );

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[containerStyle, style]}
      >
        {variant === 'secondary' ? (
          <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
        ) : null}

        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={[textStyleFlatten, textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

GlassButton.displayName = 'GlassButton';

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  textDisabled: {
    opacity: 0.6,
  },
  iconLeft: {
    marginRight: -4,
  },
  iconRight: {
    marginLeft: -4,
  },
});
