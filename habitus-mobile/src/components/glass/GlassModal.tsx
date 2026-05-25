/**
 * GlassModal - Liquid Glass modal with blur backdrop
 */

import React, { memo, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Animated,
  DimensionValue,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { liquidGlassTheme } from '../../theme/liquidGlass';

interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: StyleSheet.NamedStyles<any>;
  position?: 'center' | 'bottom';
  maxWidth?: DimensionValue;
  maxHeight?: DimensionValue;
  dismissOnBackdropPress?: boolean;
}

export const GlassModal = memo(({
  visible,
  onClose,
  children,
  style,
  position = 'center',
  maxWidth = '90%',
  maxHeight = '80%',
  dismissOnBackdropPress = true,
}: GlassModalProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: liquidGlassTheme.animation.duration.normal,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          ...liquidGlassTheme.animation.spring.smooth,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: liquidGlassTheme.animation.duration.normal,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: liquidGlassTheme.animation.duration.fast,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          ...liquidGlassTheme.animation.spring.smooth,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleBackdropPress = React.useCallback(() => {
    if (dismissOnBackdropPress) {
      onClose();
    }
  }, [dismissOnBackdropPress, onClose]);

  const contentStyle = React.useMemo(() => {
    const base: any = {
      ...styles.modalContent,
      maxWidth,
      maxHeight,
    };

    if (position === 'bottom') {
      base.position = 'absolute';
      base.bottom = 0;
      base.left = 0;
      base.right = 0;
      base.borderTopLeftRadius = liquidGlassTheme.borderRadius.sheet;
      base.borderTopRightRadius = liquidGlassTheme.borderRadius.sheet;
      base.transform = [{ translateY: slideAnim }];
    } else {
      base.transform = [{ scale: scaleAnim }];
    }

    return base;
  }, [position, maxWidth, maxHeight, scaleAnim, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable onPress={handleBackdropPress} style={styles.backdropPress}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
        </Animated.View>

        {/* Modal Content */}
        <Animated.View style={[contentStyle, { opacity: fadeAnim }]}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalInner, style]}>{children}</View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
});

GlassModal.displayName = 'GlassModal';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: liquidGlassTheme.colors.light.scrim,
  },
  backdropPress: {
    flex: 1,
  },
  modalContent: {
    width: '90%',
    backgroundColor: liquidGlassTheme.colors.light.glass.modal,
    borderRadius: liquidGlassTheme.borderRadius.modal,
    overflow: 'hidden',
    ...liquidGlassTheme.shadows.xl,
  },
  modalInner: {
    padding: liquidGlassTheme.spacing.xxl,
  },
});
