import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { es, requestPasswordReset } from "@habitus/core";
import { makeRedirectUri } from "expo-auth-session";

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
    const { error: err } = await requestPasswordReset(email, redirectTo);
    setBusy(false);
    if (err) setError(err);
    else setSent(true);
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{es.access.forgotTitle}</Text>
      <Text style={styles.sub}>{es.access.forgotSubtitle}</Text>
      {sent ? (
        <Text style={styles.ok}>{es.access.forgotSent}</Text>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder={es.common.email}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.btn} onPress={submit} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{es.access.forgotSubmit}</Text>
            )}
          </Pressable>
        </>
      )}
      <Pressable onPress={onBack} style={{ marginTop: 20 }}>
        <Text style={styles.link}>{es.common.back}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#f8f6f3" },
  title: { fontSize: 24, fontWeight: "700", color: "#1a3d2e" },
  sub: { fontSize: 15, color: "#4a5c52", marginVertical: 12 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2ddd4",
  },
  ok: { color: "#1a3d2e", marginTop: 16 },
  error: { color: "#b91c1c" },
  btn: {
    backgroundColor: "#1a3d2e",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "600" },
  link: { textAlign: "center", color: "#1a3d2e" },
});
