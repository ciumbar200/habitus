import { useState } from "react";
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
import {
  ageFromBirthDate,
  completeOnboarding,
  es,
  isValidOnboardingAge,
} from "@habitus/core";
import { useAuth } from "../context/AuthContext";

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
      <Text style={styles.title}>{es.onboarding.basicsTitle}</Text>
      <Text style={styles.sub}>{es.onboarding.basicsSubtitle}</Text>
      <TextInput
        style={styles.input}
        placeholder={es.onboarding.fullNamePlaceholder}
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
      />
      <Text style={styles.label}>{es.onboarding.birthDate}</Text>
      <TextInput
        style={styles.input}
        placeholder="1995-06-15"
        value={birthDate}
        onChangeText={setBirthDate}
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
      />
      <Text style={styles.hint}>
        {es.onboarding.ageHint}
        {agePreview != null ? ` (${agePreview} años)` : ""}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.btn} onPress={submit} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{es.onboarding.saveAndContinue}</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f6f3", padding: 24, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "700", color: "#1a3d2e" },
  sub: { fontSize: 15, color: "#4a5c52", marginTop: 8, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: "#1a3d2e", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2ddd4",
  },
  hint: { fontSize: 13, color: "#666", marginBottom: 16 },
  error: { color: "#b91c1c", marginBottom: 8 },
  btn: {
    backgroundColor: "#1a3d2e",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
