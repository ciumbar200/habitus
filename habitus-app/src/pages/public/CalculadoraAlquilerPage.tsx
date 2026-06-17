import { useState, useMemo, useId } from "react";
import { Link } from "react-router-dom";
import { House, Users, ArrowRight, Sparkle, Plus, Trash, WifiHigh, Drop, Lightning, Television } from "@phosphor-icons/react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { accessSignupUrl } from "../../lib/accessLinks";

// ─── Types ───────────────────────────────────────────────────────────────────

type Room = { id: string; label: string; sqm: string };
type Expense = { id: string; label: string; amount: string; enabled: boolean };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

const DEFAULT_ROOMS: Room[] = [
  { id: "r1", label: "Habitación 1", sqm: "12" },
  { id: "r2", label: "Habitación 2", sqm: "10" },
  { id: "r3", label: "Habitación 3", sqm: "8" },
];

const DEFAULT_EXPENSES: Expense[] = [
  { id: "e1", label: "Luz", amount: "60", enabled: true },
  { id: "e2", label: "Agua", amount: "25", enabled: true },
  { id: "e3", label: "Internet", amount: "35", enabled: true },
  { id: "e4", label: "Streaming", amount: "15", enabled: false },
];

const EXPENSE_ICONS: Record<string, React.ReactNode> = {
  Luz: <Lightning size={14} weight="fill" />,
  Agua: <Drop size={14} weight="fill" />,
  Internet: <WifiHigh size={14} weight="fill" />,
  Streaming: <Television size={14} weight="fill" />,
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CalculadoraAlquilerPage() {
  usePageMeta(
    "Calculadora de alquiler justo para pisos compartidos | moon",
    "Divide el alquiler de forma equitativa según los m² de cada habitación. Añade zonas comunes, luz, agua, internet y más. Herramienta gratuita.",
    "/calculadora-alquiler",
  );

  const baseId = useId();
  const [totalRent, setTotalRent] = useState("1200");
  const [commonSqm, setCommonSqm] = useState("30");
  const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS);
  const [expenses, setExpenses] = useState<Expense[]>(DEFAULT_EXPENSES);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // ─── Calculations ──────────────────────────────────────────────────────────

  const results = useMemo(() => {
    const rent = parseFloat(totalRent) || 0;
    const sharedSqm = parseFloat(commonSqm) || 0;
    const n = rooms.length;
    if (rent <= 0 || n === 0) return null;

    const roomSqms = rooms.map((r) => parseFloat(r.sqm) || 0);
    const totalRoomSqm = roomSqms.reduce((a, b) => a + b, 0);
    const totalSqm = totalRoomSqm + sharedSqm;
    if (totalSqm === 0) return null;

    const pricePerSqm = rent / totalSqm;
    const sharedPerPerson = (sharedSqm / n) * pricePerSqm;

    const activeExpenses = expenses.filter((e) => e.enabled);
    const totalExpenses = activeExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const expensePerPerson = totalExpenses / n;

    const roomResults = rooms.map((room, i) => {
      const sqm = roomSqms[i];
      const roomRent = sqm * pricePerSqm + sharedPerPerson;
      return {
        id: room.id,
        label: room.label,
        sqm,
        roomRent: Math.round(roomRent * 100) / 100,
        expenses: Math.round(expensePerPerson * 100) / 100,
        total: Math.round((roomRent + expensePerPerson) * 100) / 100,
      };
    });

    return { roomResults, pricePerSqm, totalExpenses, expensePerPerson, sharedPerPerson };
  }, [totalRent, commonSqm, rooms, expenses]);

  // ─── Room handlers ─────────────────────────────────────────────────────────

  function addRoom() {
    setRooms((prev) => [
      ...prev,
      { id: uid(), label: `Habitación ${prev.length + 1}`, sqm: "10" },
    ]);
  }

  function removeRoom(id: string) {
    setRooms((prev) => (prev.length > 2 ? prev.filter((r) => r.id !== id) : prev));
  }

  function updateRoom(id: string, field: keyof Room, value: string) {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  // ─── Expense handlers ──────────────────────────────────────────────────────

  function toggleExpense(id: string) {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e)));
  }

  function updateExpense(id: string, field: keyof Expense, value: string | boolean) {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  function addExpense() {
    setExpenses((prev) => [...prev, { id: uid(), label: "Otro gasto", amount: "0", enabled: true }]);
  }

  function removeExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    window.location.href = `${accessSignupUrl("inquilino")}&email=${encodeURIComponent(email)}`;
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-stone-950 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-sm px-3 py-1 rounded-full mb-6">
            <Sparkle size={14} weight="fill" />
            Herramienta gratuita — sin registro
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Calculadora de<br />alquiler justo
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Divide el alquiler según los m² de cada habitación. Zonas comunes y
            gastos compartidos a partes iguales. Sin conflictos.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="max-w-3xl mx-auto px-4 py-12 space-y-8">

        {/* 1 — Alquiler total */}
        <div className="bg-stone-50 rounded-2xl p-6">
          <label
            htmlFor={`${baseId}-rent`}
            className="flex items-center gap-2 text-xs font-semibold text-stone-500 mb-3 uppercase tracking-widest"
          >
            <House size={14} />
            Alquiler total mensual del piso
          </label>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-stone-300">€</span>
            <input
              id={`${baseId}-rent`}
              type="number"
              min={100}
              max={9999}
              step={50}
              value={totalRent}
              onChange={(e) => setTotalRent(e.target.value)}
              className="text-4xl font-bold w-full bg-transparent border-b-2 border-stone-300 focus:border-stone-900 outline-none pb-1 text-stone-900 transition-colors"
            />
            <span className="text-stone-400 text-lg shrink-0">/mes</span>
          </div>
        </div>

        {/* 2 — Habitaciones */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-widest">
              <Users size={14} />
              Habitaciones y m²
            </label>
            {rooms.length < 8 && (
              <button
                type="button"
                onClick={addRoom}
                className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={12} weight="bold" /> Añadir habitación
              </button>
            )}
          </div>

          <div className="space-y-3">
            {rooms.map((room, i) => (
              <div key={room.id} className="bg-stone-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={room.label}
                    onChange={(e) => updateRoom(room.id, "label", e.target.value)}
                    className="flex-1 bg-transparent font-semibold text-stone-800 border-b border-stone-300 focus:border-stone-600 outline-none pb-0.5 transition-colors text-sm min-w-0"
                    placeholder={`Habitación ${i + 1}`}
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={room.sqm}
                      onChange={(e) => updateRoom(room.id, "sqm", e.target.value)}
                      className="w-16 text-center bg-white border border-stone-300 focus:border-stone-600 outline-none rounded-lg py-1.5 text-sm font-bold text-stone-900 transition-colors"
                    />
                    <span className="text-xs text-stone-400 font-medium">m²</span>
                  </div>
                  {rooms.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeRoom(room.id)}
                      className="text-stone-300 hover:text-red-400 transition-colors shrink-0"
                      aria-label="Eliminar habitación"
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>

                {/* Preview del coste de esta hab */}
                {results && (() => {
                  const r = results.roomResults[i];
                  return r ? (
                    <div className="mt-3 pt-3 border-t border-stone-200 flex items-center justify-between">
                      <span className="text-xs text-stone-400">
                        {r.sqm}m² · {fmt(results.pricePerSqm)}&thinsp;€/m²
                      </span>
                      <span className="text-sm font-bold text-stone-700">
                        €{fmt(r.roomRent)}/mes
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>
            ))}
          </div>
        </div>

        {/* 3 — Zonas comunes */}
        <div className="bg-stone-50 rounded-2xl p-6">
          <label
            htmlFor={`${baseId}-common`}
            className="flex items-center gap-2 text-xs font-semibold text-stone-500 mb-1 uppercase tracking-widest"
          >
            Zonas comunes
          </label>
          <p className="text-xs text-stone-400 mb-4">
            Cocina, salón, baños, pasillos — se divide a partes iguales entre todos.
          </p>
          <div className="flex items-center gap-3">
            <input
              id={`${baseId}-common`}
              type="number"
              min={0}
              max={500}
              value={commonSqm}
              onChange={(e) => setCommonSqm(e.target.value)}
              className="w-24 text-center text-2xl font-bold bg-white border-2 border-stone-300 focus:border-stone-900 outline-none rounded-xl py-2 text-stone-900 transition-colors"
            />
            <span className="text-stone-500 font-medium">m²</span>
            {results && (
              <span className="text-xs text-stone-400 ml-auto">
                +€{fmt(results.sharedPerPerson)}/persona&thinsp;·&thinsp;mes
              </span>
            )}
          </div>
        </div>

        {/* 4 — Gastos compartidos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
              Gastos compartidos
            </label>
            <span className="text-xs text-stone-400">A partes iguales entre todos</span>
          </div>

          <div className="space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                  exp.enabled ? "bg-stone-50" : "bg-stone-50/40 opacity-50"
                }`}
              >
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleExpense(exp.id)}
                  className={`w-9 h-5 rounded-full transition-colors shrink-0 relative ${
                    exp.enabled ? "bg-stone-900" : "bg-stone-300"
                  }`}
                  aria-label={exp.enabled ? "Desactivar" : "Activar"}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      exp.enabled ? "left-[18px]" : "left-0.5"
                    }`}
                  />
                </button>

                {/* Icon */}
                <span className="text-stone-400 shrink-0">
                  {EXPENSE_ICONS[exp.label] ?? null}
                </span>

                {/* Label */}
                <input
                  type="text"
                  value={exp.label}
                  onChange={(e) => updateExpense(exp.id, "label", e.target.value)}
                  disabled={!exp.enabled}
                  className="flex-1 bg-transparent text-sm font-medium text-stone-700 outline-none min-w-0 disabled:text-stone-400"
                />

                {/* Amount */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-stone-400 text-sm">€</span>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={exp.amount}
                    onChange={(e) => updateExpense(exp.id, "amount", e.target.value)}
                    disabled={!exp.enabled}
                    className="w-16 text-center bg-white border border-stone-200 focus:border-stone-600 outline-none rounded-lg py-1 text-sm font-bold text-stone-900 transition-colors disabled:bg-stone-100 disabled:text-stone-400"
                  />
                  <span className="text-xs text-stone-400">/mes</span>
                </div>

                {/* Per person */}
                {exp.enabled && results && (
                  <span className="text-xs text-stone-400 shrink-0 w-20 text-right">
                    €{fmt((parseFloat(exp.amount) || 0) / rooms.length)}/pers.
                  </span>
                )}

                {/* Remove (only non-preset) */}
                {!["e1","e2","e3","e4"].includes(exp.id) && (
                  <button
                    type="button"
                    onClick={() => removeExpense(exp.id)}
                    className="text-stone-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash size={14} />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addExpense}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 px-4 py-2 transition-colors"
            >
              <Plus size={12} weight="bold" /> Añadir gasto
            </button>
          </div>
        </div>

        {/* 5 — Resultados */}
        {results && results.roomResults.length > 0 && (
          <div className="border-2 border-stone-900 rounded-2xl overflow-hidden">
            <div className="bg-stone-900 text-white px-6 py-4">
              <h2 className="font-bold text-lg">Reparto final</h2>
              <p className="text-white/60 text-sm">
                Alquiler €{fmt(parseFloat(totalRent) || 0)}/mes
                {results.totalExpenses > 0 && ` + €${fmt(results.totalExpenses)}/mes en gastos`}
              </p>
            </div>

            <div className="divide-y divide-stone-100">
              {results.roomResults.map((r) => (
                <div key={r.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-stone-800">{r.label}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {r.sqm}m² · alquiler&thinsp;€{fmt(r.roomRent)}/mes
                        {results.totalExpenses > 0 && ` · gastos&thinsp;€${fmt(r.expenses)}/mes`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-stone-900">€{fmt(r.total)}</p>
                      <p className="text-xs text-stone-400">/mes</p>
                    </div>
                  </div>

                  {/* Mini breakdown bar */}
                  {results.totalExpenses > 0 && (
                    <div className="mt-3 flex rounded-full overflow-hidden h-1.5 gap-px">
                      <div
                        className="bg-stone-800 rounded-full"
                        style={{ width: `${(r.roomRent / r.total) * 100}%` }}
                      />
                      <div
                        className="bg-stone-300 rounded-full"
                        style={{ width: `${(r.expenses / r.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Total row */}
              <div className="flex items-center justify-between px-6 py-3 bg-stone-50">
                <div className="text-sm text-stone-500 font-medium">
                  Total del piso
                  {results.totalExpenses > 0 && (
                    <span className="text-xs text-stone-400 ml-2">
                      alquiler + gastos
                    </span>
                  )}
                </div>
                <span className="font-bold text-stone-800">
                  €{fmt(results.roomResults.reduce((s, r) => s + r.total, 0))}/mes
                </span>
              </div>

              {/* Legend */}
              {results.totalExpenses > 0 && (
                <div className="flex items-center gap-4 px-6 py-3 bg-stone-50 border-t border-stone-100">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <span className="w-3 h-1.5 rounded-full bg-stone-800 inline-block" />
                    Alquiler (por m²)
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <span className="w-3 h-1.5 rounded-full bg-stone-300 inline-block" />
                    Gastos (igual)
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </section>

      {/* Email capture */}
      <section className="bg-stone-950 text-white py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          {submitted ? (
            <div>
              <div className="text-4xl mb-4">✓</div>
              <h2 className="text-2xl font-bold mb-2">¡Nos vemos dentro!</h2>
              <p className="text-white/60">Redirigiendo a tu cuenta…</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Gestiona gastos y convivencia en tu piso
              </h2>
              <p className="text-white/60 mb-8">
                Con moon llevas las cuentas del piso, reportas incidencias y construyes tu
                reputación como compañero. Gratis para inquilinos.
              </p>
              <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/60 transition-colors"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-stone-900 font-bold rounded-xl hover:bg-stone-100 transition-colors shrink-0"
                >
                  Empezar gratis
                  <ArrowRight size={16} weight="bold" />
                </button>
              </form>
              <p className="text-white/30 text-xs mt-4">Sin tarjeta de crédito. Siempre gratis para inquilinos.</p>
            </>
          )}
        </div>
      </section>

      {/* Contextual links */}
      <section className="max-w-3xl mx-auto px-4 py-10 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-stone-100">
        <p className="text-stone-500 text-sm">¿Buscas piso en Barcelona o Madrid?</p>
        <Link
          to="/alojamientos"
          className="flex items-center gap-1.5 text-sm font-semibold text-stone-800 hover:text-stone-600 transition-colors"
        >
          Ver pisos disponibles <ArrowRight size={14} />
        </Link>
      </section>

    </div>
  );
}
