import { useEffect, useState, type ReactNode } from "react";
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
import {
  computeFairSplit,
  es,
  fetchGroupBySlug,
  fetchGroupMembers,
  formatPrice,
  setGroupStatus,
  type LivingGroup,
  type LivingGroupMember,
} from "@habitus/core";
import type { MainStackParamList } from "../navigation/MainStack";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<MainStackParamList, "GroupDetail">;

export function GroupDetailScreen({ route }: Props) {
  const { slug } = route.params;
  const { user } = useAuth();
  const [group, setGroup] = useState<LivingGroup | null>(null);
  const [members, setMembers] = useState<LivingGroupMember[]>([]);
  const [totalRent, setTotalRent] = useState("1780");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchGroupBySlug(slug)
      .then(async (g) => {
        if (!g) {
          setError(es.groups.empty);
          return;
        }
        setGroup(g);
        setMembers(await fetchGroupMembers(g.id));
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [slug]);

  const split = computeFairSplit(
    Number(totalRent) || 0,
    members.map((m, i) => ({
      profileId: m.profileId,
      displayName: m.displayName,
      roomLabel: m.roomLabel ?? undefined,
      weight: members.length - i,
    })),
  );

  async function markReady() {
    if (!group) return;
    setBusy(true);
    const err = await setGroupStatus(group.id, "ready");
    if (err) setError(err);
    else setGroup({ ...group, status: "ready" });
    setBusy(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#1a3d2e" />
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? es.common.errorLoad}</Text>
      </View>
    );
  }

  const isCreator = user?.id === group.creatorId;

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.title}>{group.name}</Text>
      <Text style={styles.meta}>
        {group.city} · {group.memberCount}/{group.targetMembers} · {group.status}
      </Text>
      {group.notes ? <Text style={styles.notes}>{group.notes}</Text> : null}

      <Text style={styles.section}>{es.groups.members}</Text>
      {members.map((m) => (
        <View key={m.profileId} style={styles.memberRow}>
          <Text style={styles.memberName}>{m.displayName}</Text>
          {m.roomLabel ? <Text style={styles.memberMeta}>{m.roomLabel}</Text> : null}
        </View>
      ))}

      <Text style={styles.section}>{es.groups.fairSplit}</Text>
      <Field label={es.groups.totalRent}>
        <TextInput
          style={styles.input}
          value={totalRent}
          onChangeText={setTotalRent}
          keyboardType="numeric"
        />
      </Field>
      {split.map((row) => (
        <View key={row.profileId} style={styles.splitRow}>
          <Text>{row.displayName}</Text>
          <Text style={styles.splitAmount}>{formatPrice(row.amount, "EUR")}</Text>
        </View>
      ))}

      {isCreator && group.status !== "ready" && (
        <Pressable style={styles.btn} onPress={markReady} disabled={busy}>
          <Text style={styles.btnText}>{es.groups.markReady}</Text>
        </Pressable>
      )}
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
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#1a3d2e" },
  meta: { color: "#666", marginTop: 6 },
  notes: { marginTop: 12, color: "#444" },
  section: { fontSize: 17, fontWeight: "600", color: "#1a3d2e", marginTop: 24, marginBottom: 8 },
  memberRow: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e8e4dc",
  },
  memberName: { fontWeight: "600" },
  memberMeta: { color: "#666", fontSize: 13, marginTop: 2 },
  field: { marginBottom: 12 },
  label: { fontWeight: "600", marginBottom: 6, color: "#1a3d2e" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2ddd4",
    borderRadius: 8,
    padding: 12,
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  splitAmount: { fontWeight: "600", color: "#2d6a4f" },
  btn: {
    marginTop: 24,
    backgroundColor: "#1a3d2e",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
  error: { color: "#b91c1c" },
});
