import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  computeFairSplit,
  computeMemberBalances,
  computeSuggestedTransfers,
  createHouseholdExpense,
  deleteHouseholdExpense,
  es,
  expensesInMonth,
  fetchGroupExpenses,
  fetchGroupMembers,
  formatPrice,
  recordSettlement,
  sumExpensesCents,
  type ExpenseCategory,
  type HouseholdExpense,
  type LivingGroupMember,
  type SplitMode,
} from "@habitus/core";
import type { MainStackParamList } from "../navigation/MainStack";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<MainStackParamList, "GroupExpenses">;

type Tab = "summary" | "history" | "add";

const CATEGORIES: ExpenseCategory[] = [
  "utilities",
  "internet",
  "cleaning",
  "groceries",
  "repair",
  "rent",
  "other",
];

const CATEGORY_EMOJI: Record<ExpenseCategory, string> = {
  rent: "🏠",
  utilities: "💡",
  internet: "📶",
  cleaning: "🧹",
  groceries: "🛒",
  repair: "🔧",
  other: "📋",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function GroupExpensesScreen({ route }: Props) {
  const { groupId, groupName } = route.params;
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [tab, setTab] = useState<Tab>("summary");
  const [members, setMembers] = useState<LivingGroupMember[]>([]);
  const [expenses, setExpenses] = useState<HouseholdExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("utilities");
  const [splitMode, setSplitMode] = useState<SplitMode>("proportional");

  const [settleOpen, setSettleOpen] = useState(false);
  const [settleFrom, setSettleFrom] = useState("");
  const [settleTo, setSettleTo] = useState("");
  const [settleAmount, setSettleAmount] = useState("");

  const yearMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = useMemo(() => expensesInMonth(expenses, yearMonth), [expenses, yearMonth]);
  const monthTotal = sumExpensesCents(monthExpenses);

  const memberInputs = useMemo(
    () =>
      members.map((m, i) => ({
        profileId: m.profileId,
        displayName: m.displayName,
        weight: members.length - i,
      })),
    [members],
  );

  const balances = useMemo(
    () =>
      computeMemberBalances(
        expenses,
        members.map((m) => ({ profileId: m.profileId, displayName: m.displayName })),
      ),
    [expenses, members],
  );

  const myBalance = balances.find((b) => b.profileId === userId);
  const transfers = useMemo(() => computeSuggestedTransfers(balances), [balances]);

  const previewCents = useMemo(() => {
    const cents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents <= 0 || !memberInputs.length) return null;
    if (splitMode === "equal") {
      const base = Math.floor(cents / memberInputs.length);
      const rem = cents - base * memberInputs.length;
      return memberInputs.map((m, i) => ({
        ...m,
        shareCents: base + (i === 0 ? rem : 0),
      }));
    }
    const lines = computeFairSplit(
      cents / 100,
      memberInputs.map((m) => ({
        profileId: m.profileId,
        displayName: m.displayName,
        weight: m.weight,
      })),
    );
    return lines.map((l) => ({
      profileId: l.profileId,
      displayName: l.displayName,
      shareCents: Math.round(l.amount * 100),
    }));
  }, [amount, splitMode, memberInputs]);

  const load = useCallback(async () => {
    const [mems, exps] = await Promise.all([
      fetchGroupMembers(groupId),
      fetchGroupExpenses(groupId),
    ]);
    setMembers(mems.filter((m) => m.isConfirmed));
    setExpenses(exps);
  }, [groupId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : es.common.errorLoad);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleAdd() {
    const cents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (!label.trim() || !Number.isFinite(cents) || cents <= 0) return;
    setBusy(true);
    setError(null);
    const err = await createHouseholdExpense({
      groupId,
      createdBy: userId,
      category,
      label: label.trim(),
      amountCents: cents,
      splitMode,
      members: memberInputs,
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setLabel("");
    setAmount("");
    setTab("summary");
    await load();
  }

  function confirmDelete(expense: HouseholdExpense) {
    Alert.alert(es.expenses.delete, es.expenses.confirmDelete, [
      { text: es.expenses.cancel, style: "cancel" },
      {
        text: es.expenses.delete,
        style: "destructive",
        onPress: () => {
          void (async () => {
            setBusy(true);
            const err = await deleteHouseholdExpense(expense.id);
            setBusy(false);
            if (err) setError(err);
            else await load();
          })();
        },
      },
    ]);
  }

  async function handleSettlement() {
    const cents = Math.round(parseFloat(settleAmount.replace(",", ".")) * 100);
    if (!settleFrom || !settleTo || !Number.isFinite(cents) || cents <= 0) return;
    setBusy(true);
    const err = await recordSettlement({
      groupId,
      fromProfileId: settleFrom,
      toProfileId: settleTo,
      amountCents: cents,
      recordedBy: userId,
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setSettleOpen(false);
    setSettleAmount("");
    Alert.alert("✓", es.expenses.settled);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.tealAccent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tealAccent} />}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.groupName}>{groupName}</Text>
        <Text style={styles.subtitle}>{es.expenses.subtitle}</Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>{es.expenses.totalMonth}</Text>
          <Text style={styles.heroAmount}>{formatPrice(monthTotal / 100, "EUR")}</Text>
          {myBalance && (
            <View style={styles.heroBalanceRow}>
              <Text style={styles.heroBalanceLabel}>{es.expenses.yourBalance}</Text>
              <Text
                style={[
                  styles.heroBalanceValue,
                  myBalance.netCents >= 0 ? styles.positive : styles.negative,
                ]}
              >
                {myBalance.netCents >= 0 ? "+" : "−"}
                {formatPrice(Math.abs(myBalance.netCents) / 100, "EUR")}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tabs}>
          {(
            [
              ["summary", es.expenses.tabSummary],
              ["history", es.expenses.tabHistory],
              ["add", es.expenses.tabAdd],
            ] as const
          ).map(([key, labelText]) => (
            <Pressable
              key={key}
              style={[styles.tab, tab === key && styles.tabActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{labelText}</Text>
            </Pressable>
          ))}
        </View>

        {error && <Text style={styles.errorBanner}>{error}</Text>}

        {tab === "summary" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{es.expenses.balances}</Text>
            {balances.map((b) => {
              const max = Math.max(...balances.map((x) => Math.abs(x.netCents)), 1);
              const widthPct = (Math.abs(b.netCents) / max) * 100;
              return (
                <View key={b.profileId} style={styles.balanceCard}>
                  <View style={styles.balanceHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials(b.displayName)}</Text>
                    </View>
                    <View style={styles.balanceInfo}>
                      <Text style={styles.balanceName}>
                        {b.displayName}
                        {b.profileId === userId ? " (tú)" : ""}
                      </Text>
                      <Text style={styles.balanceMeta}>
                        {es.expenses.paid}: {formatPrice(b.paidCents / 100, "EUR")} · {es.expenses.owes}:{" "}
                        {formatPrice(b.owedCents / 100, "EUR")}
                      </Text>
                    </View>
                    <Text style={[styles.balanceNet, b.netCents >= 0 ? styles.positive : styles.negative]}>
                      {b.netCents >= 0 ? "+" : "−"}
                      {formatPrice(Math.abs(b.netCents) / 100, "EUR")}
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        b.netCents >= 0 ? styles.barPositive : styles.barNegative,
                        { width: `${Math.max(widthPct, 4)}%` },
                      ]}
                    />
                  </View>
                </View>
              );
            })}

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{es.expenses.suggestedPayments}</Text>
            {transfers.length === 0 ? (
              <Text style={styles.muted}>{es.expenses.allSettled}</Text>
            ) : (
              transfers.map((t, idx) => (
                <Pressable
                  key={`${t.fromProfileId}-${t.toProfileId}-${idx}`}
                  style={styles.transferRow}
                  onPress={() => {
                    setSettleFrom(t.fromProfileId);
                    setSettleTo(t.toProfileId);
                    setSettleAmount((t.amountCents / 100).toFixed(2).replace(".", ","));
                    setSettleOpen(true);
                  }}
                >
                  <Text style={styles.transferText}>
                    <Text style={styles.transferBold}>{t.fromName}</Text> {es.expenses.paysTo}{" "}
                    <Text style={styles.transferBold}>{t.toName}</Text>
                  </Text>
                  <Text style={styles.transferAmount}>{formatPrice(t.amountCents / 100, "EUR")}</Text>
                </Pressable>
              ))
            )}

            <Pressable style={styles.secondaryBtn} onPress={() => setSettleOpen(true)}>
              <Text style={styles.secondaryBtnText}>{es.expenses.recordSettlement}</Text>
            </Pressable>
          </View>
        )}

        {tab === "history" && (
          <View style={styles.section}>
            {expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🧾</Text>
                <Text style={styles.emptyTitle}>{es.expenses.noExpenses}</Text>
                <Pressable style={styles.secondaryBtn} onPress={() => setTab("add")}>
                  <Text style={styles.secondaryBtnText}>{es.expenses.addExpense}</Text>
                </Pressable>
              </View>
            ) : (
              expenses.map((exp) => {
                const mySplit = exp.splits.find((s) => s.profileId === userId);
                const payer = members.find((m) => m.profileId === exp.createdBy);
                return (
                  <Pressable
                    key={exp.id}
                    style={styles.expenseCard}
                    onLongPress={() => exp.createdBy === userId && confirmDelete(exp)}
                  >
                    <View style={styles.expenseIcon}>
                      <Text style={styles.expenseEmoji}>{CATEGORY_EMOJI[exp.category]}</Text>
                    </View>
                    <View style={styles.expenseBody}>
                      <Text style={styles.expenseLabel}>{exp.label}</Text>
                      <Text style={styles.expenseMeta}>
                        {es.expenses.categories[exp.category]} · {exp.expenseDate}
                        {payer ? ` · ${payer.displayName}` : ""}
                      </Text>
                      {mySplit && (
                        <Text style={styles.expenseShare}>
                          {es.expenses.memberShare}: {formatPrice(mySplit.shareCents / 100, exp.currency)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.expenseRight}>
                      <Text style={styles.expenseAmount}>
                        {formatPrice(exp.amountCents / 100, exp.currency)}
                      </Text>
                      {exp.createdBy === userId && (
                        <Pressable hitSlop={8} onPress={() => confirmDelete(exp)}>
                          <Text style={styles.deleteLink}>{es.expenses.delete}</Text>
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        {tab === "add" && (
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>{es.expenses.category}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.chip, category === c && styles.chipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={styles.chipEmoji}>{CATEGORY_EMOJI[c]}</Text>
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
                    {es.expenses.categories[c]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>{es.expenses.amount}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0,00"
              placeholderTextColor={colors.outline}
            />

            <Text style={styles.fieldLabel}>{es.expenses.label}</Text>
            <TextInput
              style={styles.input}
              value={label}
              onChangeText={setLabel}
              placeholder="Ej. Factura luz marzo"
              placeholderTextColor={colors.outline}
            />

            <Text style={styles.fieldLabel}>{es.expenses.splitMode}</Text>
            <View style={styles.splitToggle}>
              <Pressable
                style={[styles.splitOption, splitMode === "proportional" && styles.splitOptionActive]}
                onPress={() => setSplitMode("proportional")}
              >
                <Text style={[styles.splitOptionText, splitMode === "proportional" && styles.splitOptionTextActive]}>
                  {es.expenses.splitProportional}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.splitOption, splitMode === "equal" && styles.splitOptionActive]}
                onPress={() => setSplitMode("equal")}
              >
                <Text style={[styles.splitOptionText, splitMode === "equal" && styles.splitOptionTextActive]}>
                  {es.expenses.splitEqual}
                </Text>
              </Pressable>
            </View>

            {previewCents && previewCents.length > 0 && (
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>{es.expenses.splitPreview}</Text>
                {previewCents.map((row) => (
                  <View key={row.profileId} style={styles.previewRow}>
                    <Text style={styles.previewName}>{row.displayName}</Text>
                    <Text style={styles.previewAmount}>{formatPrice(row.shareCents / 100, "EUR")}</Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable style={styles.primaryBtn} onPress={handleAdd} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>{es.expenses.saveExpense}</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal visible={settleOpen} animationType="slide" transparent onRequestClose={() => setSettleOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{es.expenses.recordSettlement}</Text>

            <Text style={styles.fieldLabel}>{es.expenses.from}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {members.map((m) => (
                <Pressable
                  key={m.profileId}
                  style={[styles.chip, settleFrom === m.profileId && styles.chipActive]}
                  onPress={() => setSettleFrom(m.profileId)}
                >
                  <Text style={[styles.chipText, settleFrom === m.profileId && styles.chipTextActive]}>
                    {m.displayName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>{es.expenses.to}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {members.map((m) => (
                <Pressable
                  key={m.profileId}
                  style={[styles.chip, settleTo === m.profileId && styles.chipActive]}
                  onPress={() => setSettleTo(m.profileId)}
                >
                  <Text style={[styles.chipText, settleTo === m.profileId && styles.chipTextActive]}>
                    {m.displayName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>{es.expenses.amount}</Text>
            <TextInput
              style={styles.input}
              value={settleAmount}
              onChangeText={setSettleAmount}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setSettleOpen(false)}>
                <Text style={styles.modalCancelText}>{es.expenses.cancel}</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={handleSettlement} disabled={busy}>
                <Text style={styles.primaryBtnText}>{es.expenses.settled}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  groupName: { fontSize: 13, fontWeight: "600", color: colors.tealAccent, textTransform: "uppercase", letterSpacing: 0.5 },
  subtitle: { fontSize: 15, color: colors.warmSlate, marginTop: 4, marginBottom: 16 },
  heroCard: {
    backgroundColor: colors.deepNavy,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  heroLabel: { color: colors.onPrimaryContainer, fontSize: 13 },
  heroAmount: { color: colors.white, fontSize: 36, fontWeight: "700", marginTop: 4 },
  heroBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  heroBalanceLabel: { color: colors.onPrimaryContainer, fontSize: 14 },
  heroBalanceValue: { fontSize: 18, fontWeight: "700" },
  positive: { color: "#5eead4" },
  negative: { color: "#fca5a5" },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surfaceLow,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: colors.surfaceLowest, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.warmSlate },
  tabTextActive: { color: colors.deepNavy },
  section: { marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.deepNavy, marginBottom: 12 },
  balanceCard: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  balanceHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.tealAccent + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "700", color: colors.tealAccent, fontSize: 14 },
  balanceInfo: { flex: 1 },
  balanceName: { fontWeight: "600", color: colors.onSurface, fontSize: 15 },
  balanceMeta: { fontSize: 12, color: colors.warmSlate, marginTop: 2 },
  balanceNet: { fontSize: 15, fontWeight: "700" },
  barTrack: {
    height: 4,
    backgroundColor: colors.surfaceLow,
    borderRadius: 2,
    marginTop: 10,
    overflow: "hidden",
  },
  barFill: { height: 4, borderRadius: 2 },
  barPositive: { backgroundColor: colors.tealAccent },
  barNegative: { backgroundColor: colors.error },
  transferRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceLowest,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  transferText: { flex: 1, fontSize: 14, color: colors.onSurface, marginRight: 8 },
  transferBold: { fontWeight: "700" },
  transferAmount: { fontWeight: "700", color: colors.tealAccent },
  muted: { color: colors.warmSlate, fontSize: 15, textAlign: "center", paddingVertical: 24 },
  emptyState: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 16 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, color: colors.warmSlate, textAlign: "center", marginBottom: 16 },
  expenseCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surfaceLowest,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  expenseIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  expenseEmoji: { fontSize: 22 },
  expenseBody: { flex: 1 },
  expenseLabel: { fontWeight: "600", fontSize: 15, color: colors.onSurface },
  expenseMeta: { fontSize: 12, color: colors.warmSlate, marginTop: 3 },
  expenseShare: { fontSize: 12, color: colors.tealAccent, marginTop: 4, fontWeight: "600" },
  expenseRight: { alignItems: "flex-end" },
  expenseAmount: { fontWeight: "700", fontSize: 16, color: colors.deepNavy },
  deleteLink: { fontSize: 12, color: colors.error, marginTop: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.warmSlate, marginBottom: 8, marginTop: 12 },
  chipScroll: { marginBottom: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceLowest,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.deepNavy, borderColor: colors.deepNavy },
  chipEmoji: { fontSize: 16 },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.onSurface },
  chipTextActive: { color: colors.white },
  amountInput: {
    fontSize: 40,
    fontWeight: "700",
    color: colors.deepNavy,
    backgroundColor: colors.surfaceLowest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  input: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontSize: 16,
    color: colors.onSurface,
  },
  splitToggle: { flexDirection: "row", gap: 8 },
  splitOption: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceLowest,
  },
  splitOptionActive: { borderColor: colors.tealAccent, backgroundColor: colors.tealAccent + "15" },
  splitOptionText: { fontSize: 12, fontWeight: "600", color: colors.warmSlate, textAlign: "center" },
  splitOptionTextActive: { color: colors.deepNavy },
  previewBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceLow,
  },
  previewTitle: { fontSize: 13, fontWeight: "600", color: colors.warmSlate, marginBottom: 8 },
  previewRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  previewName: { fontSize: 14, color: colors.onSurface },
  previewAmount: { fontSize: 14, fontWeight: "600", color: colors.tealAccent },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: colors.deepNavy,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  secondaryBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.deepNavy,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.deepNavy, fontWeight: "600" },
  errorBanner: {
    backgroundColor: colors.errorContainer,
    color: colors.onErrorContainer,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surfaceLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: colors.deepNavy, marginBottom: 8 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 16 },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalCancelText: { fontWeight: "600", color: colors.warmSlate },
});
