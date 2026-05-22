import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { es, fetchAdminStats, type AdminStats } from "@habitus/core";

export function AdminDashboardScreen() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#1a3d2e" />
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? es.common.errorLoad}</Text>
      </View>
    );
  }

  const rows: { key: keyof AdminStats; label: string }[] = [
    { key: "users", label: es.admin.stats.users },
    { key: "listingsPublished", label: es.admin.stats.listingsPublished },
    { key: "listingsDraft", label: es.admin.stats.listingsDraft },
    { key: "openReports", label: es.admin.stats.openReports },
  ];

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.sub}>{es.admin.dashboardSubtitle}</Text>
      {rows.map(({ key, label }) => (
        <View key={key} style={styles.card}>
          <Text style={styles.cardLabel}>{label}</Text>
          <Text style={styles.cardValue}>{stats[key]}</Text>
        </View>
      ))}
      <Text style={styles.note}>
        Moderación completa (usuarios, espacios, reportes) disponible en la web en /admin.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 40, backgroundColor: "#f8f6f3" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  sub: { color: "#666", marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e8e4dc",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: { color: "#666" },
  cardValue: { fontSize: 22, fontWeight: "700", color: "#1a3d2e" },
  note: { marginTop: 16, color: "#666", fontSize: 14, lineHeight: 20 },
  error: { color: "#b91c1c" },
});
