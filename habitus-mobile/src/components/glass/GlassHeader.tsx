/**
 * GlassHeader - Liquid Glass header with blur effect
 */

import React, { memo } from 'react';
import { View, StyleSheet, Platform, ViewStyle, Text, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Svg, Path } from 'react-native-svg';
import { liquidGlassTheme } from '../../theme/liquidGlass';

interface GlassHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
  showBackButton?: boolean;
  onBackPress?: () => void;
  title?: string;
  rightAction?: React.ReactNode;
}

export const GlassHeader = memo(({
  children,
  style,
  showBackButton = false,
  onBackPress,
  title,
  rightAction,
}: GlassHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={liquidGlassTheme.blur.navigation}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <View style={styles.content}>
        <View style={styles.leftContainer}>
          {showBackButton && onBackPress && (
            <BackButton onPress={onBackPress} />
          )}
        </View>

        <View style={styles.centerContainer}>
          {title ? <Title>{title}</Title> : children}
        </View>

        <View style={styles.rightContainer}>{rightAction}</View>
      </View>
    </View>
  );
});

GlassHeader.displayName = 'GlassHeader';

const BackButton = memo(({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.backButton}>
    <ChevronLeftIcon />
  </TouchableOpacity>
));

BackButton.displayName = 'BackButton';

const Title = memo(({ children }: { children: string }) => (
  <Text style={styles.title} numberOfLines={1}>
    {children}
  </Text>
));

Title.displayName = 'Title';

const ChevronLeftIcon = memo(() => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18L9 12L15 6"
      stroke={liquidGlassTheme.colors.light.text.primary}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

ChevronLeftIcon.displayName = 'ChevronLeftIcon';

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.glass.navigation,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: liquidGlassTheme.spacing.lg,
  },
  leftContainer: {
    width: 60,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 60,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: liquidGlassTheme.colors.light.text.primary,
    letterSpacing: -0.3,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: liquidGlassTheme.borderRadius.sm,
    backgroundColor: liquidGlassTheme.colors.light.glass.card,
  },
});
