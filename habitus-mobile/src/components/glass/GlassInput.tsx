/**
 * GlassInput - Liquid Glass text input with floating label
 */

import React, { memo, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { liquidGlassTheme } from '../../theme/liquidGlass';

interface GlassInputProps extends Omit<TextInputProps, 'style' | 'onFocus' | 'onBlur'> {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  onFocus?: (e: any) => void;
  onBlur?: (e: any) => void;
}

export const GlassInput = memo(({
  label,
  error,
  helper,
  containerStyle,
  inputStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onFocus,
  onBlur,
  ...textInputProps
}: GlassInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = React.useCallback(
    (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = React.useCallback(
    (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  const containerBorder = React.useMemo(() => {
    if (error) {
      return liquidGlassTheme.colors.brand.error;
    }
    if (isFocused) {
      return liquidGlassTheme.colors.brand.primary;
    }
    return liquidGlassTheme.colors.light.border.default;
  }, [error, isFocused]);

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>{label}</Text>
      )}

      <View style={[styles.inputContainer, { borderColor: containerBorder }]}>
        <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />

        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithLeftIcon : null, inputStyle]}
          placeholderTextColor={liquidGlassTheme.colors.light.text.tertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...textInputProps}
        />

        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {(error || helper) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
});

GlassInput.displayName = 'GlassInput';

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: liquidGlassTheme.colors.light.text.secondary,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  labelError: {
    color: liquidGlassTheme.colors.brand.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: liquidGlassTheme.borderRadius.md,
    borderWidth: 1.5,
    backgroundColor: liquidGlassTheme.colors.light.glass.card,
    overflow: 'hidden',
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    color: liquidGlassTheme.colors.light.text.primary,
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.md,
    letterSpacing: -0.3,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  leftIcon: {
    paddingLeft: liquidGlassTheme.spacing.md,
    paddingRight: liquidGlassTheme.spacing.sm,
  },
  rightIcon: {
    paddingRight: liquidGlassTheme.spacing.md,
    paddingLeft: liquidGlassTheme.spacing.sm,
  },
  helperText: {
    fontSize: 13,
    fontWeight: '400',
    color: liquidGlassTheme.colors.light.text.tertiary,
    marginTop: 6,
    letterSpacing: -0.1,
  },
  errorText: {
    color: liquidGlassTheme.colors.brand.error,
  },
});
