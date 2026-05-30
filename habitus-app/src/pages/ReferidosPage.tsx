import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getUserReferralStats,
  claimReferralReward,
  es,
  buildReferralUrl,
  type UserReferralStats,
} from "@habitus/core";
import { ReferralCard } from "../components/ReferralCard";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/Icon";

export function ReferidosPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    getUserReferralStats(user.id)
      .then((data) => {
        if (mounted) setStats(data);
      })
      .catch(() => {
        if (mounted) setStats(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  async function handleClaimReward() {
    if (!user?.id || claiming) return;
    setClaiming(true);
    setClaimResult(null);

    const result = await claimReferralReward(user.id);
    setClaimResult(result);
    setClaiming(false);

    if (result.success) {
      // Recargar stats después de reclamar
      getUserReferralStats(user.id).then(setStats);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="text-center text-body-lg text-warm-slate">Cargando...</div>
      </div>
    );
  }

  const hasGoal = stats !== null;
  const progress = hasGoal ? stats.progress : 0;
  const remaining = hasGoal ? stats.remainingCount : 5;
  const achieved = hasGoal && stats.status === "achieved";
  const rewarded = hasGoal && stats.status === "rewarded";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-accent/15">
          <Icon name="card_giftcard" className="text-[28px] text-teal-accent" />
        </div>
        <div>
          <h1 className="text-headline-lg text-deep-navy">Programa de Referidos</h1>
          <p className="text-body-sm text-warm-slate">
            Consigue 5 referidos y obtén un mes gratis de premium.
          </p>
        </div>
      </div>

      {user && <ReferralCard profileId={user.id} />}

      <section className="rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
        <h2 className="mb-4 text-headline-md text-deep-navy">Tu progreso</h2>

        {!hasGoal ? (
          <div className="text-center py-6">
            <p className="text-body-sm text-warm-slate">
              Tu meta de referidos se activará cuando tengas tu primer referido cualificado.
            </p>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="mb-4">
              <div className="mb-2 flex justify-between text-label-sm">
                <span className="text-deep-navy">Referidos cualificados</span>
                <span className="text-warm-slate">
                  {stats.currentCount} / {stats.goalCount}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
                <div
                  className="h-full rounded-full bg-teal-accent transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-body-sm text-warm-slate">
                {remaining > 0 ? (
                  <>Te faltan {remaining} referido{remaining > 1 ? "s" : ""} para alcanzar la meta.</>
                ) : achieved ? (
                  <>¡Has alcanzado la meta! 🎉</>
                ) : (
                  <>¡Meta completada! Ya has recibido tu recompensa.</>
                )}
              </p>
            </div>

            {/* Claim button */}
            {achieved && !rewarded && (
              <div className="mt-6 rounded-lg bg-teal-accent/10 p-4">
                <p className="mb-3 text-label-md text-deep-navy">
                  ¡Felicidades! Has alcanzado 5 referidos. Reclama tu recompensa:
                </p>
                <button
                  type="button"
                  onClick={handleClaimReward}
                  disabled={claiming}
                  className="rounded-lg bg-teal-accent px-4 py-2 text-label-sm font-medium text-on-primary transition-colors hover:bg-teal-accent/90 disabled:opacity-50"
                >
                  {claiming ? "Procesando..." : "Reclamar mes gratis de premium"}
                </button>

                {claimResult && (
                  <div
                    className={`mt-3 text-body-sm ${
                      claimResult.success ? "text-teal-accent" : "text-error"
                    }`}
                  >
                    {claimResult.success ? claimResult.message : claimResult.error}
                  </div>
                )}
              </div>
            )}

            {rewarded && (
              <div className="mt-6 rounded-lg bg-teal-accent/10 p-4">
                <p className="text-label-md text-deep-navy">
                  ✅ Ya has recibido tu recompensa: 1 mes gratis de premium.
                </p>
                {stats.rewardedAt && (
                  <p className="mt-1 text-body-sm text-warm-slate">
                    Recibido el {new Date(stats.rewardedAt).toLocaleDateString("es-ES")}
                  </p>
                )}
              </div>
            )}

            {/* How it works */}
            <div className="mt-6 rounded-lg bg-surface-container p-4">
              <h3 className="mb-2 text-label-md text-deep-navy">¿Cómo funcionan los referidos cualificados?</h3>
              <ul className="space-y-2 text-body-sm text-warm-slate">
                <li className="flex gap-2">
                  <span className="text-teal-accent">•</span>
                  <span>Comparte tu enlace único con amigos</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-teal-accent">•</span>
                  <span>
                    Se cuenta como "cualificado" cuando tu referido completa el onboarding
                    y verifica su identidad
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-teal-accent">•</span>
                  <span>Al llegar a 5 referidos cualificados, obtienes 1 mes gratis de premium</span>
                </li>
              </ul>
            </div>
          </>
        )}
      </section>

      {/* Distinction from ambassadors */}
      <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-body-sm text-amber-950">
          <strong>Nota:</strong> Este es el programa de referidos para usuarios. Si eres embajador
          (influencer), tu panel de comisiones está en{" "}
          <Link to="/embajadores" className="text-teal-accent hover:underline">
            /embajadores
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
