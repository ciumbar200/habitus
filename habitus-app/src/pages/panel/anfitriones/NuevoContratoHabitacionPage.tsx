import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearContratoHabitacion } from "@habitus/core";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";

type RoomOption = {
  id: string;
  name: string;
  price_monthly: number;
  listing?: { name?: string; city?: string | null } | null;
};

type ProfileOption = {
  id: string;
  display_name: string;
};

export function NuevoContratoHabitacionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [habitacionId, setHabitacionId] = useState("");
  const [inquilinoId, setInquilinoId] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [rentaMensual, setRentaMensual] = useState("");
  const [fianzaMeses, setFianzaMeses] = useState("2");
  const [condiciones, setCondiciones] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      setLoading(true);
      const [roomsResult, profilesResult] = await Promise.all([
        supabase
          .from("habitus_rooms")
          .select("id, name, price_monthly, listing:listing_id(name, city)")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("habitus_profiles")
          .select("id, display_name")
          .eq("account_role", "inquilino")
          .order("display_name"),
      ]);

      if (roomsResult.error) setError(roomsResult.error.message);
      if (profilesResult.error) setError(profilesResult.error.message);
      setRooms((roomsResult.data ?? []) as RoomOption[]);
      setProfiles((profilesResult.data ?? []) as ProfileOption[]);
      setLoading(false);
    }

    void loadOptions();
  }, []);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === habitacionId),
    [habitacionId, rooms],
  );

  useEffect(() => {
    if (selectedRoom && !rentaMensual) {
      setRentaMensual(String(selectedRoom.price_monthly));
    }
  }, [rentaMensual, selectedRoom]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setError(null);

    const { data, error: createError } = await crearContratoHabitacion(supabase, {
      habitacion_id: habitacionId,
      inquilino_id: inquilinoId,
      anfitrion_id: user.id,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin || undefined,
      renta_mensual: Number(rentaMensual),
      fianza_meses: Number(fianzaMeses),
      condiciones_especiales: condiciones || undefined,
    });

    setSaving(false);
    if (createError) {
      setError(createError.message);
      return;
    }
    navigate(`/panel/anfitriones/contratos/${data.id}`);
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 pb-8 pt-24 text-center text-gray-500">Cargando opciones...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-24">
      <button onClick={() => navigate(-1)} className="mb-6 text-gray-600 hover:text-gray-900">
        Volver
      </button>
      <h1 className="text-2xl font-bold text-gray-900">Nuevo contrato de habitación</h1>
      <p className="mt-1 text-gray-600">Crea un borrador y después envíalo al inquilino.</p>

      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-lg border bg-white p-6">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Habitación</span>
          <select required value={habitacionId} onChange={(e) => setHabitacionId(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
            <option value="">Selecciona habitación</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} · {room.listing?.name ?? "Piso"} {room.listing?.city ? `(${room.listing.city})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Inquilino</span>
          <select required value={inquilinoId} onChange={(e) => setInquilinoId(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
            <option value="">Selecciona inquilino</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>{profile.display_name}</option>
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
            <span className="text-sm font-medium text-gray-700">Fianza en meses</span>
            <input required min="0" type="number" value={fianzaMeses} onChange={(e) => setFianzaMeses(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
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
