import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  es,
  fetchMyListings,
  formatPrice,
  listingStatusLabel,
  type OwnerListing,
} from "@habitus/core";
import type { SpacesStackParamList } from "../../navigation/SpacesStack";
import { useAuth } from "../../context/AuthContext";

type Props = NativeStackScreenProps<SpacesStackParamList, "SpacesHome">;

export function MyListingsScreen({ navigation }: Props) {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<OwnerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchMyListings(user.id)
      .then(setListings)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const title = profile?.accountRole === "agencia" ? es.panel.portfolio : es.panel.myListings;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => navigation.navigate("ListingEditor", {})}
        >
          <Text style={styles.addText}>+ {es.panel.newListing}</Text>
        </Pressable>
      </View>
      {loading && <ActivityIndicator style={{ marginTop: 40 }} color="#1a3d2e" />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && listings.length === 0 && (
        <Text style={styles.empty}>{es.panel.noListings}</Text>
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
  header: { padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: "700", color: "#1a3d2e" },
  addBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#1a3d2e",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addText: { color: "#fff", fontWeight: "600" },
  list: { padding: 16, paddingTop: 0 },
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
  price: { color: "#2d6a4f", marginTop: 4, fontWeight: "600" },
  badge: { marginTop: 8, fontSize: 12, color: "#1a3d2e" },
  error: { color: "#b91c1c", padding: 16 },
  empty: { textAlign: "center", color: "#666", marginTop: 40, padding: 16 },
});
