import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  cancelarContratoPiso,
  downloadPdfBytes,
  finalizarContratoPiso,
  generateContractPdf,
  getContratoPisoById,
  getMiembrosGrupoParaContrato,
  ofertarContratoPiso,
} from "@habitus/core";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";

type MemberRow = {
  profile_id: string;
  profile?: { display_name?: string } | null;
};

const estadoLabel: Record<string, string> = {
  borrador: "Borrador",
  pendiente_firma_grupos: "Pendiente de firma del grupo",
  activo: "Activo",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const estadoColor: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-800",
  pendiente_firma_grupos: "bg-yellow-100 text-yellow-800",
  activo: "bg-green-100 text-green-800",
  finalizado: "bg-blue-100 text-blue-800",
  cancelado: "bg-red-100 text-red-800",
};

export function ContratoPisoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contrato, setContrato] = useState<any>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadContrato() {
    if (!id) return;
    setLoading(true);
    const { data, error: loadError } = await getContratoPisoById(supabase, id);
    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }
    setContrato(data);
    if (data?.grupo_id) {
      const { data: membersData } = await getMiembrosGrupoParaContrato(supabase, data.grupo_id);
      setMembers((membersData ?? []) as MemberRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadContrato();
  }, [id]);

  const acceptedIds = useMemo(
    () => new Set(Object.keys(contrato?.aceptaciones_miembros ?? {})),
    [contrato],
  );

  async function runAction(action: () => PromiseLike<{ error?: { message: string } | null }>) {
    setActionLoading(true);
    setError(null);
    const result = await action();
    setActionLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    await loadContrato();
  }

  async function handleDownloadPdf() {
    if (!contrato) return;
    const acceptedMap = contrato.aceptaciones_miembros ?? {};
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
        ...members.map((member) => ({
          label: "Miembro del grupo",
          name: member.profile?.display_name || member.profile_id.slice(0, 8),
          acceptedAt: acceptedMap[member.profile_id] ?? null,
        })),
      ],
      monthlyRent: Number(contrato.renta_mensual),
      depositLabel: money(contrato.fianza_total),
      startDate: contrato.fecha_inicio,
      endDate: contrato.fecha_fin,
      specialConditions: contrato.condiciones_especiales,
    });
    downloadPdfBytes(`contrato-piso-${contrato.id.slice(0, 8)}.pdf`, bytes);
  }

  if (loading) {
    return <div className="px-4 pb-8 pt-24 text-center text-gray-500">Cargando contrato...</div>;
  }

  if (!contrato) {
    return <div className="px-4 pb-8 pt-24 text-center text-red-600">Contrato no encontrado</div>;
  }

  const esPropietario = user?.id === contrato.propietario_id;
  const money = (value: unknown) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value));

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-24">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">Volver</button>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${estadoColor[contrato.estado] ?? "bg-gray-100"}`}>
          {estadoLabel[contrato.estado] ?? contrato.estado}
        </span>
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="space-y-6 rounded-lg border bg-white p-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contrato de piso</h1>
          <p className="mt-1 text-gray-600">Referencia: {contrato.id.slice(0, 8)}</p>
        </div>

        <div className="grid gap-6 border-t pt-6 md:grid-cols-2">
          <section>
            <h2 className="mb-3 font-semibold text-gray-900">Piso</h2>
            <p className="text-gray-700">{contrato.piso?.name}</p>
            <p className="text-sm text-gray-500">{contrato.piso?.location}, {contrato.piso?.city}</p>
          </section>
          <section>
            <h2 className="mb-3 font-semibold text-gray-900">Grupo</h2>
            <p className="text-gray-700">{contrato.grupo?.name}</p>
            {contrato.grupo?.notes && <p className="text-sm text-gray-500">{contrato.grupo.notes}</p>}
          </section>
        </div>

        <div className="grid gap-6 border-t pt-6 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">Renta mensual</p>
            <p className="font-semibold text-gray-900">{money(contrato.renta_mensual)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fianza total</p>
            <p className="font-semibold text-gray-900">{money(contrato.fianza_total)}</p>
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
          <section className="border-t pt-6">
            <h2 className="mb-3 font-semibold text-gray-900">Condiciones especiales</h2>
            <p className="whitespace-pre-wrap text-gray-700">{contrato.condiciones_especiales}</p>
          </section>
        )}

        <section className="border-t pt-6">
          <h2 className="mb-3 font-semibold text-gray-900">Firmas del grupo</h2>
          {members.length === 0 ? (
            <p className="text-sm text-gray-500">No hay miembros confirmados en el grupo.</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.profile_id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <span className="text-gray-700">{member.profile?.display_name ?? member.profile_id.slice(0, 8)}</span>
                  <span className={acceptedIds.has(member.profile_id) ? "text-green-700" : "text-yellow-700"}>
                    {acceptedIds.has(member.profile_id) ? "Aceptado" : "Pendiente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border-t pt-6">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="rounded-lg border border-brand-200 px-4 py-2 text-brand-700 hover:bg-brand-50"
          >
            Descargar PDF del contrato
          </button>
        </section>

        {esPropietario && (
          <div className="flex flex-wrap gap-3 border-t pt-6">
            {contrato.estado === "borrador" && (
              <button
                disabled={actionLoading}
                onClick={() => runAction(() => ofertarContratoPiso(supabase, contrato.id, {
                  grupo_id: contrato.grupo_id,
                  fecha_inicio: contrato.fecha_inicio,
                  fecha_fin: contrato.fecha_fin,
                  renta_mensual: contrato.renta_mensual,
                  fianza_total: contrato.fianza_total,
                  distribucion_renta: contrato.distribucion_renta,
                  condiciones_especiales: contrato.condiciones_especiales,
                }))}
                className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Ofertar al grupo
              </button>
            )}
            {contrato.estado === "activo" && (
              <button
                disabled={actionLoading}
                onClick={() => runAction(() => finalizarContratoPiso(supabase, contrato.id))}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Finalizar contrato
              </button>
            )}
            {["borrador", "pendiente_firma_grupos", "activo"].includes(contrato.estado) && (
              <button
                disabled={actionLoading}
                onClick={() => runAction(() => cancelarContratoPiso(supabase, contrato.id, "Contrato cancelado por propietario"))}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Cancelar contrato
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
