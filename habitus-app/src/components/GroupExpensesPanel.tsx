import { useEffect, useState } from "react";
import {
  computeMemberBalances,
  createHouseholdExpense,
  deleteHouseholdExpense,
  es,
  fetchGroupExpenses,
  formatPrice,
  type ExpenseCategory,
  type HouseholdExpense,
  type LivingGroupMember,
  type SplitMode,
} from "@habitus/core";
import { Icon } from "./Icon";

type GroupExpensesPanelProps = {
  groupId: string;
  userId: string;
  members: LivingGroupMember[];
};

const CATEGORIES: ExpenseCategory[] = [
  "utilities",
  "internet",
  "cleaning",
  "groceries",
  "repair",
  "other",
];

export function GroupExpensesPanel({ groupId, userId, members }: GroupExpensesPanelProps) {
  const [expenses, setExpenses] = useState<HouseholdExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("utilities");
  const [splitMode, setSplitMode] = useState<SplitMode>("proportional");

  const memberInputs = members.map((m, i) => ({
    profileId: m.profileId,
    displayName: m.displayName,
    weight: members.length - i,
  }));

  async function reload() {
    setLoading(true);
    try {
      const data = await fetchGroupExpenses(groupId);
      setExpenses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : es.common.errorLoad);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [groupId]);

  const balances = computeMemberBalances(
    expenses,
    members.map((m) => ({ profileId: m.profileId, displayName: m.displayName })),
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
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
    setShowForm(false);
    await reload();
  }

  async function handleDelete(expenseId: string) {
    setBusy(true);
    const err = await deleteHouseholdExpense(expenseId);
    setBusy(false);
    if (err) setError(err);
    else await reload();
  }

  return (
    <section className="mb-8 rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-headline-md text-deep-navy">{es.expenses.title}</h2>
          <p className="mt-1 text-body-sm text-warm-slate">{es.expenses.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-4 py-2 text-label-md text-on-primary"
        >
          <Icon name="add" className="text-[18px]" />
          {es.expenses.addExpense}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-error-container/30 px-4 py-2 text-body-sm text-error">{error}</p>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 space-y-4 rounded-lg border border-border-light p-4">
          <div>
            <label className="text-label-md text-deep-navy">{es.expenses.label}</label>
            <input
              className="field-input mt-1"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-label-md text-deep-navy">{es.expenses.amount}</label>
              <input
                className="field-input mt-1"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-label-md text-deep-navy">{es.expenses.category}</label>
              <select
                className="field-input mt-1"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {es.expenses.categories[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-label-md text-deep-navy">{es.expenses.splitMode}</label>
            <select
              className="field-input mt-1"
              value={splitMode}
              onChange={(e) => setSplitMode(e.target.value as SplitMode)}
            >
              <option value="proportional">{es.expenses.splitProportional}</option>
              <option value="equal">{es.expenses.splitEqual}</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-teal-accent px-6 py-2 text-label-md text-on-primary disabled:opacity-60"
          >
            {busy ? es.common.pleaseWait : es.expenses.addExpense}
          </button>
        </form>
      )}

      <div className="mb-6">
        <h3 className="mb-3 text-label-md font-semibold text-deep-navy">{es.expenses.balances}</h3>
        <ul className="space-y-2">
          {balances.map((b) => (
            <li
              key={b.profileId}
              className="flex justify-between rounded-lg bg-surface-container px-4 py-3 text-body-sm"
            >
              <span>{b.displayName}</span>
              <span className={b.netCents >= 0 ? "text-teal-accent" : "text-error"}>
                {b.netCents >= 0
                  ? `+${formatPrice(b.netCents / 100, "EUR")} ${es.expenses.netPositive}`
                  : `${formatPrice(Math.abs(b.netCents) / 100, "EUR")} ${es.expenses.netNegative}`}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {loading ? (
        <p className="text-body-sm text-warm-slate">{es.common.loading}</p>
      ) : expenses.length === 0 ? (
        <p className="text-body-sm text-warm-slate">{es.expenses.noExpenses}</p>
      ) : (
        <ul className="space-y-3">
          {expenses.map((exp) => (
            <li
              key={exp.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-light p-4"
            >
              <div>
                <p className="text-label-md text-deep-navy">{exp.label}</p>
                <p className="text-label-sm text-warm-slate">
                  {es.expenses.categories[exp.category]} · {exp.expenseDate}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-teal-accent">
                  {formatPrice(exp.amountCents / 100, exp.currency)}
                </span>
                {exp.createdBy === userId && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete(exp.id)}
                    className="text-label-sm text-warm-slate hover:text-error"
                  >
                    {es.expenses.delete}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
