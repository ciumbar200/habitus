import { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import {
  ageFromBirthDate,
  completeOnboarding,
  es,
  isValidOnboardingAge,
} from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { liquidGlassTheme } from "../theme/liquidGlass";

type Props = {
  onDone: () => void;
};

export function OnboardingScreen({ onDone }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const agePreview = birthDate ? ageFromBirthDate(birthDate) : null;

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

  async function submit() {
    if (!user?.id) return;
    setError(null);
    if (!displayName.trim()) {
      setError("Indica tu nombre completo.");
      return;
    }
    if (!birthDate) {
      setError("Indica tu fecha de nacimiento (AAAA-MM-DD).");
      return;
    }
    if (!isValidOnboardingAge(ageFromBirthDate(birthDate))) {
      setError(es.onboarding.ageInvalid);
      return;
    }
    setBusy(true);
    const result = await completeOnboarding(user.id, { displayName, birthDate });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    await refreshProfile();
    onDone();
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
      <Animated.View
        style={[
          styles.orb1,
          { opacity: fadeAnim },
        ]}
      >
        <View style={styles.orbInner1} />
      </Animated.View>

      <Animated.View
        style={[
          styles.orb2,
          { opacity: fadeAnim },
        ]}
      >
        <View style={styles.orbInner2} />
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        {/* Glass card */}
        <View style={styles.card}>
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />

          {/* Icon */}
          <View style={styles.iconContainer}>
            <MaterialIcons
              name="person-add"
              size={48}
              color={liquidGlassTheme.colors.brand.primary}
            />
          </View>

          <Text style={styles.title}>{es.onboarding.basicsTitle}</Text>
          <Text style={styles.sub}>{es.onboarding.basicsSubtitle}</Text>

          {/* Name input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{es.onboarding.fullNamePlaceholder}</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="person-outline"
                size={20}
                color={liquidGlassTheme.colors.light.text.tertiary}
              />
              <TextInput
                style={styles.input}
                placeholder="Tu nombre completo"
                placeholderTextColor={liquidGlassTheme.colors.light.text.tertiary}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Birth date input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{es.onboarding.birthDate}</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="cake"
                size={20}
                color={liquidGlassTheme.colors.light.text.tertiary}
              />
              <TextInput
                style={styles.input}
                placeholder="1995-06-15"
                placeholderTextColor={liquidGlassTheme.colors.light.text.tertiary}
                value={birthDate}
                onChangeText={setBirthDate}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.hintRow}>
              <MaterialIcons
                name="info-outline"
                size={14}
                color={liquidGlassTheme.colors.light.text.tertiary}
              />
              <Text style={styles.hint}>
                {es.onboarding.ageHint}
                {agePreview != null && (
                  <Text style={styles.ageHighlight}> ({agePreview} años)</Text>
                )}
              </Text>
            </View>
          </View>

          {/* Error message */}
          {error && (
            <View style={styles.errorBanner}>
              <MaterialIcons
                name="error-outline"
                size={16}
                color={liquidGlassTheme.colors.brand.error}
              />
              <Text style={styles.error}>{error}</Text>
            </View>
          )}

          {/* Submit button */}
          <Pressable style={styles.submitBtn} onPress={submit} disabled={busy}>
            <LinearGradient
              colors={liquidGlassTheme.colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {busy ? (
              <ActivityIndicator color={liquidGlassTheme.colors.white} />
            ) : (
              <>
                <MaterialIcons
                  name="check"
                  size={20}
                  color={liquidGlassTheme.colors.white}
                />
                <Text style={styles.submitBtnText}>{es.onboarding.saveAndContinue}</Text>
              </>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: liquidGlassTheme.colors.light.background,
    padding: liquidGlassTheme.spacing.xl,
    justifyContent: "center",
  },
  orb1: {
    position: "absolute",
    width: 150,
    height: 150,
    top: -50,
    right: -30,
    borderRadius: 75,
  },
  orbInner1: {
    width: "100%",
    height: "100%",
    borderRadius: 75,
    backgroundColor: liquidGlassTheme.colors.brand.secondary + "20",
  },
  orb2: {
    position: "absolute",
    width: 100,
    height: 100,
    bottom: 100,
    left: -30,
    borderRadius: 50,
  },
  orbInner2: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    backgroundColor: liquidGlassTheme.colors.brand.accent + "15",
  },
  content: {
    position: "relative",
  },
  card: {
    borderRadius: liquidGlassTheme.borderRadius.modal,
    overflow: "hidden",
    backgroundColor: liquidGlassTheme.colors.light.glass.card,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.xl,
  },
  iconContainer: {
    alignItems: "center",
    marginTop: liquidGlassTheme.spacing.xl,
    marginBottom: liquidGlassTheme.spacing.lg,
  },
  title: {
    fontSize: liquidGlassTheme.typography.fontSize.title1,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
    textAlign: "center",
    marginBottom: liquidGlassTheme.spacing.xs,
  },
  sub: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.secondary,
    textAlign: "center",
    marginBottom: liquidGlassTheme.spacing.lg,
  },
  inputGroup: {
    marginBottom: liquidGlassTheme.spacing.lg,
  },
  label: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.secondary,
    marginBottom: liquidGlassTheme.spacing.sm,
    paddingHorizontal: liquidGlassTheme.spacing.xl + 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.md,
    backgroundColor: liquidGlassTheme.colors.light.surfaceVariant,
    borderRadius: liquidGlassTheme.borderRadius.md,
    paddingHorizontal: liquidGlassTheme.spacing.md,
    marginHorizontal: liquidGlassTheme.spacing.xl,
  },
  input: {
    flex: 1,
    paddingVertical: liquidGlassTheme.spacing.md,
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.xs,
    marginTop: liquidGlassTheme.spacing.sm,
    paddingHorizontal: liquidGlassTheme.spacing.xl + 4,
  },
  hint: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
  ageHighlight: {
    color: liquidGlassTheme.colors.brand.primary,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.xs,
    backgroundColor: liquidGlassTheme.colors.brand.error + "10",
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.sm,
    marginTop: liquidGlassTheme.spacing.md,
    marginHorizontal: liquidGlassTheme.spacing.xl,
  },
  error: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.brand.error,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.sm,
    marginHorizontal: liquidGlassTheme.spacing.xl,
    marginTop: liquidGlassTheme.spacing.lg,
    borderRadius: liquidGlassTheme.borderRadius.button,
    paddingVertical: liquidGlassTheme.spacing.md + 2,
    overflow: "hidden",
    ...liquidGlassTheme.shadows.md,
  },
  submitBtnText: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.inverse,
  },
});
