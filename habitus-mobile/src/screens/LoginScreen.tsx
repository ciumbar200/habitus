import { useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { isPropertyReturnPath } from "@habitus/core";
import { loadRememberedEmail, saveRememberMe } from "../lib/rememberMe";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ACCOUNT_ROLES, es } from "@habitus/core";
import type { AccountRoleSlug, OAuthProvider } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { signInWithOAuthMobile } from "../lib/oauth";
import { isHabitusConfigured } from "../lib/supabase";
import { peekReturnTo } from "../lib/returnTo";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";

export function LoginScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "Login">>();
  const { signIn, signUp, finalizeOAuthSession } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.brand}>{es.brand}</Text>
      <Text style={styles.tagline}>{es.access.tagline}</Text>
      {mode === "signup" && role === "inquilino" && (
        <Text style={styles.propertyHint}>{es.access.propertySignupHint}</Text>
      )}
      {!isHabitusConfigured() && (
        <Text style={styles.warn}>
          Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env
        </Text>
      )}

      <View style={styles.socialRow}>
        <Pressable
          style={styles.socialBtn}
          onPress={() => oauth("google")}
          disabled={busy}
        >
          <Text style={styles.socialBtnText}>{es.access.continueGoogle}</Text>
        </Pressable>
        <Pressable
          style={styles.socialBtn}
          onPress={() => oauth("facebook")}
          disabled={busy}
        >
          <Text style={styles.socialBtnText}>{es.access.continueFacebook}</Text>
        </Pressable>
      </View>
      <Text style={styles.orEmail}>{es.access.orEmail}</Text>

      {mode === "signup" && (
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {mode === "login" && (
        <Pressable style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxOn]} />
          <Text style={styles.rememberText}>{es.common.rememberMe}</Text>
        </Pressable>
      )}
      {mode === "login" && (
        <Pressable onPress={() => setShowForgot(true)}>
          <Text style={styles.forgot}>{es.common.forgotPassword}</Text>
        </Pressable>
      )}
      {mode === "signup" && (
        <View style={styles.roles}>
          {ACCOUNT_ROLES.map((r) => (
            <Pressable
              key={r.slug}
              style={[styles.roleChip, role === r.slug && styles.roleChipActive]}
              onPress={() => setRole(r.slug)}
            >
              <Text style={role === r.slug ? styles.roleTextActive : styles.roleText}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.btn} onPress={submit} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>
            {mode === "login" ? es.common.signIn : es.access.signUp}
          </Text>
        )}
      </Pressable>
      <Pressable onPress={() => setMode(mode === "login" ? "signup" : "login")}>
        <Text style={styles.switch}>
          {mode === "login" ? es.access.notMember : es.access.hasAccount}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#f8f6f3" },
  brand: { fontSize: 32, fontWeight: "700", color: "#1a3d2e", marginBottom: 4 },
  tagline: { fontSize: 15, color: "#4a5c52", marginBottom: 24 },
  propertyHint: {
    fontSize: 13,
    color: "#2d6a4f",
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  warn: { color: "#b45309", marginBottom: 12, fontSize: 13 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2ddd4",
  },
  roles: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d4cfc4",
  },
  roleChipActive: { backgroundColor: "#1a3d2e", borderColor: "#1a3d2e" },
  roleText: { color: "#333", fontSize: 13 },
  roleTextActive: { color: "#fff", fontSize: 13 },
  error: { color: "#b91c1c", marginBottom: 8 },
  btn: {
    backgroundColor: "#1a3d2e",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  switch: { textAlign: "center", marginTop: 16, color: "#1a3d2e" },
  socialRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  socialBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2ddd4",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  socialBtnText: { fontSize: 14, fontWeight: "600", color: "#1a3d2e" },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#1a3d2e",
    borderRadius: 4,
  },
  checkboxOn: { backgroundColor: "#1a3d2e" },
  rememberText: { color: "#333", fontSize: 14 },
  forgot: { textAlign: "right", color: "#1a3d2e", marginBottom: 8, fontSize: 13 },
  orEmail: {
    textAlign: "center",
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
  },
});
