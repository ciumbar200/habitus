import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  Platform,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { es, fetchCommunityEvents } from "@habitus/core";
import type { CommunityEvent } from "@habitus/core";
import { isHabitusConfigured } from "../lib/supabase";
import { liquidGlassTheme } from "../theme/liquidGlass";

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

  const renderEvent = useCallback(({ item, index }: { item: CommunityEvent; index: number }) => {
    const fadeAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(20);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: liquidGlassTheme.animation.duration.normal,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: liquidGlassTheme.animation.duration.normal,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();

    const eventDate = new Date(item.startsAt);
    const formattedDate = eventDate.toLocaleString("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View style={styles.card}>
          {item.coverImageUrl ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.coverImageUrl }} style={styles.cover} />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.5)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.imageOverlay}
              />
            </View>
          ) : null}

          <View style={styles.cardContent}>
            <View style={styles.cityBadge}>
              <MaterialIcons
                name="location-on"
                size={14}
                color={liquidGlassTheme.colors.brand.primary}
              />
              <Text style={styles.city}>{item.city}</Text>
            </View>

            <Text style={styles.eventTitle}>{item.title}</Text>

            <Text style={styles.desc} numberOfLines={3}>
              {item.description}
            </Text>

            <View style={styles.footerRow}>
              <View style={styles.dateBadge}>
                <MaterialIcons
                  name="event"
                  size={14}
                  color={liquidGlassTheme.colors.light.text.tertiary}
                />
                <Text style={styles.date}>{formattedDate}</Text>
              </View>
              {item.location && (
                <View style={styles.locationBadge}>
                  <MaterialIcons
                    name="place"
                    size={14}
                    color={liquidGlassTheme.colors.light.text.tertiary}
                  />
                  <Text style={styles.location}>{item.location}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }, []);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        {Platform.OS === "ios" && (
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.headerContent}>
          <MaterialIcons
            name="diversity-3"
            size={32}
            color={liquidGlassTheme.colors.brand.primary}
          />
          <View style={styles.headerText}>
            <Text style={styles.title}>{es.community.title}</Text>
            <Text style={styles.sub}>{es.community.subtitle}</Text>
          </View>
        </View>
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={liquidGlassTheme.colors.brand.primary}
          />
          <Text style={styles.loadingText}>Cargando eventos...</Text>
        </View>
      )}

      {/* Error state */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons
            name="error-outline"
            size={48}
            color={liquidGlassTheme.colors.brand.error}
          />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      {/* Empty state */}
      {!loading && events.length === 0 && !error && (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="event-busy"
            size={48}
            color={liquidGlassTheme.colors.light.text.tertiary}
          />
          <Text style={styles.empty}>{es.community.empty}</Text>
        </View>
      )}

      {/* Events list */}
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        renderItem={renderEvent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: liquidGlassTheme.colors.light.background,
  },
  header: {
    paddingHorizontal: liquidGlassTheme.spacing.lg,
    paddingTop: liquidGlassTheme.spacing.lg + 8,
    paddingBottom: liquidGlassTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.glass.navigation,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: liquidGlassTheme.typography.fontSize.title2,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  sub: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.secondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.md,
  },
  loadingText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.md,
    padding: liquidGlassTheme.spacing.xl,
  },
  error: {
    color: liquidGlassTheme.colors.brand.error,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.md,
    padding: liquidGlassTheme.spacing.xl,
  },
  empty: {
    textAlign: "center",
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
  list: {
    padding: liquidGlassTheme.spacing.lg,
    paddingBottom: liquidGlassTheme.spacing.xxl,
  },
  card: {
    backgroundColor: liquidGlassTheme.colors.light.glass.card,
    borderRadius: liquidGlassTheme.borderRadius.lg,
    marginBottom: liquidGlassTheme.spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.md,
  },
  imageContainer: {
    position: "relative",
  },
  cover: {
    width: "100%",
    height: 160,
  },
  imageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 160,
  },
  cardContent: {
    padding: liquidGlassTheme.spacing.md,
  },
  cityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.xs,
    alignSelf: "flex-start",
    backgroundColor: liquidGlassTheme.colors.brand.primary + "15",
    paddingHorizontal: liquidGlassTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: liquidGlassTheme.borderRadius.sm,
    marginBottom: liquidGlassTheme.spacing.sm,
  },
  city: {
    fontSize: liquidGlassTheme.typography.fontSize.caption1,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.brand.primary,
  },
  eventTitle: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.primary,
    marginBottom: liquidGlassTheme.spacing.xs,
  },
  desc: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.secondary,
    lineHeight: liquidGlassTheme.typography.lineHeight.normal,
    marginBottom: liquidGlassTheme.spacing.md,
  },
  footerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: liquidGlassTheme.spacing.md,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.xs,
  },
  date: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.xs,
  },
  location: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
});
