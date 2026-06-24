import { useEffect, useState } from "react";
import { runMoonAgent } from "../../lib/ai/api";
import { aiErrorState, type AIErrorState } from "../../lib/ai/errors";
import { useI18n } from "../../lib/I18nContext";
import { supabase } from "../../lib/supabase";

type TenantResult = { lifestyle_tags: string[]; personality_summary: string; ideal_roommate_profile: string; recommended_property_type: string; confidence_score: number };

export function TenantAIProfileCard({ userId }: { userId: string }) {
  const t = useI18n();
  const [result, setResult] = useState<TenantResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AIErrorState | null>(null);
  useEffect(() => { void supabase.from("user_ai_profiles").select("result").eq("user_id", userId).maybeSingle().then(({ data }) => { if (data?.result) setResult(data.result as TenantResult); }); }, [userId]);
  async function analyze() {
    setBusy(true); setError(null);
    try {
      const [{ data: profile }, { data: tags }] = await Promise.all([
        supabase.from("habitus_profiles").select("bio_quote,search_prefs,compat_quiz,role_title").eq("id", userId).single(),
        supabase.from("habitus_profile_tags").select("tag").eq("profile_id", userId),
      ]);
      const response = await runMoonAgent<TenantResult>("tenantProfileAgent", { user_id: userId, bio: profile?.bio_quote, work_type: profile?.role_title, preferences: profile?.search_prefs, lifestyle: profile?.compat_quiz, existing_tags: (tags ?? []).map((item) => item.tag) }, { force: true });
      setResult(response.result);
    } catch (e) { setError(aiErrorState(e, t.ai.profileFallbackError, t.ai)); } finally { setBusy(false); }
  }
  return <section className="mb-stack-lg rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-label-sm uppercase tracking-wider text-teal-accent">{t.ai.profileLabel}</p><h3 className="text-headline-md text-deep-navy">{t.ai.profileTitle}</h3></div><button type="button" onClick={analyze} disabled={busy} className="rounded-lg bg-deep-navy px-4 py-2 text-label-sm text-white disabled:opacity-60">{busy ? t.ai.profileBusy : result ? t.ai.profileUpdate : t.ai.profileCreate}</button></div>{error && <AIErrorNotice error={error} busy={busy} onRetry={analyze} retryText={t.ai.retryButton} retryAfterText={t.ai.retryAfter} />}{!result && !error && <p className="mt-4 text-body-sm text-warm-slate">{t.ai.profileHint}</p>}{result && <div className="mt-5 space-y-4"><div className="flex flex-wrap gap-2">{result.lifestyle_tags.map((tag) => <span key={tag} className="rounded-full bg-surface-container px-3 py-1 text-label-sm text-deep-navy">{tag}</span>)}<span className="rounded-full bg-teal-accent/10 px-3 py-1 text-label-sm text-teal-accent">{t.ai.confidence} {Math.round(result.confidence_score)}%</span></div><p className="text-body-md text-on-surface-variant">{result.personality_summary}</p><p className="text-body-sm text-warm-slate"><strong className="text-deep-navy">{t.ai.idealRoommate}</strong> {result.ideal_roommate_profile}</p><p className="text-body-sm text-warm-slate"><strong className="text-deep-navy">{t.ai.recommendedSpace}</strong> {result.recommended_property_type}</p></div>}</section>;
}
function AIErrorNotice({ error, busy, onRetry, retryText, retryAfterText }: { error: AIErrorState; busy: boolean; onRetry: () => void; retryText: string; retryAfterText: string }) { return <div className="mt-4 rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container"><p>{error.message}{error.retryAfter ? ` ${retryAfterText.replace("{seconds}", String(error.retryAfter))}` : ""}</p>{error.retryable && <button type="button" disabled={busy} onClick={onRetry} className="mt-3 rounded-lg bg-deep-navy px-3 py-2 text-label-sm text-white disabled:opacity-60">{retryText}</button>}</div>; }
