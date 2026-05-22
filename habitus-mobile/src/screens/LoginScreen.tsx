import { useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";

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
    <AuthScreenLayout>
      <Text style={styles.title}>
        {isLogin ? es.access.welcomeBack : es.access.createAccount}
      </Text>
      <Text style={styles.subtitle}>
        {isLogin ? es.access.signInSubtitle : es.access.joinSubtitle}
      </Text>

      {!isLogin && role === "inquilino" && (
        <View style={styles.hintBanner}>
          <Text style={styles.hintBannerText}>{es.access.propertySignupHint}</Text>
        </View>
      )}

      {!isHabitusConfigured() && (
        <Text style={styles.warnText}>
          Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        </Text>
      )}

      {error ? (
        <View style={styles.errorBanner}>
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
              <MaterialIcons name="check" size={12} color={colors.white} />
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
              color={colors.outline}
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

      <Pressable style={[styles.primaryBtn, busy && styles.primaryBtnDisabled]} onPress={submit} disabled={busy}>
        {busy ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text style={styles.primaryBtnText}>
              {isLogin ? es.common.signIn : es.access.signUp}
            </Text>
            <MaterialIcons name="arrow-forward" size={18} color={colors.white} />
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
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    lineHeight: 32,
    color: colors.deepNavy,
    marginBottom: 2,
    ...fontStyles.title,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.warmSlate,
    marginBottom: 14,
    ...fontStyles.body,
  },
  hintBanner: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  hintBannerText: { fontSize: 13, lineHeight: 18, color: colors.onPrimaryContainer, ...fontStyles.body },
  warnText: { fontSize: 13, color: "#b45309", marginBottom: 12 },
  errorBanner: {
    backgroundColor: colors.errorContainer,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: { fontSize: 14, lineHeight: 20, color: colors.onErrorContainer, ...fontStyles.body },
  eyeBtn: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.tealAccent, borderColor: colors.tealAccent },
  rememberText: { fontSize: 14, color: colors.warmSlate, flexShrink: 1, ...fontStyles.body },
  forgotWrap: { marginTop: 8, alignItems: "flex-end", width: "100%" },
  forgotLink: { fontSize: 13, color: colors.tealAccent, textAlign: "right", ...fontStyles.label },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.deepNavy,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: colors.white, fontSize: 15, ...fontStyles.button },
  footer: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
    color: colors.warmSlate,
    lineHeight: 22,
    ...fontStyles.body,
  },
  footerLink: { color: colors.tealAccent, ...fontStyles.label },
});
