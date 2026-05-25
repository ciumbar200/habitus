import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  acceptGroupMember,
  buildGroupInviteUrl,
  computeFairSplit,
  computeMemberBalances,
  es,
  expensesInMonth,
  sumExpensesCents,
  fetchGroupBySlug,
  fetchGroupExpenses,
  fetchGroupMembers,
  fetchPendingGroupRequests,
  formatPrice,
  isGroupFormed,
  rejectGroupMember,
  requestJoinGroup,
  setGroupStatus,
  shareGroupInviteText,
  type LivingGroup,
  type LivingGroupMember,
  type HouseholdExpense,
} from "@habitus/core";
import type { MainStackParamList } from "../navigation/MainStack";
import { useAuth } from "../context/AuthContext";
import { liquidGlassTheme } from "../theme/liquidGlass";

type Props = NativeStackScreenProps<MainStackParamList, "GroupDetail">;

export function GroupDetailScreen({ route, navigation }: Props) {
  const { slug } = route.params;
  const { user } = useAuth();
  const [group, setGroup] = useState<LivingGroup | null>(null);
  const [members, setMembers] = useState<LivingGroupMember[]>([]);
  const [pending, setPending] = useState<LivingGroupMember[]>([]);
  const [totalRent, setTotalRent] = useState("1780");
  const [expenses, setExpenses] = useState<HouseholdExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current[0];

  const load = useCallback(async () => {
    const g = await fetchGroupBySlug(slug);
    if (!g) {
      setError(es.groups.empty);
      setGroup(null);
      return;
    }
    setGroup(g);
    const all = await fetchGroupMembers(g.id);
    setMembers(all.filter((m) => m.isConfirmed));
    setPending(await fetchPendingGroupRequests(g.id));
    fetchGroupExpenses(g.id)
      .then(setExpenses)
      .catch(() => setExpenses([]));
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: liquidGlassTheme.animation.duration.normal,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const myMembership = [...members, ...pending].find((m) => m.profileId === user?.id);
  const isLead = myMembership?.groupRole === "lead" || group?.creatorId === user?.id;
  const isConfirmedMember = myMembership?.isConfirmed === true;
  const hasPendingRequest = pending.some((m) => m.profileId === user?.id);
  const canRequestJoin =
    !!user &&
    !!group &&
    group.status === "forming" &&
    !isConfirmedMember &&
    !hasPendingRequest &&
    group.memberCount < group.targetMembers;

  const split = computeFairSplit(
    Number(totalRent) || 0,
    members.map((m, i) => ({
      profileId: m.profileId,
      displayName: m.displayName,
      roomLabel: m.roomLabel ?? undefined,
      weight: members.length - i,
    })),
  );

  const yearMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = useMemo(() => expensesInMonth(expenses, yearMonth), [expenses, yearMonth]);
  const monthTotal = sumExpensesCents(monthExpenses);
  const myBalance = useMemo(
    () =>
      computeMemberBalances(
        expenses,
        members.map((m) => ({ profileId: m.profileId, displayName: m.displayName })),
      ).find((b) => b.profileId === user?.id),
    [expenses, members, user?.id],
  );

  async function handleShare() {
    if (!group) return;
    const url = buildGroupInviteUrl(group.slug);
    const message = shareGroupInviteText(group.name, url);
    try {
      await Share.share({ message, url, title: group.name });
    } catch {
      await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <LinearGradient
          colors={[
            liquidGlassTheme.colors.gradients.primary[0],
            liquidGlassTheme.colors.light.background,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={liquidGlassTheme.colors.brand.primary} />
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? es.common.errorLoad}</Text>
      </View>
    );
  }

  const formed = isGroupFormed(group);
  const memberPercent = (group.memberCount / group.targetMembers) * 100;

  return (
    <View style={styles.root}>
      {/* Background gradient */}
      <LinearGradient
        colors={[
          liquidGlassTheme.colors.gradients.primary[0],
          liquidGlassTheme.colors.light.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        {Platform.OS === "ios" && (
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        )}
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
          <View style={styles.statusBadge}>
            <MaterialIcons
              name={formed ? "check-circle" : "pending"}
              size={20}
              color={formed ? liquidGlassTheme.colors.brand.success : liquidGlassTheme.colors.brand.warning}
            />
            <Text style={[styles.statusText, formed && styles.statusTextSuccess]}>
              {es.groups.status[group.status]}
            </Text>
          </View>
          <Text style={styles.title}>{group.name}</Text>
          <View style={styles.metaRow}>
            <MaterialIcons
              name="location-on"
              size={16}
              color={liquidGlassTheme.colors.light.text.tertiary}
            />
            <Text style={styles.meta}>{group.city}</Text>
            <Text style={styles.metaSeparator}>·</Text>
            <Text style={styles.meta}>
              {group.memberCount}/{group.targetMembers} {es.groups.member}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(memberPercent, 100)}%` },
                  memberPercent >= 100 && styles.progressFillFull,
                ]}
              />
            </View>
          </View>

          {formed && (
            <View style={styles.formedBadge}>
              <MaterialIcons
                name="verified"
                size={16}
                color={liquidGlassTheme.colors.brand.success}
              />
              <Text style={styles.formedText}>{es.groups.groupFormed}</Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {group.notes ? (
            <View style={styles.notesCard}>
              <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.notesContent}>
                <MaterialIcons
                  name="description"
                  size={18}
                  color={liquidGlassTheme.colors.light.text.tertiary}
                />
                <Text style={styles.notes}>{group.notes}</Text>
              </View>
            </View>
          ) : null}

          {/* Action buttons */}
          <View style={styles.actionsContainer}>
            {(isLead || isConfirmedMember) && (
              <Pressable style={styles.actionBtn} onPress={handleShare}>
                <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
                <MaterialIcons
                  name="share"
                  size={20}
                  color={liquidGlassTheme.colors.brand.primary}
                />
                <Text style={styles.actionBtnText}>{es.groups.shareGroup}</Text>
              </Pressable>
            )}

            {canRequestJoin && (
              <Pressable
                style={styles.primaryBtn}
                disabled={busy === "join"}
                onPress={async () => {
                  setBusy("join");
                  const err = await requestJoinGroup(group.id);
                  if (err) setError(err);
                  else await load();
                  setBusy(null);
                }}
              >
                <LinearGradient
                  colors={liquidGlassTheme.colors.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                {busy === "join" ? (
                  <ActivityIndicator color={liquidGlassTheme.colors.white} />
                ) : (
                  <>
                    <MaterialIcons
                      name="person-add"
                      size={20}
                      color={liquidGlassTheme.colors.white}
                    />
                    <Text style={styles.primaryBtnText}>{es.groups.requestJoin}</Text>
                  </>
                )}
              </Pressable>
            )}

            {hasPendingRequest && !isConfirmedMember && (
              <View style={styles.pendingCard}>
                <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
                <MaterialIcons
                  name="schedule"
                  size={20}
                  color={liquidGlassTheme.colors.brand.warning}
                />
                <Text style={styles.pending}>{es.groups.requestPending}</Text>
              </View>
            )}
          </View>

          {/* Pending requests */}
          {isLead && pending.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{es.groups.pendingRequests}</Text>
              {pending.map((m) => (
                <View key={m.profileId} style={styles.memberCard}>
                  <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
                  <View style={styles.memberCardContent}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {m.displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.memberName}>{m.displayName}</Text>
                    <View style={styles.memberActions}>
                      <Pressable
                        style={styles.acceptBtn}
                        onPress={async () => {
                          setBusy(m.profileId);
                          await acceptGroupMember(group.id, m.profileId);
                          const refreshed = await fetchGroupBySlug(group.slug);
                          if (refreshed) setGroup(refreshed);
                          await load();
                          setBusy(null);
                        }}
                      >
                        <MaterialIcons
                          name="check"
                          size={18}
                          color={liquidGlassTheme.colors.white}
                        />
                      </Pressable>
                      <Pressable
                        style={styles.denyBtn}
                        onPress={async () => {
                          await rejectGroupMember(group.id, m.profileId);
                          await load();
                        }}
                      >
                        <MaterialIcons
                          name="close"
                          size={18}
                          color={liquidGlassTheme.colors.brand.error}
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Members */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{es.groups.members}</Text>
            {members.map((m) => (
              <View key={m.profileId} style={styles.memberCard}>
                <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.memberCardContent}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {m.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{m.displayName}</Text>
                    {m.roomLabel ? (
                      <Text style={styles.memberMeta}>{m.roomLabel}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Fair split */}
          {isConfirmedMember && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{es.groups.fairSplit}</Text>
              <View style={styles.rentCard}>
                <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.rentCardContent}>
                  <Text style={styles.rentLabel}>{es.groups.totalRent}</Text>
                  <View style={styles.rentInputContainer}>
                    <TextInput
                      style={styles.rentInput}
                      value={totalRent}
                      onChangeText={setTotalRent}
                      keyboardType="numeric"
                    />
                    <Text style={styles.rentCurrency}>€</Text>
                  </View>
                </View>
              </View>
              {split.map((row) => (
                <View key={row.profileId} style={styles.splitRow}>
                  <View style={styles.splitAvatar}>
                    <Text style={styles.splitAvatarText}>
                      {row.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.splitName}>{row.displayName}</Text>
                  <Text style={styles.splitAmount}>{formatPrice(row.amount, "EUR")}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Expenses card */}
          {isConfirmedMember && (
            <Pressable
              style={styles.expensesCard}
              onPress={() =>
                navigation.navigate("GroupExpenses", {
                  groupId: group.id,
                  groupName: group.name,
                  slug: group.slug,
                })
              }
            >
              <LinearGradient
                colors={["#0c0a09", "#1c1917"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.expensesCardContent}>
                <View style={styles.expensesCardHeader}>
                  <MaterialIcons
                    name="receipt-long"
                    size={24}
                    color={liquidGlassTheme.colors.brand.accent}
                  />
                  <Text style={styles.expensesCardTitle}>{es.expenses.title}</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={liquidGlassTheme.colors.brand.accent}
                  />
                </View>
                <View style={styles.expensesStats}>
                  <View style={styles.expensesStat}>
                    <Text style={styles.expensesStatLabel}>{es.expenses.totalMonth}</Text>
                    <Text style={styles.expensesStatValue}>
                      {formatPrice(monthTotal / 100, "EUR")}
                    </Text>
                  </View>
                  {myBalance && (
                    <View style={styles.expensesStat}>
                      <Text style={styles.expensesStatLabel}>{es.expenses.yourBalance}</Text>
                      <Text
                        style={[
                          styles.expensesStatValue,
                          myBalance.netCents >= 0
                            ? styles.balancePositive
                            : styles.balanceNegative,
                        ]}
                      >
                        {myBalance.netCents >= 0 ? "+" : "−"}
                        {formatPrice(Math.abs(myBalance.netCents) / 100, "EUR")}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.expensesHint}>
                  {expenses.length === 0
                    ? es.expenses.noExpenses
                    : `${expenses.length} gastos registrados`}
                </Text>
              </View>
            </Pressable>
          )}

          {/* Mark ready button */}
          {isLead && group.status === "forming" && !formed && (
            <Pressable
              style={styles.readyBtn}
              onPress={async () => {
                setBusy("ready");
                await setGroupStatus(group.id, "ready");
                setGroup({ ...group, status: "ready" });
                setBusy(null);
              }}
              disabled={busy === "ready"}
            >
              <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
              {busy === "ready" ? (
                <ActivityIndicator color={liquidGlassTheme.colors.brand.primary} />
              ) : (
                <>
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color={liquidGlassTheme.colors.brand.primary}
                  />
                  <Text style={styles.readyBtnText}>{es.groups.markReady}</Text>
                </>
              )}
            </Pressable>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: liquidGlassTheme.colors.light.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: liquidGlassTheme.spacing.xl,
  },
  error: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.brand.error,
    textAlign: "center",
  },
  header: {
    paddingTop: liquidGlassTheme.spacing.lg + 8,
    paddingBottom: liquidGlassTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: liquidGlassTheme.colors.light.border.subtle,
  },
  headerContent: {
    paddingHorizontal: liquidGlassTheme.spacing.lg,
    gap: liquidGlassTheme.spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.xs,
    borderRadius: liquidGlassTheme.borderRadius.xl,
    backgroundColor: liquidGlassTheme.colors.light.glass.card + "80",
  },
  statusText: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.brand.warning,
  },
  statusTextSuccess: {
    color: liquidGlassTheme.colors.brand.success,
  },
  title: {
    fontSize: liquidGlassTheme.typography.fontSize.title1,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.xs,
  },
  meta: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
  metaSeparator: {
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
  progressContainer: {
    height: 6,
    backgroundColor: liquidGlassTheme.colors.light.surfaceVariant,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: liquidGlassTheme.spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: "100%",
  },
  progressFill: {
    height: "100%",
    backgroundColor: liquidGlassTheme.colors.brand.primary,
    borderRadius: 3,
  },
  progressFillFull: {
    backgroundColor: liquidGlassTheme.colors.brand.success,
  },
  formedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.xs,
    borderRadius: liquidGlassTheme.borderRadius.xl,
    backgroundColor: liquidGlassTheme.colors.brand.success + "15",
  },
  formedText: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.brand.success,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: liquidGlassTheme.spacing.lg,
    paddingBottom: liquidGlassTheme.spacing.xxl,
  },
  notesCard: {
    borderRadius: liquidGlassTheme.borderRadius.lg,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
  },
  notesContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: liquidGlassTheme.spacing.sm,
    padding: liquidGlassTheme.spacing.md,
  },
  notes: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: liquidGlassTheme.spacing.md,
    marginBottom: liquidGlassTheme.spacing.lg,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.md,
    paddingVertical: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    overflow: "hidden",
  },
  actionBtnText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.brand.primary,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.md,
    paddingVertical: liquidGlassTheme.spacing.md,
    overflow: "hidden",
    ...liquidGlassTheme.shadows.sm,
  },
  primaryBtnText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.white,
  },
  pendingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.md,
    padding: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.brand.warning + "30",
    backgroundColor: liquidGlassTheme.colors.brand.warning + "10",
    overflow: "hidden",
  },
  pending: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.brand.warning,
  },
  section: {
    marginBottom: liquidGlassTheme.spacing.lg,
  },
  sectionTitle: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
    marginBottom: liquidGlassTheme.spacing.sm,
  },
  memberCard: {
    borderRadius: liquidGlassTheme.borderRadius.md,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.sm,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.glass.card + "60",
  },
  memberCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: liquidGlassTheme.spacing.md,
    gap: liquidGlassTheme.spacing.md,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.brand.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  memberMeta: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.light.text.tertiary},
  memberActions: {
    flexDirection: "row",
    gap: liquidGlassTheme.spacing.sm,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: liquidGlassTheme.colors.brand.success,
    alignItems: "center",
    justifyContent: "center",
  },
  denyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: liquidGlassTheme.colors.brand.error + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  rentCard: {
    borderRadius: liquidGlassTheme.borderRadius.md,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
  },
  rentCardContent: {
    padding: liquidGlassTheme.spacing.md,
  },
  rentLabel: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.secondary,
    marginBottom: liquidGlassTheme.spacing.sm,
  },
  rentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: liquidGlassTheme.colors.light.surfaceVariant,
    borderRadius: liquidGlassTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
  },
  rentInput: {
    flex: 1,
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.sm,
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  rentCurrency: {
    paddingHorizontal: liquidGlassTheme.spacing.md,
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: liquidGlassTheme.spacing.sm,
    backgroundColor: liquidGlassTheme.colors.light.glass.card + "60",
    borderRadius: liquidGlassTheme.borderRadius.sm,
    marginBottom: liquidGlassTheme.spacing.xs,
  },
  splitAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  splitAvatarText: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.brand.primary,
  },
  splitName: {
    flex: 1,
    marginLeft: liquidGlassTheme.spacing.sm,
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  splitAmount: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.brand.success,
  },
  expensesCard: {
    borderRadius: liquidGlassTheme.borderRadius.xl,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.lg,
    ...liquidGlassTheme.shadows.lg,
  },
  expensesCardContent: {
    padding: liquidGlassTheme.spacing.lg,
  },
  expensesCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.sm,
    marginBottom: liquidGlassTheme.spacing.md,
  },
  expensesCardTitle: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.white,
  },
  expensesStats: {
    flexDirection: "row",
    gap: liquidGlassTheme.spacing.xl,
  },
  expensesStat: {
    flex: 1,
  },
  expensesStatLabel: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
  expensesStatValue: {
    fontSize: liquidGlassTheme.typography.fontSize.title3,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.white,
    marginTop: liquidGlassTheme.spacing.xs,
  },
  balancePositive: {
    color: liquidGlassTheme.colors.brand.success,
  },
  balanceNegative: {
    color: liquidGlassTheme.colors.brand.error,
  },
  expensesHint: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.light.text.tertiary,
    marginTop: liquidGlassTheme.spacing.md,
  },
  readyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.md,
    paddingVertical: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.brand.primary,
    overflow: "hidden",
  },
  readyBtnText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.brand.primary,
  },
});
