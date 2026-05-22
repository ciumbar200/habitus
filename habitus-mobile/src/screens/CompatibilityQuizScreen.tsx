import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  es,
  fetchCompatQuiz,
  questionsForRole,
  roleNeedsCompatQuiz,
  saveCompatQuiz,
} from "@habitus/core";
import type { CompatQuizAnswers } from "@habitus/core";
import { useAuth } from "../context/AuthContext";

export function CompatibilityQuizScreen() {
  const { user, profile, refreshProfile, markQuizComplete } = useAuth();
  const [answers, setAnswers] = useState<CompatQuizAnswers>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const role = profile?.accountRole;

  useEffect(() => {
    if (!user?.id) return;
    fetchCompatQuiz(user.id)
      .then((q) => {
        setAnswers(q);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [user?.id]);

  if (!loaded || !role || !roleNeedsCompatQuiz(role)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#1a3d2e" />
      </View>
    );
  }

  const questions = questionsForRole(role);

  async function save() {
    if (!user?.id || !role) return;
    setBusy(true);
    setError(null);
    const result = await saveCompatQuiz(user.id, answers, role);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    await refreshProfile();
    markQuizComplete();
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.title}>{es.onboarding.quizTitle}</Text>
      <Text style={styles.sub}>{es.onboarding.quizBody}</Text>
      {questions.map((q) => (
        <View key={q.id} style={styles.block}>
          <Text style={styles.q}>{q.label}</Text>
          {q.options.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.opt, answers[q.id] === opt.value && styles.optOn]}
              onPress={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
            >
              <Text style={styles.optText}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      ))}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.btn} onPress={save} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{es.compat.saveQuiz}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", color: "#1a3d2e" },
  sub: { fontSize: 15, color: "#4a5c52", marginVertical: 12 },
  block: { marginBottom: 20 },
  q: { fontWeight: "600", marginBottom: 8, color: "#1a3d2e" },
  opt: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2ddd4",
    marginBottom: 6,
    backgroundColor: "#fff",
  },
  optOn: { borderColor: "#1a3d2e", backgroundColor: "#f0f7f4" },
  optText: { color: "#333" },
  error: { color: "#b91c1c", marginBottom: 8 },
  btn: {
    backgroundColor: "#1a3d2e",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "600" },
  done: { color: "#1a3d2e" },
});
