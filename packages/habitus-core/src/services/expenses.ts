import { getSupabase } from "../client";
import { computeFairSplit } from "./groups";

export type ExpenseCategory =
  | "rent"
  | "utilities"
  | "internet"
  | "cleaning"
  | "groceries"
  | "repair"
  | "other";

export type SplitMode = "proportional" | "equal" | "custom";

export type HouseholdExpense = {
  id: string;
  groupId: string;
  createdBy: string;
  category: ExpenseCategory;
  label: string;
  amountCents: number;
  currency: string;
  splitMode: SplitMode;
  expenseDate: string;
  recurrence: string | null;
  createdAt: string;
  splits: ExpenseSplit[];
  payerName?: string;
};

export type ExpenseSplit = {
  profileId: string;
  shareCents: number;
  weight: number | null;
  displayName?: string;
};

export type MemberBalance = {
  profileId: string;
  displayName: string;
  paidCents: number;
  owedCents: number;
  netCents: number;
};

export type CreateExpenseInput = {
  groupId: string;
  createdBy: string;
  category: ExpenseCategory;
  label: string;
  amountCents: number;
  splitMode: SplitMode;
  expenseDate?: string;
  recurrence?: string | null;
  members: { profileId: string; displayName: string; weight?: number }[];
  paidByProfileId?: string;
};

function mapExpense(
  row: Record<string, unknown>,
  splits: ExpenseSplit[] = [],
): HouseholdExpense {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    createdBy: row.created_by as string,
    category: row.category as ExpenseCategory,
    label: row.label as string,
    amountCents: Number(row.amount_cents),
    currency: (row.currency as string) ?? "EUR",
    splitMode: row.split_mode as SplitMode,
    expenseDate: row.expense_date as string,
    recurrence: (row.recurrence as string) ?? null,
    createdAt: row.created_at as string,
    splits,
  };
}

function computeSplits(
  amountCents: number,
  splitMode: SplitMode,
  members: { profileId: string; displayName: string; weight?: number }[],
): ExpenseSplit[] {
  if (!members.length || amountCents <= 0) return [];

  if (splitMode === "equal") {
    const base = Math.floor(amountCents / members.length);
    const remainder = amountCents - base * members.length;
    return members.map((m, i) => ({
      profileId: m.profileId,
      displayName: m.displayName,
      shareCents: base + (i === 0 ? remainder : 0),
      weight: 1,
    }));
  }

  const totalEur = amountCents / 100;
  const fairLines = computeFairSplit(
    totalEur,
    members.map((m, i) => ({
      profileId: m.profileId,
      displayName: m.displayName,
      weight: m.weight ?? members.length - i,
    })),
  );

  return fairLines.map((line) => ({
    profileId: line.profileId,
    displayName: line.displayName,
    shareCents: Math.round(line.amount * 100),
    weight: line.weight,
  }));
}

export async function fetchGroupExpenses(groupId: string): Promise<HouseholdExpense[]> {
  const { data, error } = await getSupabase()
    .from("habitus_household_expenses")
    .select("*")
    .eq("group_id", groupId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data?.length) return [];

  const expenseIds = data.map((r) => r.id as string);
  const { data: splitRows, error: splitErr } = await getSupabase()
    .from("habitus_expense_splits")
    .select("expense_id, profile_id, share_cents, weight")
    .in("expense_id", expenseIds);

  if (splitErr) throw splitErr;

  const splitsByExpense = new Map<string, ExpenseSplit[]>();
  for (const s of splitRows ?? []) {
    const list = splitsByExpense.get(s.expense_id) ?? [];
    list.push({
      profileId: s.profile_id,
      shareCents: Number(s.share_cents),
      weight: s.weight != null ? Number(s.weight) : null,
    });
    splitsByExpense.set(s.expense_id, list);
  }

  return data.map((row) =>
    mapExpense(row as Record<string, unknown>, splitsByExpense.get(row.id) ?? []),
  );
}

export async function createHouseholdExpense(input: CreateExpenseInput): Promise<string | null> {
  const splits = computeSplits(input.amountCents, input.splitMode, input.members);
  const totalSplit = splits.reduce((s, x) => s + x.shareCents, 0);
  if (totalSplit !== input.amountCents && splits.length) {
    splits[0].shareCents += input.amountCents - totalSplit;
  }

  const { data: expense, error } = await getSupabase()
    .from("habitus_household_expenses")
    .insert({
      group_id: input.groupId,
      created_by: input.createdBy,
      category: input.category,
      label: input.label.trim(),
      amount_cents: input.amountCents,
      split_mode: input.splitMode,
      expense_date: input.expenseDate ?? new Date().toISOString().slice(0, 10),
      recurrence: input.recurrence ?? null,
    })
    .select("id")
    .single();

  if (error) return error.message;

  const splitInserts = splits.map((s) => ({
    expense_id: expense.id,
    profile_id: s.profileId,
    share_cents: s.shareCents,
    weight: s.weight,
  }));

  const { error: splitErr } = await getSupabase().from("habitus_expense_splits").insert(splitInserts);
  return splitErr?.message ?? null;
}

export async function deleteHouseholdExpense(expenseId: string): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_household_expenses")
    .delete()
    .eq("id", expenseId);
  return error?.message ?? null;
}

export function computeMemberBalances(
  expenses: HouseholdExpense[],
  members: { profileId: string; displayName: string }[],
): MemberBalance[] {
  const paid = new Map<string, number>();
  const owed = new Map<string, number>();

  for (const m of members) {
    paid.set(m.profileId, 0);
    owed.set(m.profileId, 0);
  }

  for (const exp of expenses) {
    paid.set(exp.createdBy, (paid.get(exp.createdBy) ?? 0) + exp.amountCents);
    for (const split of exp.splits) {
      owed.set(split.profileId, (owed.get(split.profileId) ?? 0) + split.shareCents);
    }
  }

  return members.map((m) => {
    const paidCents = paid.get(m.profileId) ?? 0;
    const owedCents = owed.get(m.profileId) ?? 0;
    return {
      profileId: m.profileId,
      displayName: m.displayName,
      paidCents,
      owedCents,
      netCents: paidCents - owedCents,
    };
  });
}

export async function recordSettlement(input: {
  groupId: string;
  fromProfileId: string;
  toProfileId: string;
  amountCents: number;
  recordedBy: string;
  note?: string;
}): Promise<string | null> {
  const { error } = await getSupabase().from("habitus_expense_settlements").insert({
    group_id: input.groupId,
    from_profile_id: input.fromProfileId,
    to_profile_id: input.toProfileId,
    amount_cents: input.amountCents,
    recorded_by: input.recordedBy,
    note: input.note ?? null,
  });
  return error?.message ?? null;
}

export type BalanceTransfer = {
  fromProfileId: string;
  fromName: string;
  toProfileId: string;
  toName: string;
  amountCents: number;
};

/** Simplifica deudas: quién debe pagar a quién con el mínimo de transferencias. */
export function computeSuggestedTransfers(balances: MemberBalance[]): BalanceTransfer[] {
  type Node = { profileId: string; displayName: string; net: number };
  const debtors: Node[] = balances
    .filter((b) => b.netCents < 0)
    .map((b) => ({ profileId: b.profileId, displayName: b.displayName, net: -b.netCents }))
    .sort((a, b) => b.net - a.net);
  const creditors: Node[] = balances
    .filter((b) => b.netCents > 0)
    .map((b) => ({ profileId: b.profileId, displayName: b.displayName, net: b.netCents }))
    .sort((a, b) => b.net - a.net);

  const transfers: BalanceTransfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].net, creditors[j].net);
    if (amount > 0) {
      transfers.push({
        fromProfileId: debtors[i].profileId,
        fromName: debtors[i].displayName,
        toProfileId: creditors[j].profileId,
        toName: creditors[j].displayName,
        amountCents: amount,
      });
    }
    debtors[i].net -= amount;
    creditors[j].net -= amount;
    if (debtors[i].net <= 0) i += 1;
    if (creditors[j].net <= 0) j += 1;
  }
  return transfers;
}

export function sumExpensesCents(expenses: HouseholdExpense[]): number {
  return expenses.reduce((s, e) => s + e.amountCents, 0);
}

export function expensesInMonth(expenses: HouseholdExpense[], yearMonth: string): HouseholdExpense[] {
  return expenses.filter((e) => e.expenseDate.startsWith(yearMonth));
}
