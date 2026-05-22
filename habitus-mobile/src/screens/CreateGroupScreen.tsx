import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { createGroup, es } from "@habitus/core";
import type { MainStackParamList } from "../navigation/MainStack";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<MainStackParamList, "CreateGroup">;

export function CreateGroupScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [city, setCity] = useState("Barcelona");
  const [targetMembers, setTargetMembers] = useState("3");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!user?.id || !name.trim()) return;
    setBusy(true);
    setError(null);
    const { group, error: err } = await createGroup(user.id, {
      name: name.trim(),
      city,
      targetMembers: Number(targetMembers) || 3,
      notes: notes.trim() || undefined,
    });
    setBusy(false);
    if (err || !group) {
      setError(err ?? es.common.errorLoad);
      return;
    }
    navigation.replace("GroupDetail", { slug: group.slug });
  }

  return (
    <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
      <Text style={styles.sub}>{es.groups.subtitle}</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Field label={es.groups.name}>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
      </Field>
      <Field label={es.groups.city}>
        <TextInput style={styles.input} value={city} onChangeText={setCity} />
      </Field>
      <Field label={es.groups.targetMembers}>
        <TextInput
          style={styles.input}
          value={targetMembers}
          onChangeText={setTargetMembers}
          keyboardType="number-pad"
        />
      </Field>
      <Field label={es.groups.notes}>
        <TextInput
          style={[styles.input, styles.area]}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </Field>
      <Pressable style={styles.btn} onPress={handleSubmit} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{es.groups.create}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 40, backgroundColor: "#f8f6f3" },
  sub: { color: "#666", marginBottom: 16 },
  field: { marginBottom: 14 },
  label: { fontWeight: "600", marginBottom: 6, color: "#1a3d2e" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2ddd4",
    borderRadius: 8,
    padding: 12,
  },
  area: { minHeight: 80, textAlignVertical: "top" },
  btn: {
    backgroundColor: "#1a3d2e",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "600" },
  error: { color: "#b91c1c", marginBottom: 12 },
});
