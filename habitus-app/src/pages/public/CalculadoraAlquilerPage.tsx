import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Calculator, House, Users, ArrowRight, Sparkle, Info } from "@phosphor-icons/react";
import { computeFairSplit } from "@habitus/core";
import { usePageMeta } from "../../hooks/usePageMeta";
import { accessSignupUrl } from "../../lib/accessLinks";

const MIN_ROOMS = 2;
const MAX_ROOMS = 6;

type RoomConfig = { label: string; weight: number };

function defaultRooms(n: number): RoomConfig[] {
  return Array.from({ length: n }, (_, i) => ({
    label: `Habitación ${i + 1}`,
    weight: 3,
  }));
}

const WEIGHT_LABELS: Record<number, string> = {
  1: "Pequeña / sin ventana",
  2: "Normal",
  3: "Buena",
  4: "Grande o luminosa",
  5: "Suite / terraza",
};

export function CalculadoraAlquilerPage() {
  usePageMeta(
    "Calculadora de alquiler justo para pisos compartidos | : moon",
    "Divide el alquiler de forma equitativa según el tamaño y calidad de cada habitación. Herramienta gratuita para co-living.",
    "/calculadora-alquiler",
  );

  const [totalRent, setTotalRent] = useState<string>("1200");
  const [numRooms, setNumRooms] = useState(3);
  const [rooms, setRooms] = useState<RoomConfig[]>(defaultRooms(3));
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const rentNum = parseFloat(totalRent) || 0;

  const splitLines = useMemo(() => {
    if (rentNum <= 0) return [];
    return computeFairSplit(
      rentNum,
      rooms.map((r, i) => ({
        profileId: String(i),
        displayName: r.label,
        roomLabel: r.label,
        weight: r.weight,
      })),
    );
  }, [rentNum, rooms]);

  function handleNumRoomsChange(n: number) {
    setNumRooms(n);
    setRooms((prev) => {
      if (n > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: n - prev.length }, (_, i) => ({
            label: `Habitación ${prev.length + i + 1}`,
            weight: 3,
          })),
        ];
      }
      return prev.slice(0, n);
    });
  }

  function handleRoomChange(i: number, field: keyof RoomConfig, value: string | number) {
    setRooms((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    // Redirige al funnel de signup con email pre-relleno
    window.location.href = `${accessSignupUrl("inquilino")}&email=${encodeURIComponent(email)}`;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-stone-950 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-sm px-3 py-1 rounded-full mb-6">
            <Sparkle size={14} weight="fill" />
            Herramienta gratuita
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Calculadora de<br />alquiler justo
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Divide el alquiler de tu piso compartido según el tamaño y calidad de cada habitación.
            Sin conflictos, sin Excel.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="grid gap-8">

          {/* Total rent */}
          <div className="bg-stone-50 rounded-2xl p-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-stone-600 mb-3 uppercase tracking-wide">
              <House size={16} />
              Alquiler total mensual
            </label>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-stone-400">€</span>
              <input
                type="number"
                min={100}
                max={9999}
                step={50}
                value={totalRent}
                onChange={(e) => setTotalRent(e.target.value)}
                className="text-4xl font-bold w-full bg-transparent border-b-2 border-stone-300 focus:border-stone-900 outline-none pb-1 text-stone-900 transition-colors"
              />
              <span className="text-stone-400 text-lg">/mes</span>
            </div>
          </div>

          {/* Num rooms */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-stone-600 mb-4 uppercase tracking-wide">
              <Users size={16} />
              Número de habitaciones
            </label>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: MAX_ROOMS - MIN_ROOMS + 1 }, (_, i) => i + MIN_ROOMS).map((n) => (
                <button
                  key={n}
                  onClick={() => handleNumRoomsChange(n)}
                  className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                    numRooms === n
                      ? "bg-stone-900 text-white shadow-md scale-105"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Room configs */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-stone-600 mb-4 uppercase tracking-wide">
              <Calculator size={16} />
              Calidad de cada habitación
            </label>
            <div className="flex items-start gap-1.5 text-xs text-stone-500 mb-4 bg-blue-50 rounded-lg px-3 py-2">
              <Info size={14} className="shrink-0 mt-0.5 text-blue-400" />
              <span>
                Asigna más peso a habitaciones más grandes o con mejores condiciones (exterior, baño propio, etc.).
              </span>
            </div>
            <div className="grid gap-4">
              {rooms.map((room, i) => (
                <div key={i} className="bg-stone-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-7 h-7 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={room.label}
                      onChange={(e) => handleRoomChange(i, "label", e.target.value)}
                      className="flex-1 bg-transparent font-semibold text-stone-800 border-b border-stone-300 focus:border-stone-600 outline-none pb-0.5 transition-colors text-sm"
                      placeholder={`Habitación ${i + 1}`}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={room.weight}
                      onChange={(e) => handleRoomChange(i, "weight", parseInt(e.target.value))}
                      className="flex-1 accent-stone-900"
                    />
                    <span className="text-xs text-stone-500 w-32 shrink-0 text-right">
                      {WEIGHT_LABELS[room.weight]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          {splitLines.length > 0 && (
            <div className="border-2 border-stone-900 rounded-2xl overflow-hidden">
              <div className="bg-stone-900 text-white px-6 py-4">
                <h2 className="font-bold text-lg">Reparto</h2>
                <p className="text-white/60 text-sm">Alquiler total: €{rentNum.toLocaleString("es-ES")}/mes</p>
              </div>
              <div className="divide-y divide-stone-100">
                {splitLines.map((line) => {
                  const pct = ((line.amount / rentNum) * 100).toFixed(0);
                  return (
                    <div key={line.profileId} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="font-semibold text-stone-800">{line.displayName}</p>
                        <p className="text-xs text-stone-400">
                          Peso {line.weight} · {pct}% del total
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-stone-900">
                          €{line.amount.toLocaleString("es-ES")}
                        </p>
                        <p className="text-xs text-stone-400">/mes</p>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between px-6 py-3 bg-stone-50">
                  <span className="text-sm text-stone-500 font-medium">Total</span>
                  <span className="font-bold text-stone-800">
                    €{splitLines.reduce((s, l) => s + l.amount, 0).toLocaleString("es-ES")}/mes
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Email capture */}
      <section className="bg-stone-950 text-white py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          {submitted ? (
            <div className="text-center">
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
                Con : moon llevas las cuentas del piso, reportas incidencias y construyes tu reputación como compañero.
                Gratis para inquilinos.
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
        <p className="text-stone-500 text-sm">
          ¿Buscas piso en Barcelona o Madrid?
        </p>
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
