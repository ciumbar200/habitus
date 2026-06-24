import { useCallback, useEffect, useMemo, useState } from "react";
import {
  accountRoleLabel,
  adminBulkSetDiscoverable,
  adminBulkSetIdentityStatus,
  adminSetIdentityStatus,
  adminSetAccountRole,
  adminSuspendUser,
  es,
  exportUsersCsv,
  fetchAdminUsersExtended,
  importUsersFromCsv,
  mapUserCsvRecords,
  fetchAdminImportHealth,
  setUserAdmin,
  setUserDiscoverable,
  USERS_CSV_HEADERS,
  usersCsvExample,
  validateUserCsvRecords,
  type AccountRoleSlug,
  type AdminUserExtended,
  type IdentityStatus,
} from "@habitus/core";
import { AdminBulkBar, AdminFilterField } from "../../components/admin/AdminToolbar";
import { AdminCsvImport } from "../../components/admin/AdminCsvImport";
import { IdentityBadge } from "../../components/IdentityBadge";
import { LoadingState, ErrorState } from "../../components/PageState";
import { AdminAlert, AdminPageShell } from "../../components/admin/AdminPageShell";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router-dom";

const selectClass =
  "rounded-lg border border-border-light bg-white px-3 py-2 text-label-sm min-w-[120px]";
const inputClass =
  "rounded-lg border border-border-light bg-white px-3 py-2 text-label-sm w-full min-w-[200px]";

const ROLES: AccountRoleSlug[] = ["inquilino", "anfitrion", "propietario", "agencia", "embajador"];

export function AdminUsersPage() {
  const [rows, setRows] = useState<AdminUserExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [importServerReady, setImportServerReady] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [identityFilter, setIdentityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAdminUsersExtended()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchAdminImportHealth()
      .then((h) => setImportServerReady(h.importUsersReady))
      .catch(() => setImportServerReady(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (roleFilter && row.accountRole !== roleFilter) return false;
      if (identityFilter && row.identityStatus !== identityFilter) return false;
      if (statusFilter === "suspended" && !row.suspendedAt) return false;
      if (statusFilter === "deleted" && !row.deletedAt) return false;
      if (statusFilter === "active" && (row.suspendedAt || row.deletedAt)) return false;
      if (!q) return true;
      return (
        row.displayName.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q)
      );
    });
  }, [rows, search, roleFilter, identityFilter, statusFilter]);

  const filteredIds = useMemo(() => new Set(filtered.map((r) => r.id)), [filtered]);
  const selectedInView = useMemo(
    () => [...selected].filter((id) => filteredIds.has(id)),
    [selected, filteredIds],
  );
  const allFilteredSelected =
    filtered.length > 0 && selectedInView.length === filtered.length;

  function clearFilters() {
    setSearch("");
    setRoleFilter("");
    setIdentityFilter("");
    setStatusFilter("");
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const row of filtered) next.add(row.id);
      return next;
    });
  }

  function deselectAll() {
    setSelected(new Set());
  }

  async function toggleAdmin(row: AdminUserExtended) {
    setBusyId(row.id);
    const err = await setUserAdmin(row.id, !row.isAdmin);
    if (err) setError(err);
    else setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, isAdmin: !r.isAdmin } : r)));
    setBusyId(null);
  }

  async function toggleAmbassador(row: AdminUserExtended) {
    setBusyId(row.id);
    const newRole = row.accountRole === "embajador" ? null : "embajador";
    const err = await adminSetAccountRole(row.id, newRole);
    if (err) setError(err);
    else
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, accountRole: newRole as AccountRoleSlug | null } : r)),
      );
    setBusyId(null);
  }

  async function toggleDiscoverable(row: AdminUserExtended) {
    setBusyId(row.id);
    const err = await setUserDiscoverable(row.id, !row.isDiscoverable);
    if (err) setError(err);
    else
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, isDiscoverable: !r.isDiscoverable } : r)),
      );
    setBusyId(null);
  }

  async function setIdentity(row: AdminUserExtended, status: IdentityStatus) {
    setBusyId(row.id);
    setError(null);
    const err = await adminSetIdentityStatus(row.id, status);
    if (err) setError(err);
    else setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, identityStatus: status } : r)));
    setBusyId(null);
  }

  async function toggleSuspend(row: AdminUserExtended) {
    setBusyId(row.id);
    const suspend = !row.suspendedAt;
    const err = await adminSuspendUser(row.id, suspend);
    if (err) setError(err);
    else
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, suspendedAt: suspend ? new Date().toISOString() : null } : r,
        ),
      );
    setBusyId(null);
  }

  async function runBulk<T extends Partial<AdminUserExtended>>(
    action: () => Promise<string | null>,
    patch: T,
  ) {
    const ids = selectedInView;
    if (ids.length === 0) return;
    setBulkBusy(true);
    setError(null);
    const err = await action();
    if (err) {
      setError(err);
    } else {
      const idSet = new Set(ids);
      setRows((prev) => prev.map((r) => (idSet.has(r.id) ? { ...r, ...patch } : r)));
      setSelected(new Set());
    }
    setBulkBusy(false);
  }

  if (loading) return <LoadingState />;
  if (error && rows.length === 0) return <ErrorState message={error} />;

  const f = es.admin.filters;
  const hasFilters = search || roleFilter || identityFilter || statusFilter;

  return (
    <AdminPageShell title={es.admin.usersTitle} subtitle={es.admin.usersSubtitle}>
      {error && <AdminAlert message={error} />}

      {importServerReady === false && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-body-sm text-amber-950">
          {es.admin.import.serverConfigError}
        </p>
      )}

      <AdminCsvImport
        title={es.admin.import.usersTitle}
        hint={es.admin.import.usersHint}
        exampleFilename="habitus-usuarios-ejemplo.csv"
        exampleContent={usersCsvExample()}
        headers={USERS_CSV_HEADERS}
        mapRecords={mapUserCsvRecords}
        validateRecords={(records) => {
          const err = validateUserCsvRecords(records);
          return err === "empty" ? es.admin.import.invalidFile : err;
        }}
        getAccessToken={async () => {
          const { data } = await supabase.auth.getSession();
          return data.session?.access_token ?? null;
        }}
        importRows={(rows, token) => importUsersFromCsv(rows, token ?? "")}
        onComplete={() => load()}
        importDisabled={importServerReady === false}
        extraAction={{
          label: es.admin.import.exportUsers,
          busy: exportBusy,
          onClick: async () => {
            setExportBusy(true);
            setError(null);
            try {
              const { data } = await supabase.auth.getSession();
              const token = data.session?.access_token;
              if (!token) {
                setError(es.admin.import.authRequired);
                return;
              }
              await exportUsersCsv(token);
            } catch (e) {
              setError(e instanceof Error ? e.message : es.common.errorLoad);
            } finally {
              setExportBusy(false);
            }
          },
        }}
      />

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <AdminFilterField label={f.searchUsers} className="min-w-[220px] flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={f.searchUsers}
            className={inputClass}
          />
        </AdminFilterField>
        <AdminFilterField label={f.role}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">{f.allRoles}</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {accountRoleLabel(role)}
              </option>
            ))}
          </select>
        </AdminFilterField>
        <AdminFilterField label={f.verification}>
          <select
            value={identityFilter}
            onChange={(e) => setIdentityFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">{f.allVerification}</option>
            <option value="none">{es.identity.notVerified}</option>
            <option value="pending">{es.identity.pending}</option>
            <option value="verified">{es.identity.verified}</option>
          </select>
        </AdminFilterField>
        <AdminFilterField label="Estado">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">Todos</option>
            <option value="active">Activa</option>
            <option value="suspended">Suspendida</option>
            <option value="deleted">Eliminada</option>
          </select>
        </AdminFilterField>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-border-light px-3 py-2 text-label-sm hover:bg-surface-container"
          >
            {f.clear}
          </button>
        )}
      </div>

      <p className="mt-3 text-label-sm text-warm-slate">
        {filtered.length} / {rows.length}
      </p>

      <AdminBulkBar
        selectedCount={selectedInView.length}
        filteredCount={filtered.length}
        allSelected={allFilteredSelected}
        busy={bulkBusy}
        onToggleAll={toggleAllFiltered}
        onDeselectAll={deselectAll}
        actions={[
          {
            label: es.admin.bulk.verifyIdentity,
            variant: "primary",
            onClick: () =>
              runBulk(
                () => adminBulkSetIdentityStatus(selectedInView, "verified"),
                { identityStatus: "verified" },
              ),
          },
          {
            label: es.admin.bulk.makeVisible,
            onClick: () =>
              runBulk(
                () => adminBulkSetDiscoverable(selectedInView, true),
                { isDiscoverable: true },
              ),
          },
          {
            label: es.admin.bulk.makeHidden,
            onClick: () =>
              runBulk(
                () => adminBulkSetDiscoverable(selectedInView, false),
                { isDiscoverable: false },
              ),
          },
        ]}
      />

      {filtered.length === 0 ? (
        <p className="mt-8 text-body-lg text-warm-slate">{f.noResults}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border-light">
          <table className="w-full min-w-[920px] text-left text-body-sm">
            <thead className="border-b border-border-light bg-surface-container">
              <tr>
                <th className="w-10 px-3 py-3" />
                <th className="px-4 py-3 text-label-md text-deep-navy">{es.admin.table.name}</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">{es.admin.userDetail.email}</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">{es.admin.table.role}</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">{es.admin.table.identity}</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">{es.admin.table.score}</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">Estado</th>
                <th className="px-4 py-3 text-label-md text-deep-navy">
                  {es.admin.table.discoverable}
                </th>
                <th className="px-4 py-3 text-label-md text-deep-navy">{es.admin.table.admin}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-border-light align-top last:border-0">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      className="h-4 w-4 rounded border-border-light"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-deep-navy">
                    <Link
                      to={`/admin/usuarios/${row.id}`}
                      className="hover:text-teal-accent hover:underline"
                    >
                      {row.displayName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-warm-slate">{row.email}</td>
                  <td className="px-4 py-3 text-warm-slate">
                    <span>{row.accountRole ? accountRoleLabel(row.accountRole) : "—"}</span>
                    <div className="mt-1">
                      <button
                        type="button"
                        disabled={busyId === row.id || bulkBusy}
                        onClick={() => toggleAmbassador(row)}
                        className={`rounded-lg px-2 py-0.5 text-[11px] disabled:opacity-50 ${
                          row.accountRole === "embajador"
                            ? "border border-teal-accent text-teal-accent"
                            : "border border-border-light text-warm-slate"
                        }`}
                      >
                        {row.accountRole === "embajador" ? "✓ Embajador" : "Hacer embajador"}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <IdentityBadge status={row.identityStatus} size="sm" />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {row.identityStatus !== "verified" && (
                        <button
                          type="button"
                          disabled={busyId === row.id || bulkBusy}
                          onClick={() => setIdentity(row, "verified")}
                          className="rounded-lg border border-teal-accent px-2 py-0.5 text-[11px] text-teal-accent disabled:opacity-50"
                        >
                          {es.admin.verifyIdentity}
                        </button>
                      )}
                      {row.identityStatus !== "none" && (
                        <button
                          type="button"
                          disabled={busyId === row.id || bulkBusy}
                          onClick={() => setIdentity(row, "none")}
                          className="rounded-lg border border-border-light px-2 py-0.5 text-[11px] text-warm-slate disabled:opacity-50"
                        >
                          {es.admin.revokeIdentity}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-warm-slate">{row.profileScore}%</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busyId === row.id || bulkBusy}
                      onClick={() => toggleSuspend(row)}
                      className={`rounded-lg border px-2 py-0.5 text-[11px] transition-colors disabled:opacity-50 ${
                        row.deletedAt
                          ? "border-error/30 text-error"
                          : row.suspendedAt
                          ? "border-amber-400 bg-amber-50 text-amber-700"
                          : "border-border-light text-teal-accent hover:bg-surface-container"
                      }`}
                    >
                      {row.deletedAt ? "Eliminada" : row.suspendedAt ? "Suspendida" : "Activa"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busyId === row.id || bulkBusy}
                      onClick={() => toggleDiscoverable(row)}
                      className="rounded-lg border border-border-light px-3 py-1 text-label-sm transition-colors hover:bg-surface-container disabled:opacity-50"
                    >
                      {row.isDiscoverable ? es.admin.yes : es.admin.no}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busyId === row.id || bulkBusy}
                      onClick={() => toggleAdmin(row)}
                      className={`rounded-lg px-3 py-1 text-label-sm transition-colors disabled:opacity-50 ${
                        row.isAdmin
                          ? "bg-deep-navy text-on-primary"
                          : "border border-border-light hover:bg-surface-container"
                      }`}
                    >
                      {row.isAdmin ? es.admin.revokeAdmin : es.admin.grantAdmin}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPageShell>
  );
}
