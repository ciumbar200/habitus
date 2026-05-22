import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { es, fetchCommunityEvents } from "@habitus/core";
import type { CommunityEvent } from "@habitus/core";
import { isHabitusConfigured } from "../lib/supabase";

export function CommunityScreen() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isHabitusConfigured()) {
      setError(es.discover.configError);
      setLoading(false);
      return;
    }
    fetchCommunityEvents()
      .then(setEvents)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{es.community.title}</Text>
      <Text style={styles.sub}>{es.community.subtitle}</Text>
      {loading && <ActivityIndicator style={{ marginTop: 32 }} color="#1a3d2e" />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && events.length === 0 && (
        <Text style={styles.empty}>{es.community.empty}</Text>
      )}
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.coverImageUrl ? (
              <Image source={{ uri: item.coverImageUrl }} style={styles.cover} />
            ) : null}
            <Text style={styles.city}>{item.city}</Text>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.desc} numberOfLines={3}>
              {item.description}
            </Text>
            <Text style={styles.date}>
              {new Date(item.startsAt).toLocaleString("es-ES", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {item.location ? ` · ${item.location}` : ""}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f6f3" },
  title: { fontSize: 22, fontWeight: "700", padding: 16, paddingBottom: 4, color: "#1a3d2e" },
  sub: { fontSize: 14, color: "#4a5c52", paddingHorizontal: 16, marginBottom: 8 },
  list: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e8e4dc",
  },
  cover: { width: "100%", height: 140 },
  city: { fontSize: 12, color: "#2d6a4f", fontWeight: "600", padding: 12, paddingBottom: 0 },
  eventTitle: { fontSize: 17, fontWeight: "600", paddingHorizontal: 12, color: "#1a3d2e" },
  desc: { fontSize: 14, color: "#666", padding: 12, paddingTop: 6 },
  date: { fontSize: 12, color: "#888", paddingHorizontal: 12, paddingBottom: 12 },
  error: { color: "#b91c1c", padding: 16 },
  empty: { textAlign: "center", color: "#666", marginTop: 40, padding: 16 },
});
