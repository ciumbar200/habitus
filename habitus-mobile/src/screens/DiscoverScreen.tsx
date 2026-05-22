import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  es,
  buildCategoryFilters,
  fetchCategories,
  fetchCompatQuiz,
  fetchProperties,
  formatPrice,
  type Category,
  type Property,
} from "@habitus/core";
import type { DiscoverStackParamList } from "../navigation/DiscoverStack";
import { useAuth } from "../context/AuthContext";
import { isHabitusConfigured } from "../lib/supabase";
import { CompatibilityScore } from "../components/CompatibilityScore";

type Nav = NativeStackNavigationProp<DiscoverStackParamList, "DiscoverList">;

export function DiscoverScreen({ navigation }: { navigation: Nav }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isHabitusConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const quiz = user?.id ? await fetchCompatQuiz(user.id) : undefined;
      const catSlug = category && category !== "all" ? category : undefined;
      const [cats, props] = await Promise.all([
        fetchCategories(),
        fetchProperties(catSlug, quiz),
      ]);
      setCategories(buildCategoryFilters(cats, es.discover.allCategories));
      setProperties(props);
    } finally {
      setLoading(false);
    }
  }, [category, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{es.nav.discover}</Text>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.chip,
              ((!category && item.slug === "all") || category === item.slug) && styles.chipActive,
            ]}
            onPress={() => setCategory(item.slug === "all" ? null : item.slug)}
          >
            <Text
              style={
                (!category && item.slug === "all") || category === item.slug
                  ? styles.chipTextActive
                  : styles.chipText
              }
            >
              {item.label}
            </Text>
          </Pressable>
        )}
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a3d2e" />
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate("PropertyDetail", { slug: item.slug })
              }
            >
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={styles.cardBody}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.location}</Text>
                <Text style={styles.price}>{formatPrice(item.price, item.currencySymbol)}</Text>
                {item.compatibility != null && (
                  <CompatibilityScore
                    score={item.compatibility}
                    result={item.compatibilityResult}
                    label={es.common.compatible}
                  />
                )}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>{es.discover.emptyCategory}</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f6f3" },
  title: { fontSize: 22, fontWeight: "700", padding: 16, color: "#1a3d2e" },
  filters: { maxHeight: 48, paddingHorizontal: 12, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2ddd4",
  },
  chipActive: { backgroundColor: "#1a3d2e", borderColor: "#1a3d2e" },
  chipText: { color: "#333" },
  chipTextActive: { color: "#fff" },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8e4dc",
  },
  image: { width: "100%", height: 160 },
  cardBody: { padding: 12 },
  name: { fontSize: 17, fontWeight: "600", color: "#1a1a1a" },
  meta: { color: "#666", marginTop: 4 },
  price: { color: "#1a3d2e", fontWeight: "700", marginTop: 6 },
  compat: { color: "#2d6a4f", fontSize: 13, marginTop: 4 },
  empty: { textAlign: "center", color: "#666", marginTop: 40 },
});
