import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { es, fetchManagerMetrics } from "@habitus/core";
import type { PanelStackParamList } from "../../navigation/PanelStack";
import { useAuth } from "../../context/AuthContext";
import { isHabitusConfigured } from "../../lib/supabase";

type Props = NativeStackScreenProps<PanelStackParamList, "PanelHome">;

export function PanelHomeScreen({ navigation }: Props) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    listings: number;
    published: number;
    applicationsPending: number;
  } | null>(null);

  const role = profile?.accountRole;
  const isHost = role === "anfitrion";
  const canManageListings = role === "propietario" || role === "agencia";

  const load = useCallback(async () => {
    if (!isHabitusConfigured() || !user || !role || role === "inquilino") {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const m = await fetchManagerMetrics(user.id, role);
      setStats({
        listings: m.listings,
        published: m.published,
        applicationsPending: m.applicationsPending,
      });
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    load();
  }, [load]);

  if (role === "inquilino") {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>{es.profile.signInHint}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.title}>{es.panel.title}</Text>
      {loading ? (
        <ActivityIndicator color="#1a3d2e" style={{ marginVertical: 24 }} />
      ) : stats ? (
        <View style={styles.statsRow}>
          <Stat label={es.panel.statsListings} value={stats.listings} />
          <Stat label={es.panel.statsPublished} value={stats.published} />
          <Stat label={es.panel.statsApplications} value={stats.applicationsPending} />
        </View>
      ) : null}

      {(canManageListings || isHost) && (
        <MenuBtn
          label={
            isHost
              ? es.panel.hostSpaces
              : role === "agencia"
                ? es.panel.portfolio
                : es.panel.myListings
          }
          onPress={() => navigation.getParent()?.navigate("Spaces")}
        />
      )}
      <MenuBtn
        label={es.panel.applications}
        onPress={() => navigation.getParent()?.navigate("Applications")}
      />
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.menuBtn} onPress={onPress}>
      <Text style={styles.menuText}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "700", color: "#1a3d2e", marginBottom: 16 },
  muted: { color: "#666", textAlign: "center" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  stat: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e8e4dc",
    alignItems: "center",
  },
  statVal: { fontSize: 22, fontWeight: "700", color: "#1a3d2e" },
  statLabel: { fontSize: 11, color: "#666", marginTop: 4, textAlign: "center" },
  menuBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e8e4dc",
  },
  menuText: { fontSize: 16, fontWeight: "600", color: "#1a3d2e" },
  chevron: { fontSize: 22, color: "#888" },
});
