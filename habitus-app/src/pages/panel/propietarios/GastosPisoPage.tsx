import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  actualizarGastoPiso,
  borrarGastoPiso,
  crearGastoPiso,
  getGastosPiso,
  getPisosPropietarioParaGastos,
  type GastoPeriodicidad,
  type GastoPisoTipo,
} from "@habitus/core";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";

type Piso = {
  id: string;
  name: string;
  location: string | null;
  city: string | null;
};

type Gasto = {
  id: string;
  concepto: string;
  importe: number;
  tipo: GastoPisoTipo;
  periodicidad: GastoPeriodicidad;
  fecha: string;
};

const emptyForm = {
  concepto: "",
  importe: "",
  tipo: "fijo" as GastoPisoTipo,
  periodicidad: "mensual" as GastoPeriodicidad,
  fecha: new Date().toISOString().slice(0, 10),
};

export function GastosPisoPage() {
  const { pisoId } = useParams<{ pisoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPiso = useMemo(
    () => pisos.find((piso) => piso.id === pisoId),
    [pisoId, pisos],
  );

  async function loadData() {
    if (!user?.id || !pisoId) return;
    setLoading(true);
    setError(null);
    const [pisosResult, gastosResult] = await Promise.all([
      getPisosPropietarioParaGastos(supabase, user.id),
      getGastosPiso(supabase, pisoId),
    ]);

    if (pisosResult.error) setError(pisosResult.error.message);
    if (gastosResult.error) setError(gastosResult.error.message);
    setPisos((pisosResult.data ?? []) as Piso[]);
    setGastos((gastosResult.data ?? []) as Gasto[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, [user?.id, pisoId]);

  const money = (value: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);

  const totalMensualizado = gastos.reduce((sum, gasto) => {
    const importe = Number(gasto.importe);
    if (gasto.periodicidad === "mensual") return sum + importe;
    if (gasto.periodicidad === "trimestral") return sum + importe / 3;
    if (gasto.periodicidad === "anual") return sum + importe / 12;
    return sum + importe;
  }, 0);

  function editGasto(gasto: Gasto) {
    setEditingId(gasto.id);
    setForm({
      concepto: gasto.concepto,
      importe: String(gasto.importe),
      tipo: gasto.tipo,
      periodicidad: gasto.periodicidad,
      fecha: gasto.fecha,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user?.id || !pisoId) return;
    setSaving(true);
    setError(null);

    const payload = {
      piso_id: pisoId,
      concepto: form.concepto.trim(),
      importe: Number(form.importe),
      tipo: form.tipo,
      periodicidad: form.periodicidad,
      fecha: form.fecha,
    };

    const result = editingId
      ? await actualizarGastoPiso(supabase, editingId, payload)
      : await crearGastoPiso(supabase, { ...payload, created_by: user.id });

    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    resetForm();
    await loadData();
  }

  async function handleDelete(gastoId: string) {
    if (!confirm("¿Borrar este gasto?")) return;
    const { error: deleteError } = await borrarGastoPiso(supabase, gastoId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setGastos((current) => current.filter((gasto) => gasto.id !== gastoId));
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 pb-8 pt-24 text-center text-gray-500">Cargando gastos...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-24">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="mb-4 text-gray-600 hover:text-gray-900">
            Volver
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Gastos del piso</h1>
          <p className="mt-1 text-gray-600">
            {selectedPiso ? `${selectedPiso.name} · ${selectedPiso.city ?? "Sin ciudad"}` : "Piso seleccionado"}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 text-right">
          <p className="text-sm text-gray-500">Gasto mensualizado</p>
          <p className="text-xl font-bold text-red-600">{money(totalMensualizado)}</p>
        </div>
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {pisos.length > 1 && (
        <div className="mb-6 rounded-lg border bg-white p-4">
          <label className="block text-sm font-medium text-gray-700">
            Cambiar piso
            <select
              value={pisoId}
              onChange={(event) => navigate(`/panel/propietarios/gastos/${event.target.value}`)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {pisos.map((piso) => (
                <option key={piso.id} value={piso.id}>
                  {piso.name} · {piso.city ?? "Sin ciudad"}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-semibold text-gray-900">{editingId ? "Editar gasto" : "Añadir gasto"}</h2>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Concepto</span>
            <input required value={form.concepto} onChange={(event) => setForm({ ...form, concepto: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Importe</span>
            <input required min="0.01" step="0.01" type="number" value={form.importe} onChange={(event) => setForm({ ...form, importe: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Tipo</span>
              <select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value as GastoPisoTipo })} className="mt-1 w-full rounded-lg border px-3 py-2">
                <option value="fijo">Fijo</option>
                <option value="variable">Variable</option>
                <option value="amortizacion">Amortización</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Periodicidad</span>
              <select value={form.periodicidad} onChange={(event) => setForm({ ...form, periodicidad: event.target.value as GastoPeriodicidad })} className="mt-1 w-full rounded-lg border px-3 py-2">
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
                <option value="unico">Único</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Fecha</span>
            <input required type="date" value={form.fecha} onChange={(event) => setForm({ ...form, fecha: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <div className="flex gap-3">
            <button disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50">
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Añadir gasto"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100">
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="rounded-lg border bg-white">
          {gastos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay gastos registrados para este piso.</div>
          ) : (
            <div className="divide-y">
              {gastos.map((gasto) => (
                <div key={gasto.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{gasto.concepto}</p>
                    <p className="text-sm text-gray-500">
                      {gasto.tipo} · {gasto.periodicidad} · {new Date(gasto.fecha).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{money(Number(gasto.importe))}</span>
                    <button onClick={() => editGasto(gasto)} className="text-sm text-brand-700 hover:text-brand-800">Editar</button>
                    <button onClick={() => handleDelete(gasto.id)} className="text-sm text-red-600 hover:text-red-700">Borrar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
