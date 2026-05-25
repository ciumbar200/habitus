import { useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { es, isPropertyReturnPath } from "@habitus/core";
import type { AccountRoleSlug, OAuthProvider } from "@habitus/core";
import { AuthDivider } from "../components/auth/AuthDivider";
import { AuthField } from "../components/auth/AuthField";
import { AuthScreenLayout } from "../components/auth/AuthScreenLayout";
import { RolePicker } from "../components/auth/RolePicker";
import { SocialAuthButtons } from "../components/auth/SocialAuthButtons";
import { useAuth } from "../context/AuthContext";
import { signInWithOAuthMobile } from "../lib/oauth";
import { loadRememberedEmail, saveRememberMe } from "../lib/rememberMe";
import { peekReturnTo } from "../lib/returnTo";
import { isHabitusConfigured } from "../lib/supabase";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { fontStyles } from "../theme/fonts";
import { liquidGlassTheme } from "../theme/liquidGlass";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";

const { width, height } = Dimensions.get("window");

export function LoginScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "Login">>();
  const { signIn, signUp, finalizeOAuthSession } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<AccountRoleSlug>("inquilino");
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    loadRememberedEmail().then((saved) => {
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    });
  }, []);

  useEffect(() => {
    if (route.params?.signup) {
      setMode("signup");
      setRole("inquilino");
    }
    peekReturnTo().then((path) => {
      if (isPropertyReturnPath(path)) {
        setMode("signup");
        setRole("inquilino");
      }
    });
  }, [route.params?.signup]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: liquidGlassTheme.animation.duration.slow,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: liquidGlassTheme.animation.duration.slow,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  async function oauth(provider: OAuthProvider) {
    setError(null);
    setBusy(true);
    const { error: oauthErr, cancelled } = await signInWithOAuthMobile(provider, {
      isSignUp: mode === "signup",
      accountRole: role,
    });
    if (cancelled || oauthErr) {
      setBusy(false);
      if (oauthErr) setError(oauthErr);
      return;
    }
    const fin = await finalizeOAuthSession();
    setBusy(false);
    if (fin.error) setError(fin.error);
  }

  async function submit() {
    setError(null);
    if (mode === "signup" && !role) {
      setError(es.access.roleRequired);
      return;
    }
    if (mode === "login") await saveRememberMe(email, rememberMe);
    setBusy(true);
    const result =
      mode === "login"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, name.trim(), role);
    setBusy(false);
    if (result.error) setError(result.error);
  }

  if (showForgot) {
    return <ForgotPasswordScreen onBack={() => setShowForgot(false)} />;
  }

  const isLogin = mode === "login";

  return (
    <View style={styles.container}>
      {/* Animated gradient background */}
      <LinearGradient
        colors={[
          liquidGlassTheme.colors.gradients.primary[0],
          liquidGlassTheme.colors.gradients.primary[1],
          liquidGlassTheme.colors.light.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      >
        {/* Animated orbs for depth */}
        <Animated.View
          style={[
            styles.orb1,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.orbInner1} />
        </Animated.View>
        <Animated.View
          style={[
            styles.orb2,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.orbInner2} />
        </Animated.View>
      </LinearGradient>

      <AuthScreenLayout>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Glass card for auth content */}
          <View style={styles.glassCard}>
            {Platform.OS === "ios" && (
              <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
            )}

            <View style={styles.cardContent}>
              {/* Logo area */}
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <MaterialIcons
                    name="apartment"
                    size={40}
                    color={liquidGlassTheme.colors.brand.primary}
                  />
                </View>
              </View>

              <Text style={styles.title}>
                {isLogin ? es.access.welcomeBack : es.access.createAccount}
              </Text>
              <Text style={styles.subtitle}>
                {isLogin ? es.access.signInSubtitle : es.access.joinSubtitle}
              </Text>

              {!isLogin && role === "inquilino" && (
                <View style={styles.hintBanner}>
                  <MaterialIcons name="info-outline" size={16} color={liquidGlassTheme.colors.brand.primary} />
                  <Text style={styles.hintBannerText}>{es.access.propertySignupHint}</Text>
                </View>
              )}

              {!isHabitusConfigured() && (
                <View style={styles.warnBanner}>
                  <MaterialIcons name="warning" size={16} color="#b45309" />
                  <Text style={styles.warnText}>
                    Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
                  </Text>
                </View>
              )}

              {error ? (
                <View style={styles.errorBanner}>
                  <MaterialIcons name="error-outline" size={16} color={liquidGlassTheme.colors.brand.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <SocialAuthButtons
                busy={busy}
                onGoogle={() => oauth("google")}
                onFacebook={() => oauth("facebook")}
              />

              <AuthDivider />

              {mode === "signup" && (
                <AuthField
                  label={es.common.fullName}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              )}

              {mode === "signup" && <RolePicker value={role} onChange={setRole} />}

              <AuthField
                label={es.common.email}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                placeholder="nombre@empresa.com"
              />

              {isLogin && (
                <Pressable style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
                  <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
                    {rememberMe ? (
                      <MaterialIcons name="check" size={14} color={liquidGlassTheme.colors.white} />
                    ) : null}
                  </View>
                  <Text style={styles.rememberText}>{es.common.rememberMe}</Text>
                </Pressable>
              )}

              <AuthField
                label={es.common.password}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete={isLogin ? "password" : "password-new"}
                suffix={
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={20}
                      color={liquidGlassTheme.colors.light.text.tertiary}
                    />
                  </Pressable>
                }
                footer={
                  isLogin ? (
                    <Pressable style={styles.forgotWrap} onPress={() => setShowForgot(true)}>
                      <Text style={styles.forgotLink}>{es.common.forgotPassword}</Text>
                    </Pressable>
                  ) : undefined
                }
              />

              {/* Glass primary button */}
              <Pressable
                style={[styles.primaryBtn, busy && styles.primaryBtnDisabled]}
                onPress={submit}
                disabled={busy}
              >
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
                    <Text style={styles.primaryBtnText}>
                      {isLogin ? es.common.signIn : es.access.signUp}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={18} color={liquidGlassTheme.colors.white} />
                  </>
                )}
              </Pressable>

              <Text style={styles.footer}>
                {isLogin ? es.access.notMember : es.access.hasAccount}{" "}
                <Text
                  style={styles.footerLink}
                  onPress={() => {
                    setMode(isLogin ? "signup" : "login");
                    setError(null);
                  }}
                >
                  {isLogin ? es.access.createAccountLink : es.access.signInLink}
                </Text>
              </Text>
            </View>
          </View>
        </Animated.View>
      </AuthScreenLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: liquidGlassTheme.colors.light.background,
  },
  orb1: {
    position: "absolute",
    width: 200,
    height: 200,
    top: -50,
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
    left: -40,
    borderRadius: 75,
  },
  orbInner2: {
    width: "100%",
    height: "100%",
    borderRadius: 75,
    backgroundColor: liquidGlassTheme.colors.brand.accent + "15",
  },
  glassCard: {
    borderRadius: liquidGlassTheme.borderRadius.modal,
    overflow: "hidden",
    backgroundColor: liquidGlassTheme.colors.light.glass.card,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.xl,
  },
  cardContent: {
    padding: liquidGlassTheme.spacing.xxl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: liquidGlassTheme.spacing.lg,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: liquidGlassTheme.colors.light.glass.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.md,
  },
  title: {
    fontSize: liquidGlassTheme.typography.fontSize.title1,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
    marginBottom: 4,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.secondary,
    marginBottom: liquidGlassTheme.spacing.lg,
    textAlign: "center",
    lineHeight: liquidGlassTheme.typography.lineHeight.normal,
  },
  hintBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "10",
    borderRadius: liquidGlassTheme.borderRadius.md,
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.sm,
    marginBottom: liquidGlassTheme.spacing.md,
  },
  hintBannerText: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.brand.primary,
    flex: 1,
  },
  warnBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef3c7",
    borderRadius: liquidGlassTheme.borderRadius.md,
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.sm,
    marginBottom: liquidGlassTheme.spacing.md,
  },
  warnText: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: "#92400e",
    flex: 1,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: liquidGlassTheme.colors.brand.error + "10",
    borderRadius: liquidGlassTheme.borderRadius.md,
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.sm,
    marginBottom: liquidGlassTheme.spacing.md,
  },
  errorText: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.brand.error,
    flex: 1,
  },
  eyeBtn: {
    padding: liquidGlassTheme.spacing.xs,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.sm,
    marginBottom: liquidGlassTheme.spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: liquidGlassTheme.colors.light.border.default,
    borderRadius: liquidGlassTheme.borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    backgroundColor: liquidGlassTheme.colors.brand.primary,
    borderColor: liquidGlassTheme.colors.brand.primary,
  },
  rememberText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.secondary,
  },
  forgotWrap: {
    alignItems: "flex-end",
    width: "100%",
    marginTop: liquidGlassTheme.spacing.xs,
  },
  forgotLink: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.brand.primary,
    fontWeight: liquidGlassTheme.typography.fontWeight.medium,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.button,
    paddingVertical: liquidGlassTheme.spacing.md + 2,
    marginTop: liquidGlassTheme.spacing.sm,
    overflow: "hidden",
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: liquidGlassTheme.colors.light.text.inverse,
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    letterSpacing: -0.3,
  },
  footer: {
    textAlign: "center",
    marginTop: liquidGlassTheme.spacing.xl,
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.secondary,
    lineHeight: liquidGlassTheme.typography.lineHeight.normal,
  },
  footerLink: {
    color: liquidGlassTheme.colors.brand.primary,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
  },
});
