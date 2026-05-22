import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { es, fetchCommunityEvents } from "@habitus/core";
import type { CommunityEvent } from "@habitus/core";
import { LoadingState, ErrorState } from "../components/PageState";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";

export function CommunityPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError(es.discover.configError);
      setLoading(false);
      return;
    }
    fetchCommunityEvents()
      .then(setEvents)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <h1 className="text-headline-lg text-deep-navy">{es.community.title}</h1>
      <p className="mt-2 max-w-2xl text-body-md text-warm-slate">{es.community.subtitle}</p>

      {!user && (
        <p className="mt-6 rounded-lg border border-border-light bg-surface-container-low px-4 py-3 text-body-md text-warm-slate">
          {es.community.signInCta}{" "}
          <Link to="/access" className="text-teal-accent hover:underline">
            {es.common.signIn}
          </Link>
        </p>
      )}

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && events.length === 0 && (
        <p className="mt-8 text-body-md text-warm-slate">{es.community.empty}</p>
      )}

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {events.map((ev) => (
          <li
            key={ev.id}
            className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest card-shadow"
          >
            {ev.coverImageUrl && (
              <img src={ev.coverImageUrl} alt="" className="h-40 w-full object-cover" />
            )}
            <div className="p-5">
              <p className="text-label-sm uppercase text-teal-accent">{ev.city}</p>
              <h2 className="mt-1 text-headline-md text-deep-navy">{ev.title}</h2>
              <p className="mt-2 line-clamp-3 text-body-md text-warm-slate">{ev.description}</p>
              <p className="mt-3 text-label-sm text-warm-slate">
                {new Date(ev.startsAt).toLocaleString("es-ES", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {ev.location ? ` · ${ev.location}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
