import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  accountRoleLabel,
  adminSetAccountRole,
  adminSuspendUser,
  es,
  fetchAdminUsersExtended,
  type AccountRoleSlug,
  type AdminUserExtended,
} from "@habitus/core";
import { Icon } from "../../components/Icon";
import { IdentityBadge } from "../../components/IdentityBadge";
import { useAuth } from "../../context/AuthContext";

const ALL_ROLES: AccountRoleSlug[] = ["inquilino", "anfitrion", "propietario", "agencia", "embajador"];

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const [userRow, setUserRow] = useState<AdminUserExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetchAdminUsersExtended()
      .then((rows) => setUserRow(rows.find((r) => r.id === id) ?? null))
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleSuspend() {
    if (!userRow || busy) return;
    setBusy(true);
    const suspend = !userRow.suspendedAt;
    const err = await adminSuspendUser(userRow.id, suspend);
    if (err) { setError(err); }
    else {
      setUserRow((prev) => prev ? { ...prev, suspendedAt: suspend ? new Date().toISOString() : null } : prev);
      setFeedback(suspend ? "Cuenta suspendida." : "Cuenta reactivada.");
      setTimeout(() => setFeedback(null), 3000);
    }
    setBusy(false);
  }

  async function handleRoleChange(role: AccountRoleSlug) {
    if (!userRow || busy) return;
    setBusy(true);
    const err = await adminSetAccountRole(userRow.id, role);
    if (err) { setError(err); }
    else {
      setUserRow((prev) => prev ? { ...prev, accountRole: role } : prev);
      setFeedback("Rol actualizado.");
      setTimeout(() => setFeedback(null), 3000);
    }
    setBusy(false);
  }

  if (loading) {
    return <div className="py-12 text-center text-body-sm text-warm-slate">Cargando…</div>;
  }
  if (!userRow) {
    return (
      <div className="py-12 text-center">
        <p className="text-body-sm text-warm-slate">Usuario no encontrado.</p>
        <Link to="/admin/usuarios" className="mt-4 inline-block text-label-sm text-teal-accent">
          ← Volver a usuarios
        </Link>
      </div>
    );
  }

  const isSuspended = Boolean(userRow.suspendedAt);
  const isDeleted = Boolean(userRow.deletedAt);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/admin/usuarios")}
          className="flex items-center gap-1 text-label-sm text-warm-slate hover:text-deep-navy"
        >
          <Icon name="arrow_back" className="text-[16px]" />
          Usuarios
        </button>
        <span className="text-warm-slate/40">/</span>
        <span className="text-label-sm text-deep-navy">{userRow.displayName}</span>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-error-container/30 px-4 py-2 text-body-sm text-error">{error}</p>
      )}
      {feedback && (
        <p className="mb-4 rounded-lg bg-teal-accent/10 px-4 py-2 text-body-sm text-teal-accent">{feedback}</p>
      )}

      {/* Header */}
      <div className="mb-6 rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
        <div className="flex items-start gap-4">
          {userRow.displayName && (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-accent/15 text-headline-md font-bold text-teal-accent">
              {userRow.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-headline-md text-deep-navy">{userRow.displayName || "Sin nombre"}</h1>
            <p className="text-body-sm text-warm-slate">{userRow.email}</p>
            <p className="mt-1 text-body-sm text-warm-slate">ID: {userRow.id}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {isSuspended && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                Suspendida
              </span>
            )}
            {isDeleted && (
              <span className="rounded-full bg-error-container/50 px-2 py-0.5 text-[11px] font-medium text-error">
                Eliminada
              </span>
            )}
            {!isSuspended && !isDeleted && (
              <span className="rounded-full bg-teal-accent/10 px-2 py-0.5 text-[11px] font-medium text-teal-accent">
                Activa
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-label-sm text-warm-slate">Rol</p>
            <p className="text-body-sm text-deep-navy">
              {accountRoleLabel(userRow.accountRole) || "Sin rol"}
            </p>
          </div>
          <div>
            <p className="text-label-sm text-warm-slate">Identidad</p>
            <IdentityBadge status={userRow.identityStatus} size="sm" />
          </div>
          <div>
            <p className="text-label-sm text-warm-slate">Score perfil</p>
            <p className="text-body-sm text-deep-navy">{userRow.profileScore}%</p>
          </div>
          <div>
            <p className="text-label-sm text-warm-slate">Ciudad</p>
            <p className="text-body-sm text-deep-navy">{userRow.city || "—"}</p>
          </div>
          <div>
            <p className="text-label-sm text-warm-slate">Registro</p>
            <p className="text-body-sm text-deep-navy">
              {new Date(userRow.createdAt).toLocaleDateString("es-ES")}
            </p>
          </div>
          <div>
            <p className="text-label-sm text-warm-slate">Onboarding</p>
            <p className="text-body-sm text-deep-navy">
              {userRow.onboardingCompletedAt
                ? new Date(userRow.onboardingCompletedAt).toLocaleDateString("es-ES")
                : "Pendiente"}
            </p>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
        <h2 className="mb-4 text-headline-md text-deep-navy">Acciones</h2>

        <div className="mb-4">
          <p className="mb-2 text-label-sm text-warm-slate">{es.admin.userDetail.changeRole}</p>
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                disabled={busy || userRow.accountRole === role}
                onClick={() => handleRoleChange(role)}
                className={`rounded-lg border px-3 py-1.5 text-label-sm transition-colors disabled:opacity-50 ${
                  userRow.accountRole === role
                    ? "border-teal-accent bg-teal-accent/10 text-teal-accent"
                    : "border-border-light text-deep-navy hover:bg-surface-container"
                }`}
              >
                {accountRoleLabel(role)}
                {userRow.accountRole === role && " ✓"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border-light pt-4">
          <button
            type="button"
            disabled={busy || isDeleted}
            onClick={handleSuspend}
            className={`rounded-lg border px-4 py-2 text-label-sm transition-colors disabled:opacity-50 ${
              isSuspended
                ? "border-teal-accent text-teal-accent hover:bg-teal-accent/10"
                : "border-amber-400 text-amber-700 hover:bg-amber-50"
            }`}
          >
            {isSuspended ? es.admin.userDetail.unsuspend : es.admin.userDetail.suspend}
          </button>
          {userRow.isAdmin && (
            <span className="rounded-lg border border-border-light px-4 py-2 text-label-sm text-warm-slate">
              Admin
              {userRow.adminRole ? ` (${userRow.adminRole})` : ""}
            </span>
          )}
        </div>
      </div>

      {adminUser && (
        <p className="text-center text-body-sm text-warm-slate/50">
          Cambios registrados en auditoría como {adminUser.email}
        </p>
      )}
    </div>
  );
}
