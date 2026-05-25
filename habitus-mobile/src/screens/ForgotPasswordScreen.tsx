import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { es, requestPasswordReset } from "@habitus/core";
import { makeRedirectUri } from "expo-auth-session";
import { AuthField } from "../components/auth/AuthField";
import { AuthScreenLayout } from "../components/auth/AuthScreenLayout";
import { liquidGlassTheme } from "../theme/liquidGlass";

type Props = { onBack: () => void };

export function ForgotPasswordScreen({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  useState(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: liquidGlassTheme.animation.duration.normal,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: liquidGlassTheme.animation.duration.normal,
        useNativeDriver: true,
      }),
    ]).start();
  });

  async function submit() {
    setBusy(true);
    setError(null);
    const redirectTo = makeRedirectUri({ scheme: "habitus", path: "auth/callback" });
    const { error: err } = await requestPasswordReset(email.trim(), redirectTo);
    setBusy(false);
    if (err) setError(err);
    else setSent(true);
  }

  return (
    <AuthScreenLayout compactBrand>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Back button */}
        <Pressable style={styles.backRow} onPress={onBack}>
          <BlurView intensity={20} tint="light" style={styles.iconBlur}>
            <MaterialIcons
              name="arrow-back"
              size={20}
              color={liquidGlassTheme.colors.light.text.primary}
            />
          </BlurView>
          <Text style={styles.backText}>{es.common.back}</Text>
        </Pressable>

        {/* Title section */}
        <View style={styles.titleSection}>
          <MaterialIcons
            name="lock-reset"
            size={48}
            color={liquidGlassTheme.colors.brand.primary}
          />
          <Text style={styles.title}>{es.access.forgotTitle}</Text>
          <Text style={styles.subtitle}>{es.access.forgotSubtitle}</Text>
        </View>

        {/* Success state */}
        {sent ? (
          <View style={styles.successCard}>
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.successCardContent}>
              <MaterialIcons
                name="check-circle"
                size={48}
                color={liquidGlassTheme.colors.brand.success}
              />
              <Text style={styles.successTitle}>¡Email enviado!</Text>
              <Text style={styles.successText}>{es.access.forgotSent}</Text>
              <Pressable style={styles.backBtn} onPress={onBack}>
                <Text style={styles.backBtnText}>Volver al inicio de sesión</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {/* Error banner */}
            {error && (
              <View style={styles.errorBanner}>
                <MaterialIcons
                  name="error-outline"
                  size={20}
                  color={liquidGlassTheme.colors.brand.error}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email input */}
            <View style={styles.inputContainer}>
              <AuthField
                label={es.common.email}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="nombre@empresa.com"
              />
            </View>

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
                    name="send"
                    size={20}
                    color={liquidGlassTheme.colors.white}
                  />
                  <Text style={styles.submitBtnText}>{es.access.forgotSubmit}</Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </Animated.View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.xs,
    marginBottom: liquidGlassTheme.spacing.lg,
    marginTop: -liquidGlassTheme.spacing.xs,
  },
  iconBlur: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
  },
  backText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.medium,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: liquidGlassTheme.spacing.xl,
  },
  title: {
    fontSize: liquidGlassTheme.typography.fontSize.title1,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
    marginTop: liquidGlassTheme.spacing.md,
    textAlign: "center",
  },
  subtitle: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.secondary,
    textAlign: "center",
    paddingHorizontal: liquidGlassTheme.spacing.lg,
  },
  successCard: {
    borderRadius: liquidGlassTheme.borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.lg,
  },
  successCardContent: {
    padding: liquidGlassTheme.spacing.xxl,
    alignItems: "center",
  },
  successTitle: {
    fontSize: liquidGlassTheme.typography.fontSize.title3,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
    marginTop: liquidGlassTheme.spacing.md,
  },
  successText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.secondary,
    textAlign: "center",
    marginTop: liquidGlassTheme.spacing.sm,
  },
  backBtn: {
    marginTop: liquidGlassTheme.spacing.xl,
    paddingVertical: liquidGlassTheme.spacing.sm,
  },
  backBtnText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.brand.primary,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.sm,
    backgroundColor: liquidGlassTheme.colors.brand.error + "10",
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.md,
    marginBottom: liquidGlassTheme.spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.brand.error,
  },
  inputContainer: {
    marginBottom: liquidGlassTheme.spacing.xl,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.sm,
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
