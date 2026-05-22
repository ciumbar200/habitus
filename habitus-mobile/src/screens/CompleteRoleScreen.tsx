import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ACCOUNT_ROLES, es } from "@habitus/core";
import type { AccountRoleSlug } from "@habitus/core";
import { useAuth } from "../context/AuthContext";

export function CompleteRoleScreen() {
  const { updateAccountRole } = useAuth();
  const [role, setRole] = useState<AccountRoleSlug | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.title}>Completa tu perfil</Text>
      <Text style={styles.hint}>{es.access.accountRoleHint}</Text>
      {ACCOUNT_ROLES.map((r) => (
        <Pressable
          key={r.slug}
          style={[styles.card, role === r.slug && styles.cardActive]}
          onPress={() => setRole(r.slug)}
        >
          <Text style={styles.cardLabel}>{r.label}</Text>
          <Text style={styles.cardDesc}>{r.description}</Text>
        </Pressable>
      ))}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.btn} onPress={save} disabled={busy || !role}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{es.access.continue}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 24, paddingTop: 48 },
  title: { fontSize: 24, fontWeight: "700", color: "#1a3d2e", marginBottom: 8 },
  hint: { fontSize: 15, color: "#4a5c52", marginBottom: 20 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2ddd4",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  cardActive: { borderColor: "#1a3d2e", backgroundColor: "#f0f7f4" },
  cardLabel: { fontSize: 16, fontWeight: "600", color: "#1a3d2e" },
  cardDesc: { fontSize: 13, color: "#4a5c52", marginTop: 4 },
  error: { color: "#b91c1c", marginVertical: 8 },
  btn: {
    backgroundColor: "#1a3d2e",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
