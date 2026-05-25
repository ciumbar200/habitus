import { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { ACCOUNT_ROLES, es } from "@habitus/core";
import type { AccountRoleSlug } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { liquidGlassTheme } from "../theme/liquidGlass";

const ROLE_ICONS: Record<string, string> = {
  inquilino: "person-outline",
  anfitrion: "home-outline",
  propietario: "apartment",
  agencia: "business",
};

export function CompleteRoleScreen() {
  const { updateAccountRole } = useAuth();
  const [role, setRole] = useState<AccountRoleSlug | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: liquidGlassTheme.animation.duration.normal,
        useNativeDriver: true,
      }),
      Animated.spring(slideUpAnim, {
        toValue: 0,
        ...liquidGlassTheme.animation.spring.smooth,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  async function save() {
    if (!role) {
      setError(es.access.roleRequired);
      return;
    }
    setBusy(true);
    setError(null);
    const err = await updateAccountRole(role);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <View style={styles.root}>
      {/* Background gradient */}
      <LinearGradient
        colors={[
          liquidGlassTheme.colors.gradients.primary[0],
          liquidGlassTheme.colors.light.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated orbs */}
      <Animated.View style={[styles.orb1, { opacity: fadeAnim }]}>
        <View style={styles.orbInner1} />
      </Animated.View>

      <Animated.View style={[styles.orb2, { opacity: fadeAnim }]}>
        <View style={styles.orbInner2} />
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              <MaterialIcons
                name="how-to-reg"
                size={32}
                color={liquidGlassTheme.colors.brand.primary}
              />
            </View>
            <Text style={styles.title}>{es.access.completeRoleTitle}</Text>
            <Text style={styles.hint}>{es.access.accountRoleHint}</Text>
          </View>

          {/* Role cards */}
          <View style={styles.cardsContainer}>
            {ACCOUNT_ROLES.map((r) => {
              const isSelected = role === r.slug;
              const cardAnim = useState(new Animated.Value(0))[0];

              const handlePress = () => {
                setRole(r.slug);
                Animated.spring(cardAnim, {
                  toValue: 1,
                  ...liquidGlassTheme.animation.spring.bouncy,
                  useNativeDriver: true,
                }).start();
              };

              return (
                <Pressable key={r.slug} onPress={handlePress}>
                  <Animated.View
                    style={[
                      styles.card,
                      isSelected && styles.cardActive,
                      { transform: [{ scale: Animated.subtract(1, Animated.multiply(0.02, cardAnim)) }] },
                    ]}
                  >
                    <BlurView
                      intensity={isSelected ? 30 : 10}
                      tint="light"
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <View
                          style={[
                            styles.iconBadge,
                            isSelected && styles.iconBadgeActive,
                          ]}
                        >
                          <MaterialIcons
                            name={ROLE_ICONS[r.slug] as any}
                            size={24}
                            color={
                              isSelected
                                ? liquidGlassTheme.colors.white
                                : liquidGlassTheme.colors.brand.primary
                            }
                          />
                        </View>
                        {isSelected && (
                          <Animated.View
                            style={[
                              styles.checkBadge,
                              { opacity: cardAnim },
                            ]}
                          >
                            <MaterialIcons
                              name="check-circle"
                              size={24}
                              color={liquidGlassTheme.colors.brand.success}
                            />
                          </Animated.View>
                        )}
                      </View>
                      <Text style={[styles.cardLabel, isSelected && styles.cardLabelActive]}>
                        {r.label}
                      </Text>
                      <Text style={[styles.cardDesc, isSelected && styles.cardDescActive]}>
                        {r.description}
                      </Text>
                    </View>
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>

          {/* Error message */}
          {error && (
            <View style={styles.errorBanner}>
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.errorContent}>
                <MaterialIcons
                  name="error-outline"
                  size={20}
                  color={liquidGlassTheme.colors.brand.error}
                />
                <Text style={styles.error}>{error}</Text>
              </View>
            </View>
          )}

          {/* Submit button */}
          <Pressable
            style={[styles.btn, !role && styles.btnDisabled]}
            onPress={save}
            disabled={busy || !role}
          >
            <LinearGradient
              colors={
                role
                  ? liquidGlassTheme.colors.gradients.primary
                  : ["#ccc", "#999"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {busy ? (
              <ActivityIndicator color={liquidGlassTheme.colors.white} />
            ) : (
              <>
                <MaterialIcons
                  name="arrow-forward"
                  size={20}
                  color={liquidGlassTheme.colors.white}
                />
                <Text style={styles.btnText}>{es.access.continue}</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: liquidGlassTheme.colors.light.background,
  },
  orb1: {
    position: "absolute",
    width: 200,
    height: 200,
    top: -80,
    right: -50,
    borderRadius: 100,
  },
  orbInner1: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
    backgroundColor: liquidGlassTheme.colors.brand.secondary + "20",
  },
  orb2: {
    position: "absolute",
    width: 150,
    height: 150,
    bottom: 100,
    left: -50,
    borderRadius: 75,
  },
  orbInner2: {
    width: "100%",
    height: "100%",
    borderRadius: 75,
    backgroundColor: liquidGlassTheme.colors.brand.accent + "15",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: liquidGlassTheme.spacing.xl,
    paddingTop: liquidGlassTheme.spacing.xxl + 8,
    paddingBottom: liquidGlassTheme.spacing.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: liquidGlassTheme.spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.md,
  },
  title: {
    fontSize: liquidGlassTheme.typography.fontSize.title1,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
    textAlign: "center",
    marginBottom: liquidGlassTheme.spacing.sm,
  },
  hint: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.secondary,
    textAlign: "center",
    paddingHorizontal: liquidGlassTheme.spacing.md,
  },
  cardsContainer: {
    gap: liquidGlassTheme.spacing.md,
    marginBottom: liquidGlassTheme.spacing.xl,
  },
  card: {
    borderRadius: liquidGlassTheme.borderRadius.xl,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.glass.card + "80",
    ...liquidGlassTheme.shadows.lg,
  },
  cardActive: {
    borderColor: liquidGlassTheme.colors.brand.primary,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "15",
  },
  cardContent: {
    padding: liquidGlassTheme.spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: liquidGlassTheme.spacing.md,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: liquidGlassTheme.colors.light.surfaceVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadgeActive: {
    backgroundColor: liquidGlassTheme.colors.brand.primary,
  },
  checkBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: liquidGlassTheme.colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...liquidGlassTheme.shadows.sm,
  },
  cardLabel: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.primary,
    marginBottom: liquidGlassTheme.spacing.xs,
  },
  cardLabelActive: {
    color: liquidGlassTheme.colors.brand.primary,
  },
  cardDesc: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.secondary,
    lineHeight: liquidGlassTheme.typography.lineHeight.normal,
  },
  cardDescActive: {
    color: liquidGlassTheme.colors.light.text.primary,
  },
  errorBanner: {
    borderRadius: liquidGlassTheme.borderRadius.md,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.lg,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.brand.error + "30",
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.sm,
    padding: liquidGlassTheme.spacing.md,
  },
  error: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.brand.error,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.button,
    paddingVertical: liquidGlassTheme.spacing.md + 2,
    overflow: "hidden",
    ...liquidGlassTheme.shadows.md,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.inverse,
  },
});
