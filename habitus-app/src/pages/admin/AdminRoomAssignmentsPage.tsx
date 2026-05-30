import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAdminRoomAssignments,
  createRoom,
  updateRoom,
  assignRoomHost,
  removeRoomHost,
  fetchAdminHosts,
  es,
  type RoomWithAssignment,
} from "@habitus/core";
import { Icon } from "../../components/Icon";
import { LoadingState, ErrorState } from "../../components/PageState";

const selectClass =
  "rounded-lg border border-border-light bg-white px-3 py-2 text-label-sm min-w-[140px]";
const inputClass =
  "rounded-lg border border-border-light bg-white px-3 py-2 text-label-sm w-full";

export function AdminRoomAssignmentsPage() {
  const [rooms, setRooms] = useState<RoomWithAssignment[]>([]);
  const [hosts, setHosts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filters
  const [cityFilter, setCityFilter] = useState("");
  const [hasHostFilter, setHasHostFilter] = useState<"all" | "assigned" | "unassigned">("all");

  // Create room modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    listingId: "",
    name: "",
    roomType: "individual",
    priceMonthly: "",
  });
  const [createBusy, setCreateBusy] = useState(false);

  // Assign host modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignRoomId, setAssignRoomId] = useState<string | null>(null);
  const [assignHostId, setAssignHostId] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchAdminRoomAssignments(), fetchAdminHosts()])
      .then(([roomsData, hostsData]) => {
        setRooms(roomsData);
        setHosts(hostsData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return rooms.filter((r) => {
      if (cityFilter && r.listing_city !== cityFilter) return false;
      if (hasHostFilter === "assigned" && !r.host_id) return false;
      if (hasHostFilter === "unassigned" && r.host_id) return false;
      return true;
    });
  }, [rooms, cityFilter, hasHostFilter]);

  const cities = useMemo(() => {
    const unique = new Set(rooms.map((r) => r.listing_city).filter(Boolean) as string[]);
    return Array.from(unique).sort();
  }, [rooms]);

  async function handleAssignHost() {
    if (!assignRoomId || !assignHostId || assignBusy) return;
    setAssignBusy(true);
    setError(null);

    const result = await assignRoomHost(assignRoomId, assignHostId);
    if (result.error) {
      setError(result.error);
    } else {
      setFeedback("Anfitrión asignado correctamente.");
      setTimeout(() => setFeedback(null), 3000);
      setShowAssignModal(false);
      load();
    }
    setAssignBusy(false);
  }

  async function handleRemoveHost(roomId: string) {
    if (busyId) return;
    setBusyId(roomId);
    setError(null);

    const result = await removeRoomHost(roomId);
    if (result.error) {
      setError(result.error);
    } else {
      setFeedback("Asignación eliminada.");
      setTimeout(() => setFeedback(null), 3000);
      load();
    }
    setBusyId(null);
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (
      createBusy ||
      !createForm.listingId ||
      !createForm.name ||
      !createForm.priceMonthly
    )
      return;

    setCreateBusy(true);
    setError(null);

    const result = await createRoom(
      createForm.listingId,
      createForm.name,
      createForm.roomType,
      Number(createForm.priceMonthly)
    );

    if (result.error) {
      setError(result.error);
    } else {
      setFeedback("Habitación creada correctamente.");
      setTimeout(() => setFeedback(null), 3000);
      setShowCreateModal(false);
      setCreateForm({ listingId: "", name: "", roomType: "individual", priceMonthly: "" });
      load();
    }
    setCreateBusy(false);
  }

  if (loading) return <LoadingState />;
  if (error && rooms.length === 0) return <ErrorState message={error} />;

  return (
    <div>
      <h1 className="text-headline-lg text-deep-navy">Asignación de Habitaciones</h1>
      <p className="mt-2 text-body-lg text-warm-slate">
        Asigna anfitriones a habitaciones individuales dentro de los listings.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-error-container/30 px-4 py-2 text-body-sm text-error">
          {error}
        </p>
      )}
      {feedback && (
        <p className="mt-4 rounded-lg bg-teal-accent/10 px-4 py-2 text-body-sm text-teal-accent">
          {feedback}
        </p>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-label-sm text-warm-slate">Ciudad</label>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className={selectClass}>
            <option value="">Todas</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-sm text-warm-slate">Asignación</label>
          <select
            value={hasHostFilter}
            onChange={(e) => setHasHostFilter(e.target.value as any)}
            className={selectClass}
          >
            <option value="all">Todas</option>
            <option value="assigned">Con anfitrión</option>
            <option value="unassigned">Sin anfitrión</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-teal-accent px-4 py-2 text-label-sm font-medium text-on-primary hover:bg-teal-accent/90"
        >
          + Crear habitación
        </button>
      </div>

      {/* Results count */}
      <p className="mt-3 text-label-sm text-warm-slate">
        {filtered.length} / {rooms.length} habitaciones
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="mt-8 text-body-lg text-warm-slate">
          No hay habitaciones con estos filtros.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border-light">
          <table className="w-full min-w-[1000px] text-left text-body-sm">
            <thead className="border-b border-border-light bg-surface-container">
              <tr>
                <th className="px-4 py-3 text-label-md text-deep-navy">Habitación</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Listing</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Propietario</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Tipo</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Precio</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Anfitrión</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((room) => (
                <tr key={room.id} className="border-b border-border-light align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-deep-navy">{room.name}</p>
                    <p className="text-[12px] text-warm-slate">{room.id.slice(0, 8)}...</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-deep-navy">{room.listing_name}</p>
                    <p className="text-[12px] text-warm-slate">{room.listing_city || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-deep-navy">{room.owner_name}</p>
                    <p className="text-[12px] text-warm-slate">{room.owner_email}</p>
                  </td>
                  <td className="px-4 py-3 text-warm-slate">{room.room_type}</td>
                  <td className="px-4 py-3 font-medium text-deep-navy">
                    {room.price_monthly} €
                  </td>
                  <td className="px-4 py-3">
                    {room.host_name ? (
                      <div>
                        <p className="font-medium text-deep-navy">{room.host_name}</p>
                        <p className="text-[12px] text-warm-slate">{room.host_email}</p>
                      </div>
                    ) : (
                      <span className="text-warm-slate italic">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === room.id}
                        onClick={() => {
                          setAssignRoomId(room.id);
                          setShowAssignModal(true);
                        }}
                        className="rounded border border-teal-accent px-2 py-0.5 text-[11px] text-teal-accent disabled:opacity-50 hover:bg-teal-accent/10"
                      >
                        {room.host_id ? "Cambiar" : "Asignar"}
                      </button>
                      {room.host_id && (
                        <button
                          type="button"
                          disabled={busyId === room.id}
                          onClick={() => handleRemoveHost(room.id)}
                          className="rounded border border-border-light px-2 py-0.5 text-[11px] text-warm-slate hover:bg-surface-container disabled:opacity-50"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign host modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-headline-md text-deep-navy">
              {rooms.find((r) => r.id === assignRoomId)?.host_name
                ? "Cambiar anfitrión"
                : "Asignar anfitrión"}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAssignHost();
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-label-sm text-deep-navy">Anfitrión</label>
                <select
                  value={assignHostId}
                  onChange={(e) => setAssignHostId(e.target.value)}
                  className={selectClass}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {hosts.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssignRoomId(null);
                    setAssignHostId("");
                  }}
                  className="rounded-lg border border-border-light px-4 py-2 text-label-sm hover:bg-surface-container"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={assignBusy || !assignHostId}
                  className="rounded-lg bg-teal-accent px-4 py-2 text-label-sm font-medium text-on-primary disabled:opacity-50 hover:bg-teal-accent/90"
                >
                  {assignBusy ? "Asignando..." : "Asignar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create room modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-headline-md text-deep-navy">Crear habitación</h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="mb-1 block text-label-sm text-deep-navy">ID del Listing</label>
                <input
                  type="text"
                  value={createForm.listingId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, listingId: e.target.value })
                  }
                  className={inputClass}
                  placeholder="UUID del listing..."
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-label-sm text-deep-navy">Nombre</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className={inputClass}
                  placeholder="Habitación 1, Room A..."
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-label-sm text-deep-navy">Tipo</label>
                <select
                  value={createForm.roomType}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, roomType: e.target.value })
                  }
                  className={selectClass}
                >
                  <option value="individual">Individual</option>
                  <option value="double">Doble</option>
                  <option value="suite">Suite</option>
                  <option value="studio">Studio</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-label-sm text-deep-navy">Precio mensual (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={createForm.priceMonthly}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, priceMonthly: e.target.value })
                  }
                  className={inputClass}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({
                      listingId: "",
                      name: "",
                      roomType: "individual",
                      priceMonthly: "",
                    });
                  }}
                  className="rounded-lg border border-border-light px-4 py-2 text-label-sm hover:bg-surface-container"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createBusy}
                  className="rounded-lg bg-teal-accent px-4 py-2 text-label-sm font-medium text-on-primary disabled:opacity-50 hover:bg-teal-accent/90"
                >
                  {createBusy ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
