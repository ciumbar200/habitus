/**
 * GlassAvatar - Liquid Glass avatar with blur background
 */

import React, { memo } from 'react';
import { View, Image, StyleSheet, ViewStyle, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { liquidGlassTheme } from '../../theme/liquidGlass';

interface GlassAvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  style?: ViewStyle;
  bordered?: boolean;
}

export const GlassAvatar = memo(({
  uri,
  name,
  size = 48,
  style,
  bordered = true,
}: GlassAvatarProps) => {
  const initials = React.useMemo(() => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [name]);

  const avatarColors = React.useMemo(() => {
    const colors = [
      ['#06b6d4', '#0891b2'], // cyan
      ['#8b5cf6', '#7c3aed'], // violet
      ['#ec4899', '#db2777'], // pink
      ['#f59e0b', '#d97706'], // amber
      ['#10b981', '#059669'], // emerald
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  }, [name]);

  const containerStyle = React.useMemo(
    () => ({
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: bordered ? 2 : 0,
      borderColor: bordered
        ? liquidGlassTheme.colors.light.glass.card
        : 'transparent',
    }),
    [size, bordered]
  );

  return (
    <View style={[styles.container, containerStyle, style]}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      ) : (
        <BlurView
          intensity={20}
          tint="light"
          style={StyleSheet.absoluteFill}
        >
          <View
            style={[
              styles.initialsContainer,
              { backgroundColor: avatarColors[0] },
            ]}
          >
            <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
              {initials}
            </Text>
          </View>
        </BlurView>
      )}
    </View>
  );
});

GlassAvatar.displayName = 'GlassAvatar';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: liquidGlassTheme.colors.light.glass.card,
    ...liquidGlassTheme.shadows.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
    color: liquidGlassTheme.colors.light.text.inverse,
    letterSpacing: 0.5,
  },
});
