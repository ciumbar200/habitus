import { useEffect, useState } from "react";
import { accountRoleLabel, fetchAmbassadorReferrals, type ReferredUser } from "@habitus/core";
import { ReferralCard } from "../../components/ReferralCard";
import { useAuth } from "../../context/AuthContext";
import { Icon } from "../../components/Icon";

export function EmbajadoresPage() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<ReferredUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    fetchAmbassadorReferrals(user.id)
      .then((data) => { if (mounted) setReferrals(data); })
      .catch(() => { if (mounted) setReferrals([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-accent/15">
          <Icon name="star" className="text-[28px] text-teal-accent" />
        </div>
        <div>
          <h1 className="text-headline-lg text-deep-navy">Programa de Embajadores</h1>
          <p className="text-body-sm text-warm-slate">
            Comparte tu enlace y haz crecer la comunidad moon.
          </p>
        </div>
      </div>

      {user && <ReferralCard profileId={user.id} />}

      <section className="rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
        <h2 className="mb-4 text-headline-md text-deep-navy">Tus referidos</h2>

        {loading && (
          <p className="text-body-sm text-warm-slate">Cargando...</p>
        )}

        {!loading && referrals.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Icon name="group_add" className="text-[40px] text-warm-slate/40" />
            <p className="text-body-sm text-warm-slate">
              Todavía no has referido a nadie. ¡Comparte tu enlace!
            </p>
          </div>
        )}

        {!loading && referrals.length > 0 && (
          <ul className="divide-y divide-border-light">
            {referrals.map((r) => (
              <li key={r.referredId} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-label-md text-deep-navy">{r.displayName}</p>
                  <p className="text-body-sm text-warm-slate">
                    {accountRoleLabel(r.accountRole) || "Sin rol"}
                  </p>
                </div>
                <p className="text-body-sm text-warm-slate">
                  {new Date(r.joinedAt).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
