import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import {
  es,
  buildCategoryFilters,
  fetchCategories,
  fetchCompatQuiz,
  fetchProperties,
  fetchSearchPrefs,
  formatMoonLocation,
  formatPrice,
  getDefaultZoneForCity,
  matchesCityZoneFilter,
  type Category,
  type MoonCitySlug,
  type Property,
} from "@habitus/core";
import type { DiscoverStackParamList } from "../navigation/DiscoverStack";
import { useAuth } from "../context/AuthContext";
import { isHabitusConfigured } from "../lib/supabase";
import { CompatibilityScore } from "../components/CompatibilityScore";
import { CityZoneSelect } from "../components/location/CityZoneSelect";
import { liquidGlassTheme } from "../theme/liquidGlass";

type Nav = NativeStackNavigationProp<DiscoverStackParamList, "DiscoverList">;

export function DiscoverScreen({ navigation }: { navigation: Nav }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState<MoonCitySlug | "">("");
  const [filterZone, setFilterZone] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user?.id) return;
    fetchSearchPrefs(user.id)
      .then((prefs) => {
        if (prefs.city) {
          setFilterCity(prefs.city);
          setFilterZone(prefs.zone ?? "");
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const properties = useMemo(
    () =>
      allProperties.filter((p) =>
        matchesCityZoneFilter(p.city, p.location, filterCity, filterZone),
      ),
    [allProperties, filterCity, filterZone],
  );

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
      setAllProperties(props);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: liquidGlassTheme.animation.duration.normal,
        useNativeDriver: true,
      }).start();
    } finally {
      setLoading(false);
    }
  }, [category, user?.id, fadeAnim]);

  useEffect(() => {
    load();
  }, [load]);

  const renderCategoryChip = useCallback(({ item }: { item: Category }) => {
    const isActive = (!category && item.slug === "all") || category === item.slug;
    return (
      <Pressable
        style={[styles.chip, isActive && styles.chipActive]}
        onPress={() => setCategory(item.slug === "all" ? null : item.slug)}
      >
        {isActive && Platform.OS === "ios" ? (
          <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
        ) : null}
        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
          {item.label}
        </Text>
      </Pressable>
    );
  }, [category]);

  const renderPropertyCard = useCallback(({ item, index }: { item: Property; index: number }) => {
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        <Pressable
          style={styles.card}
          onPress={() =>
            navigation.navigate("PropertyDetail", { slug: item.slug })
          }
        >
          <Image source={{ uri: item.image }} style={styles.image} />

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0, y: 1 }}
            style={styles.imageOverlay}
          />

          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.locationRow}>
                  <MaterialIcons
                    name="location-on"
                    size={14}
                    color={liquidGlassTheme.colors.light.text.tertiary}
                  />
                  <Text style={styles.meta}>{formatMoonLocation(item.city, item.location)}</Text>
                </View>
              </View>

              <View style={styles.priceTag}>
                <Text style={styles.price}>{formatPrice(item.price, item.currencySymbol)}</Text>
              </View>
            </View>

            {item.compatibility != null && (
              <CompatibilityScore
                score={item.compatibility}
                result={item.compatibilityResult}
                label={es.common.compatible}
              />
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  }, [navigation, fadeAnim]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {Platform.OS === "ios" && (
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        )}
        <Text style={styles.title}>{es.nav.discover}</Text>
      </View>

      <View style={styles.locationFilters}>
        <CityZoneSelect
          city={filterCity}
          zone={filterZone || (filterCity ? getDefaultZoneForCity(filterCity) : "")}
          cityOptional
          zoneOptional
          onCityChange={setFilterCity}
          onZoneChange={setFilterZone}
        />
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(c) => c.id}
          showsHorizontalScrollIndicator={false}
          renderItem={renderCategoryChip}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={liquidGlassTheme.colors.brand.primary}
          />
          <Text style={styles.loadingText}>Cargando espacios...</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          renderItem={renderPropertyCard}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay espacios con estos filtros.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: liquidGlassTheme.colors.light.background,
  },
  header: {
    paddingTop: liquidGlassTheme.spacing.xxl,
    paddingHorizontal: liquidGlassTheme.spacing.lg,
    paddingBottom: liquidGlassTheme.spacing.md,
    overflow: "hidden",
  },
  title: {
    fontSize: liquidGlassTheme.typography.fontSize.title1,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  locationFilters: {
    paddingHorizontal: liquidGlassTheme.spacing.lg,
    paddingBottom: liquidGlassTheme.spacing.md,
  },
  filtersContainer: {
    maxHeight: 52,
    marginBottom: liquidGlassTheme.spacing.sm,
  },
  filtersList: {
    paddingHorizontal: liquidGlassTheme.spacing.lg,
    gap: liquidGlassTheme.spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    overflow: "hidden",
  },
  chipActive: {
    borderColor: liquidGlassTheme.colors.brand.primary,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "15",
  },
  chipText: {
    color: liquidGlassTheme.colors.light.text.secondary,
    fontSize: 14,
  },
  chipTextActive: {
    color: liquidGlassTheme.colors.brand.primary,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: liquidGlassTheme.colors.light.text.secondary,
  },
  list: {
    padding: liquidGlassTheme.spacing.lg,
    paddingBottom: 120,
  },
  card: {
    borderRadius: liquidGlassTheme.borderRadius.lg,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.lg,
    backgroundColor: liquidGlassTheme.colors.light.surface,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.md,
  },
  image: {
    width: "100%",
    height: 180,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: "50%",
  },
  cardBody: {
    padding: liquidGlassTheme.spacing.md,
    gap: liquidGlassTheme.spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: liquidGlassTheme.spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  meta: {
    color: liquidGlassTheme.colors.light.text.secondary,
    fontSize: 13,
    flexShrink: 1,
  },
  priceTag: {
    backgroundColor: liquidGlassTheme.colors.brand.primary + "12",
    borderRadius: liquidGlassTheme.borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  price: {
    color: liquidGlassTheme.colors.brand.primary,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    color: liquidGlassTheme.colors.light.text.secondary,
    marginTop: 40,
  },
});
