import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  applicationStatusLabel,
  es,
  fetchApplicationsToReview,
  formatAppliedDate,
  updateApplicationStatus,
  type ReviewApplication,
} from "@habitus/core";
import { useAuth } from "../../context/AuthContext";

const ACTIONS = [
  { status: "interview_scheduled", progress: 50, label: es.panel.interview },
  { status: "final_review", progress: 75, label: es.panel.review },
  { status: "approved", progress: 100, label: es.panel.approve },
  { status: "rejected", progress: 0, label: es.panel.reject },
] as const;

export function ApplicationsScreen() {
  const { user } = useAuth();
  const [apps, setApps] = useState<ReviewApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      setApps(await fetchApplicationsToReview(user.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : es.common.errorLoad);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function act(appId: string, status: string, progress: number) {
    setBusyId(appId);
    const { error: err } = await updateApplicationStatus(appId, status, progress);
    setBusyId(null);
    if (err) setError(err);
    else reload();
  }

  return (
    <View style={styles.root}>
      {loading && <ActivityIndicator style={{ marginTop: 40 }} color="#1a3d2e" />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && apps.length === 0 && (
        <Text style={styles.empty}>{es.panel.noApplications}</Text>
      )}
      <FlatList
        data={apps}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.applicantName}</Text>
            <Text style={styles.meta}>
              {es.panel.space}: {item.listingName}
            </Text>
            {item.appliedAt && (
              <Text style={styles.date}>{formatAppliedDate(item.appliedAt)}</Text>
            )}
            <Text style={styles.status}>{applicationStatusLabel(item.status)}</Text>
            <View style={styles.actions}>
              {ACTIONS.map((a) => (
                <Pressable
                  key={a.status}
                  style={styles.chip}
                  disabled={busyId === item.id}
                  onPress={() => act(item.id, a.status, a.progress)}
                >
                  <Text style={styles.chipText}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f6f3" },
  list: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8e4dc",
  },
  name: { fontSize: 17, fontWeight: "600" },
  meta: { color: "#666", marginTop: 4 },
  date: { fontSize: 12, color: "#888", marginTop: 4 },
  status: { marginTop: 8, fontWeight: "600", color: "#1a3d2e" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  chip: {
    backgroundColor: "#f0f7f4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c5e0d4",
  },
  chipText: { fontSize: 12, color: "#1a3d2e" },
  error: { color: "#b91c1c", padding: 16 },
  empty: { textAlign: "center", color: "#666", marginTop: 40 },
});
