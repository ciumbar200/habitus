import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearContratoPiso } from "@habitus/core";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";

type ListingOption = { id: string; name: string; location: string | null; city: string | null; price_monthly: number };
type GroupOption = { id: string; name: string; city: string | null; target_members: number };

export function NuevoContratoPisoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [pisoId, setPisoId] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [rentaMensual, setRentaMensual] = useState("");
  const [fianzaTotal, setFianzaTotal] = useState("");
  const [condiciones, setCondiciones] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    async function loadOptions() {
      setLoading(true);
      const [listingsResult, groupsResult] = await Promise.all([
        supabase
          .from("habitus_listings")
          .select("id, name, location, city, price_monthly")
          .eq("owner_profile_id", user!.id)
          .order("name"),
        supabase
          .from("habitus_groups")
          .select("id, name, city, target_members")
          .in("status", ["forming", "ready"])
          .order("created_at", { ascending: false }),
      ]);

      if (listingsResult.error) setError(listingsResult.error.message);
      if (groupsResult.error) setError(groupsResult.error.message);
      setListings((listingsResult.data ?? []) as ListingOption[]);
      setGroups((groupsResult.data ?? []) as GroupOption[]);
      setLoading(false);
    }

    void loadOptions();
  }, [user]);

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === pisoId),
    [listings, pisoId],
  );

  useEffect(() => {
    if (selectedListing && !rentaMensual) {
      setRentaMensual(String(selectedListing.price_monthly));
      setFianzaTotal(String(Number(selectedListing.price_monthly) * 2));
    }
  }, [rentaMensual, selectedListing]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setError(null);

    const { data, error: createError } = await crearContratoPiso(supabase, {
      piso_id: pisoId,
      grupo_id: grupoId,
      propietario_id: user.id,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin || undefined,
      renta_mensual: Number(rentaMensual),
      fianza_total: Number(fianzaTotal),
      condiciones_especiales: condiciones || undefined,
    });

    setSaving(false);
    if (createError) {
      setError(createError.message);
      return;
    }
    navigate(`/panel/propietarios/contratos/${data.id}`);
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 pb-8 pt-24 text-center text-gray-500">Cargando opciones...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-24">
      <button onClick={() => navigate(-1)} className="mb-6 text-gray-600 hover:text-gray-900">Volver</button>
      <h1 className="text-2xl font-bold text-gray-900">Nuevo contrato de piso</h1>
      <p className="mt-1 text-gray-600">Crea un borrador para ofertarlo a un grupo.</p>

      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-lg border bg-white p-6">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Piso</span>
          <select required value={pisoId} onChange={(e) => setPisoId(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
            <option value="">Selecciona piso</option>
            {listings.map((listing) => (
              <option key={listing.id} value={listing.id}>{listing.name} · {listing.city ?? "Sin ciudad"}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Grupo</span>
          <select required value={grupoId} onChange={(e) => setGrupoId(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
            <option value="">Selecciona grupo</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name} · {group.target_members} miembros objetivo</option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Inicio</span>
            <input required type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Fin opcional</span>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Renta mensual</span>
            <input required min="1" type="number" value={rentaMensual} onChange={(e) => setRentaMensual(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Fianza total</span>
            <input required min="0" type="number" value={fianzaTotal} onChange={(e) => setFianzaTotal(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Condiciones especiales</span>
          <textarea value={condiciones} onChange={(e) => setCondiciones(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100">Cancelar</button>
          <button disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50">
            {saving ? "Guardando..." : "Crear borrador"}
          </button>
        </div>
      </form>
    </div>
  );
}
