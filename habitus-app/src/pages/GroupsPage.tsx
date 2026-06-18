import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LivingGroupCard } from "../components/LivingGroupCard";
import { LoadingState, ErrorState } from "../components/PageState";
import { useAuth } from "../context/AuthContext";
import { es, fetchMyGroupsWithMembership, type MyGroupEntry } from "@habitus/core";
import { Icon } from "../components/Icon";

export function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<MyGroupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetchMyGroupsWithMembership(user.id)
      .then(setGroups)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <main className="mx-auto max-w-4xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      {/* Hero gas-first: moon Gastos como puerta de entrada al OS de la convivencia */}
      <section className="mb-stack-lg rounded-2xl border border-teal-accent/30 bg-teal-accent/5 p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="mb-2 inline-block rounded-full bg-teal-accent/15 px-3 py-1 text-label-sm font-medium text-teal-accent">
              moon Gastos
            </span>
            <h1 className="text-headline-lg text-deep-navy">{es.gastos.title}</h1>
            <p className="mt-2 text-body-lg text-warm-slate">{es.gastos.subtitle}</p>
          </div>
          <Link
            to="/grupos/nuevo"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-accent px-5 py-3 text-label-md text-on-primary transition-opacity hover:opacity-90"
          >
            <Icon name="add" />
            Crear grupo
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {groups.length > 0 ? (
            <Link
              to={`/grupos/${groups[0].id}/invitar`}
              className="inline-flex items-center gap-2 rounded-lg border border-teal-accent/30 bg-white px-5 py-3 text-label-md text-teal-accent transition-opacity hover:opacity-90"
            >
              <Icon name="group" />
              Invitar miembros
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-lg border border-teal-accent/20 bg-white px-5 py-3 text-label-md text-teal-accent/40"
              title="Crea un grupo antes de invitar miembros"
            >
              <Icon name="group" />
              Invitar miembros
            </button>
          )}
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-border-light bg-surface-container-low p-6">
        <h2 className="text-headline-md text-deep-navy">{es.gastos.howTitle}</h2>
        <ol className="mt-4 space-y-2 text-body-sm text-warm-slate">
          <li>1. {es.gastos.step1}</li>
          <li>2. {es.gastos.step2}</li>
          <li>3. {es.gastos.step3}</li>
        </ol>
      </section>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && groups.length === 0 && (
        <div className="rounded-xl border border-dashed border-border-light p-10 text-center">
          <p className="text-body-lg text-warm-slate">{es.gastos.empty}</p>
          <p className="mt-2 text-body-sm text-warm-slate">{es.gastos.emptyHint}</p>
        </div>
      )}

      {!loading && !error && groups.length > 0 && (
        <>
          <h2 className="mb-4 text-headline-md text-deep-navy">{es.gastos.yourPisos}</h2>
          <div className="grid gap-4">
            {groups.map((g) => (
              <LivingGroupCard key={g.id} group={g} membershipPending={g.membershipPending} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
