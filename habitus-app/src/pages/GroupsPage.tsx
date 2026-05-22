import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LivingGroupCard } from "../components/LivingGroupCard";
import { LoadingState, ErrorState } from "../components/PageState";
import { useAuth } from "../context/AuthContext";
import { es, fetchMyGroups, type LivingGroup } from "@habitus/core";
import { Icon } from "../components/Icon";

export function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<LivingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetchMyGroups(user.id)
      .then(setGroups)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <main className="mx-auto max-w-4xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <section className="mb-stack-lg flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-deep-navy">{es.groups.title}</h1>
          <p className="mt-2 max-w-2xl text-body-lg text-warm-slate">{es.groups.subtitle}</p>
        </div>
        <Link
          to="/grupos/nuevo"
          className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-5 py-3 text-label-md text-on-primary"
        >
          <Icon name="add" />
          {es.groups.create}
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-border-light bg-surface-container-low p-6">
        <h2 className="text-headline-md text-deep-navy">{es.public.groupsTitle}</h2>
        <p className="mt-2 text-body-md text-warm-slate">{es.public.groupsIntro}</p>
        <ol className="mt-4 space-y-2 text-body-sm text-warm-slate">
          <li>1. {es.public.groupsStep1}</li>
          <li>2. {es.public.groupsStep2}</li>
          <li>3. {es.public.groupsStep3}</li>
        </ol>
      </section>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && groups.length === 0 && (
        <div className="rounded-xl border border-dashed border-border-light p-10 text-center">
          <p className="text-body-lg text-warm-slate">{es.groups.empty}</p>
          <p className="mt-2 text-body-sm text-warm-slate">{es.groups.emptyHint}</p>
          <Link
            to="/grupos/nuevo"
            className="mt-6 inline-flex rounded-lg bg-teal-accent px-6 py-3 text-label-md text-on-primary"
          >
            {es.groups.create}
          </Link>
        </div>
      )}

      <div className="grid gap-4">
        {groups.map((g) => (
          <LivingGroupCard key={g.id} group={g} />
        ))}
      </div>
    </main>
  );
}
