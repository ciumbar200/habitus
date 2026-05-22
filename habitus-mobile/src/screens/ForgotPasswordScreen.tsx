import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { es, requestPasswordReset } from "@habitus/core";
import { makeRedirectUri } from "expo-auth-session";
import { AuthField } from "../components/auth/AuthField";
import { AuthScreenLayout } from "../components/auth/AuthScreenLayout";
import { colors } from "../theme/colors";
import { fontStyles } from "../theme/fonts";

type Props = { onBack: () => void };

export function ForgotPasswordScreen({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      <Pressable style={styles.backRow} onPress={onBack}>
        <MaterialIcons name="arrow-back" size={20} color={colors.deepNavy} />
        <Text style={styles.backText}>{es.common.back}</Text>
      </Pressable>

      <Text style={styles.title}>{es.access.forgotTitle}</Text>
      <Text style={styles.subtitle}>{es.access.forgotSubtitle}</Text>

      {sent ? (
        <Text style={styles.successText}>{es.access.forgotSent}</Text>
      ) : (
        <>
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <AuthField
            label={es.common.email}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="nombre@empresa.com"
          />
          <Pressable style={styles.primaryBtn} onPress={submit} disabled={busy}>
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>{es.access.forgotSubmit}</Text>
            )}
          </Pressable>
        </>
      )}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
    marginTop: -8,
  },
  backText: { fontSize: 14, color: colors.deepNavy, ...fontStyles.label },
  title: {
    fontSize: 24,
    lineHeight: 32,
    color: colors.deepNavy,
    marginBottom: 4,
    ...fontStyles.title,
  },
  subtitle: {
    fontSize: 16,
    color: colors.warmSlate,
    marginBottom: 16,
    lineHeight: 22,
    ...fontStyles.body,
  },
  successText: { fontSize: 15, color: colors.warmSlate, lineHeight: 22, ...fontStyles.body },
  errorBanner: {
    backgroundColor: colors.errorContainer,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { fontSize: 14, color: colors.onErrorContainer },
  primaryBtn: {
    backgroundColor: colors.deepNavy,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: { color: colors.white, fontSize: 15, ...fontStyles.button },
});
