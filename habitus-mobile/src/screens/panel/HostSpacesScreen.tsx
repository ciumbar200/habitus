import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { es, fetchHostListings, formatPrice, listingStatusLabel } from "@habitus/core";
import type { SpacesStackParamList } from "../../navigation/SpacesStack";
import { useAuth } from "../../context/AuthContext";

type Props = NativeStackScreenProps<SpacesStackParamList, "SpacesHome">;

export function HostSpacesScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [listings, setListings] = useState<Awaited<ReturnType<typeof fetchHostListings>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    fetchHostListings(user.id)
      .then(setListings)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  return (
    <View style={styles.root}>
      <Pressable
        style={styles.createBtn}
        onPress={() => navigation.navigate("ListingEditor", {})}
      >
        <Text style={styles.createBtnText}>{es.common.publish}</Text>
      </Pressable>
      {loading && <ActivityIndicator style={{ marginTop: 40 }} color="#1a3d2e" />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && listings.length === 0 && (
        <Text style={styles.empty}>{es.panel.noHostSpaces}</Text>
      )}
      <FlatList
        data={listings}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("ListingEditor", { listingId: item.id })}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.location}</Text>
            <Text style={styles.price}>
              {formatPrice(item.priceMonthly, item.currency)} / {es.common.perMonth}
            </Text>
            <Text style={styles.badge}>{listingStatusLabel(item.status)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f6f3" },
  createBtn: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: "#1a3d2e",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  createBtnText: { color: "#fff", fontWeight: "600" },
  list: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e8e4dc",
  },
  name: { fontSize: 17, fontWeight: "600" },
  meta: { color: "#666", marginTop: 4 },
  price: { color: "#2d6a4f", marginTop: 4 },
  badge: { marginTop: 8, fontSize: 12 },
  error: { color: "#b91c1c", padding: 16 },
  empty: { textAlign: "center", color: "#666", marginTop: 40, padding: 16 },
});
