import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  aceptarContratoPiso,
  downloadPdfBytes,
  generateContractPdf,
  getContratoPisoParaGrupo,
  rechazarContratoPiso,
} from "@habitus/core";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

export function GroupContratoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contrato, setContrato] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadContrato() {
    if (!id) return;
    setLoading(true);
    const { data, error: loadError } = await getContratoPisoParaGrupo(supabase, id);
    if (loadError) {
      setError(loadError.message);
    } else {
      setContrato(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadContrato();
  }, [id]);

  async function handleAceptar() {
    if (!contrato || !user?.id) return;
    setActionLoading(true);
    setError(null);
    const { error: acceptError } = await aceptarContratoPiso(supabase, contrato.id, user.id);
    setActionLoading(false);
    if (acceptError) {
      setError(acceptError.message);
      return;
    }
    await loadContrato();
  }

  async function handleRechazar() {
    if (!contrato || !user?.id) return;
    setActionLoading(true);
    setError(null);
    const { error: rejectError } = await rechazarContratoPiso(supabase, contrato.id, user.id);
    setActionLoading(false);
    if (rejectError) {
      setError(rejectError.message);
      return;
    }
    await loadContrato();
  }

  async function handleDownloadPdf() {
    if (!contrato) return;
    const bytes = await generateContractPdf({
      type: "piso",
      reference: contrato.id,
      title: "Contrato de piso completo",
      propertyName: contrato.piso?.name || "Piso",
      propertyLocation: contrato.piso ? `${contrato.piso.location}, ${contrato.piso.city}` : null,
      parties: [
        {
          label: "Propietario",
          name: contrato.propietario?.display_name || "Propietario",
          acceptedAt: contrato.created_at,
        },
        {
          label: "Miembro",
          name: "Tu aceptación",
          acceptedAt: user?.id ? contrato.aceptaciones_miembros?.[user.id] : null,
        },
      ],
      monthlyRent: Number(contrato.renta_mensual),
      depositLabel: money(contrato.fianza_total),
      startDate: contrato.fecha_inicio,
      endDate: contrato.fecha_fin,
      specialConditions: contrato.condiciones_especiales,
    });
    downloadPdfBytes(`contrato-grupo-${contrato.id.slice(0, 8)}.pdf`, bytes);
  }

  if (loading) {
    return <div className="px-4 pb-8 pt-24 text-center text-gray-500">Cargando contrato...</div>;
  }

  if (!contrato) {
    return <div className="px-4 pb-8 pt-24 text-center text-red-600">No hay contrato activo para este grupo.</div>;
  }

  const accepted = Boolean(user?.id && contrato.aceptaciones_miembros?.[user.id]);
  const money = (value: unknown) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value));

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-24">
      <button onClick={() => navigate(-1)} className="mb-6 text-gray-600 hover:text-gray-900">Volver</button>

      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="rounded-lg border bg-white p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Contrato del grupo</h1>
          <p className="mt-1 text-gray-600">{contrato.piso?.name} · {contrato.piso?.location}</p>
        </div>

        <div className="grid gap-4 border-t pt-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Renta mensual</p>
            <p className="text-lg font-semibold text-gray-900">{money(contrato.renta_mensual)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fianza total</p>
            <p className="text-lg font-semibold text-gray-900">{money(contrato.fianza_total)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Inicio</p>
            <p className="font-semibold text-gray-900">{new Date(contrato.fecha_inicio).toLocaleDateString("es-ES")}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fin</p>
            <p className="font-semibold text-gray-900">{contrato.fecha_fin ? new Date(contrato.fecha_fin).toLocaleDateString("es-ES") : "Indefinido"}</p>
          </div>
        </div>

        {contrato.condiciones_especiales && (
          <section className="mt-6 border-t pt-6">
            <h2 className="mb-3 font-semibold text-gray-900">Condiciones especiales</h2>
            <p className="whitespace-pre-wrap text-gray-700">{contrato.condiciones_especiales}</p>
          </section>
        )}

        <div className="mt-8 flex flex-wrap gap-3 border-t pt-6">
          <button type="button" onClick={handleDownloadPdf} className="rounded-lg border border-brand-200 px-4 py-2 text-brand-700 hover:bg-brand-50">
            Descargar PDF
          </button>
          {contrato.estado === "pendiente_firma_grupos" && !accepted && (
            <>
              <button disabled={actionLoading} onClick={handleAceptar} className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50">
                Acepto los términos
              </button>
              <button disabled={actionLoading} onClick={handleRechazar} className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50">
                Rechazar
              </button>
            </>
          )}
          {accepted && <p className="text-sm font-medium text-green-700">Has aceptado este contrato.</p>}
          {contrato.estado === "activo" && <p className="text-sm font-medium text-green-700">Contrato activo.</p>}
        </div>
      </div>
    </div>
  );
}
