import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RoommateCard } from "../components/RoommateCard";
import { LoadingState, ErrorState } from "../components/PageState";
import { useBookmarks } from "../hooks/useBookmarks";
import { useAuth } from "../context/AuthContext";
import { es } from "@habitus/core";
import { fetchCompatQuiz, fetchShowcaseMembers, fetchVerifiedMembers } from "@habitus/core";
import type { Roommate } from "@habitus/core";
import { isSupabaseConfigured } from "../lib/supabase";

export function MatchesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isShowcaseSaved, toggleShowcase } = useBookmarks();
  const [showcase, setShowcase] = useState<Roommate[]>([]);
  const [verified, setVerified] = useState<Roommate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError(es.discover.configError);
      setLoading(false);
      return;
    }

    const quizPromise = user?.id ? fetchCompatQuiz(user.id) : Promise.resolve({});
    quizPromise
      .then((quiz) =>
        Promise.all([
          fetchShowcaseMembers(quiz),
          user?.id ? fetchVerifiedMembers(user.id, quiz) : Promise.resolve([]),
        ]),
      )
      .then(([s, v]) => {
        setShowcase(s);
        setVerified(v);
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleBookmark = async (slug: string, uuid?: string) => {
    if (!user) return;
    await toggleShowcase(slug, uuid);
  };

  const allEmpty = showcase.length === 0 && verified.length === 0;

  return (
    <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <section className="mb-stack-lg space-y-2">
        <h2 className="text-headline-lg-mobile text-deep-navy md:text-headline-lg">
          {es.matches.title}
        </h2>
        <p className="max-w-2xl text-body-lg text-warm-slate">{es.matches.subtitle}</p>
      </section>

      {loading && <LoadingState message={es.common.loading} />}
      {error && !loading && <ErrorState message={error} />}

      {!loading && !error && allEmpty && (
        <div className="rounded-xl border border-border-light bg-surface-container-lowest p-12 text-center card-shadow">
          <p className="text-body-md text-warm-slate">{es.matches.empty}</p>
        </div>
      )}

      {!loading && !error && verified.length > 0 && (
        <section className="mb-stack-lg">
          <h3 className="mb-4 text-headline-md text-deep-navy">{es.matches.verifiedMembers}</h3>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {verified.map((r) => (
              <RoommateCard
                key={r.id}
                roommate={r}
                isSaved={user ? isShowcaseSaved(r.slug) : false}
                onToggleBookmark={user ? handleBookmark : undefined}
                onConversationStarted={(id) => navigate(`/messages?c=${id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {!loading && !error && showcase.length > 0 && (
        <section>
          <h3 className="mb-4 text-headline-md text-deep-navy">{es.matches.showcaseMembers}</h3>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {showcase.map((r) => (
              <RoommateCard
                key={r.slug}
                roommate={r}
                isSaved={user ? isShowcaseSaved(r.slug) : false}
                onToggleBookmark={user ? handleBookmark : undefined}
                onConversationStarted={(id) => navigate(`/messages?c=${id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
