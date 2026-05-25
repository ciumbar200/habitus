/**
 * GlassTabBar - Liquid Glass bottom navigation tab bar
 */

import React, { memo } from 'react';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { liquidGlassTheme } from '../../theme/liquidGlass';
import { useTheme } from './ThemeProvider';

interface TabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

interface GlassTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export const GlassTabBar = memo(({
  tabs,
  activeTab,
  onTabChange,
}: GlassTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const handlePress = React.useCallback(
    (key: string) => () => {
      onTabChange(key);
    },
    [onTabChange]
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={liquidGlassTheme.blur.tabBar}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <View style={styles.content}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={handlePress(tab.key)}
              style={({ pressed }) => [
                styles.tab,
                pressed && styles.tabPressed,
                isActive && styles.tabActive,
              ]}
              android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: true }}
            >
              <View style={styles.iconContainer}>
                {isActive ? tab.activeIcon || tab.icon : tab.icon}
              </View>
              <Text
                style={[styles.label, isActive && styles.labelActive]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

GlassTabBar.displayName = 'GlassTabBar';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.glass.navigation,
  },
  content: {
    flexDirection: 'row',
    paddingHorizontal: liquidGlassTheme.spacing.sm,
    paddingTop: liquidGlassTheme.spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: liquidGlassTheme.spacing.sm,
    paddingHorizontal: liquidGlassTheme.spacing.xs,
    borderRadius: liquidGlassTheme.borderRadius.md,
  },
  tabPressed: {
    transform: [{ scale: liquidGlassTheme.animation.scale.press }],
  },
  tabActive: {
    backgroundColor: liquidGlassTheme.colors.brand.primary + '15',
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: liquidGlassTheme.colors.light.text.tertiary,
    letterSpacing: -0.2,
  },
  labelActive: {
    color: liquidGlassTheme.colors.brand.primary,
    fontWeight: '600',
  },
});
