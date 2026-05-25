import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { es, fetchMyGroups, type LivingGroup } from "@habitus/core";
import type { MainStackParamList } from "../navigation/MainStack";
import { useAuth } from "../context/AuthContext";
import { liquidGlassTheme } from "../theme/liquidGlass";

type Props = NativeStackScreenProps<MainStackParamList, "Groups">;

export function GroupsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<LivingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMyGroups(user.id)
      .then(setGroups)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, user?.id]);

  const renderGroup = useCallback(({ item }: { item: LivingGroup }) => {
    const memberPercent = (item.memberCount / item.targetMembers) * 100;
    const isAlmostFull = memberPercent >= 80;
    const isFull = memberPercent >= 100;

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("GroupDetail", { slug: item.slug })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.locationRow}>
              <MaterialIcons
                name="location-on"
                size={14}
                color={liquidGlassTheme.colors.light.text.tertiary}
              />
              <Text style={styles.meta}>{item.city}</Text>
            </View>
          </View>
          <View style={[
            styles.statusBadge,
            isFull && styles.statusBadgeFull,
            isAlmostFull && !isFull && styles.statusBadgeAlmostFull
          ]}>
            <Text style={[
              styles.statusText,
              (isFull || isAlmostFull) && styles.statusTextUrgent
            ]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(memberPercent, 100)}%` },
                isFull && styles.progressFillFull,
                isAlmostFull && !isFull && styles.progressFillAlmostFull,
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {item.memberCount}/{item.targetMembers} {es.groups.member}
          </Text>
        </View>
      </Pressable>
    );
  }, [navigation]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        {Platform.OS === "ios" && (
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{es.groups.title}</Text>
            <Text style={styles.sub}>{es.groups.subtitle}</Text>
          </View>
        </View>
      </View>

      {/* Create button */}
      <View style={styles.createBtnContainer}>
        <Pressable
          style={styles.createBtn}
          onPress={() => navigation.navigate("CreateGroup")}
        >
          <LinearGradient
            colors={liquidGlassTheme.colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <MaterialIcons
            name="group-add"
            size={20}
            color={liquidGlassTheme.colors.white}
          />
          <Text style={styles.createBtnText}>{es.groups.create}</Text>
        </Pressable>
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={liquidGlassTheme.colors.brand.primary}
          />
          <Text style={styles.loadingText}>Cargando grupos...</Text>
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
      {!loading && groups.length === 0 && !error && (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="groups"
            size={48}
            color={liquidGlassTheme.colors.light.text.tertiary}
          />
          <Text style={styles.empty}>{es.groups.empty}</Text>
        </View>
      )}

      {/* Groups list */}
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        renderItem={renderGroup}
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
    paddingBottom: liquidGlassTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.glass.navigation,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
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
  createBtnContainer: {
    paddingHorizontal: liquidGlassTheme.spacing.lg,
    paddingVertical: liquidGlassTheme.spacing.md,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.button,
    paddingVertical: liquidGlassTheme.spacing.md,
    overflow: "hidden",
    ...liquidGlassTheme.shadows.md,
  },
  createBtnText: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.white,
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
    padding: liquidGlassTheme.spacing.md,
    marginBottom: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: liquidGlassTheme.spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  name: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.primary,
    marginBottom: liquidGlassTheme.spacing.xs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  meta: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
  statusBadge: {
    paddingHorizontal: liquidGlassTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: liquidGlassTheme.borderRadius.sm,
    backgroundColor: liquidGlassTheme.colors.brand.success + "15",
  },
  statusBadgeFull: {
    backgroundColor: liquidGlassTheme.colors.brand.error + "15",
  },
  statusBadgeAlmostFull: {
    backgroundColor: liquidGlassTheme.colors.brand.warning + "15",
  },
  statusText: {
    fontSize: liquidGlassTheme.typography.fontSize.caption2,
    fontWeight: liquidGlassTheme.typography.fontWeight.medium,
    color: liquidGlassTheme.colors.brand.success,
    textTransform: "capitalize",
  },
  statusTextUrgent: {
    color: liquidGlassTheme.colors.brand.error,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: liquidGlassTheme.colors.light.surfaceVariant,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: liquidGlassTheme.colors.brand.success,
  },
  progressFillFull: {
    backgroundColor: liquidGlassTheme.colors.brand.error,
  },
  progressFillAlmostFull: {
    backgroundColor: liquidGlassTheme.colors.brand.warning,
  },
  progressText: {
    fontSize: liquidGlassTheme.typography.fontSize.caption1,
    fontWeight: liquidGlassTheme.typography.fontWeight.medium,
    color: liquidGlassTheme.colors.light.text.secondary,
  },
});
