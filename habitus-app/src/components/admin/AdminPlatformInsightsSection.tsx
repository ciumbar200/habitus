import { useCallback, useEffect, useState } from "react";
import {
  es,
  fetchAdminMarketplaceDashboard,
  fetchAdminStats,
  fetchMoonAccessReadiness,
} from "@habitus/core";
import { Icon } from "../Icon";
import { runMoonAgent } from "../../lib/ai/api";
import { aiErrorState, type AIErrorState } from "../../lib/ai/errors";
import { useI18n } from "../../lib/I18nContext";
import { supabase } from "../../lib/supabase";
import { AdminAlert, AdminSection, AdminStatCard } from "./AdminPageShell";
import { adminButtonPrimary } from "./AdminFormField";
import { AdminBadge } from "./AdminDataTable";

type PlatformInsight = {
  summary: string;
  health_score: number;
  critical_issues: string[];
  product_improvements: string[];
  growth_actions: string[];
  security_and_trust_notes: string[];
  priority_this_week: string[];
  confidence_score: number;
};

export function AdminPlatformInsightsSection() {
  const t = useI18n();
  const [insight, setInsight] = useState<PlatformInsight | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingLast, setLoadingLast] = useState(true);
  const [error, setError] = useState<AIErrorState | null>(null);
  const [preview, setPreview] = useState<{ users: number; listings: number; reports: number } | null>(null);

  const loadLast = useCallback(async () => {
    setLoadingLast(true);
    const { data } = await supabase
      .from("habitus_platform_config")
      .select("value")
      .eq("key", "last_admin_platform_insight")
      .maybeSingle();
    const v = data?.value as { result?: PlatformInsight; generated_at?: string } | null;
    if (v?.result) setInsight(v.result);
    setLoadingLast(false);
  }, []);

  useEffect(() => {
    void loadLast();
    void Promise.all([fetchAdminStats(), fetchMoonAccessReadiness()]).then(([stats, moon]) => {
      setPreview({
        users: stats.users,
        listings: stats.listingsPublished,
        reports: stats.openReports,
      });
      void moon;
    });
  }, [loadLast]);

  async function analyze() {
    setBusy(true);
    setError(null);
    try {
      const [stats, marketplace, moonAccess] = await Promise.all([
        fetchAdminStats(),
        fetchAdminMarketplaceDashboard(),
        fetchMoonAccessReadiness(),
      ]);
      const response = await runMoonAgent<PlatformInsight>(
        "adminPlatformInsightsAgent",
        { stats, marketplace, moonAccess, generated_at: new Date().toISOString() },
        { force: true },
      );
      setInsight(response.result);
      await loadLast();
    } catch (e) {
      setError(aiErrorState(e, es.admin.platformInsights.error, t.ai));
    } finally {
      setBusy(false);
    }
  }

  function healthVariant(score: number): "success" | "warning" | "error" {
    if (score >= 70) return "success";
    if (score >= 45) return "warning";
    return "error";
  }

  return (
    <AdminSection
      title={es.admin.platformInsights.title}
      description={es.admin.platformInsights.subtitle}
      actions={
        <button type="button" onClick={() => void analyze()} disabled={busy} className={adminButtonPrimary}>
          <Icon name="psychology" className="text-[18px]" />
          {busy ? es.admin.platformInsights.busy : es.admin.platformInsights.action}
        </button>
      }
    >
      {preview && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <AdminStatCard label="Usuarios" value={preview.users} icon="group" />
          <AdminStatCard label="Espacios publicados" value={preview.listings} icon="apartment" />
          <AdminStatCard label="Reportes abiertos" value={preview.reports} icon="flag" />
        </div>
      )}

      {error && (
        <div className="mb-4">
          <AdminAlert message={error.message} />
          {error.retryable && (
            <button type="button" onClick={() => void analyze()} disabled={busy} className={`mt-3 ${adminButtonPrimary}`}>
              {es.admin.platformInsights.retry}
            </button>
          )}
        </div>
      )}

      {loadingLast && !insight ? (
        <p className="text-body-sm text-warm-slate">Cargando análisis previo…</p>
      ) : !insight ? (
        <p className="rounded-xl border border-dashed border-border-light bg-surface-container/40 px-4 py-8 text-center text-body-sm text-warm-slate">
          {es.admin.platformInsights.empty}
        </p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-3xl text-body-md text-deep-navy">{insight.summary}</p>
            <AdminBadge variant={healthVariant(insight.health_score)}>
              Salud {insight.health_score}/100
            </AdminBadge>
          </div>

          <InsightList title={es.admin.platformInsights.critical} items={insight.critical_issues} variant="error" />
          <InsightList title={es.admin.platformInsights.product} items={insight.product_improvements} />
          <InsightList title={es.admin.platformInsights.growth} items={insight.growth_actions} />
          <InsightList title={es.admin.platformInsights.security} items={insight.security_and_trust_notes} />
          <InsightList title={es.admin.platformInsights.week} items={insight.priority_this_week} variant="info" />
        </div>
      )}
    </AdminSection>
  );
}

function InsightList({
  title,
  items,
  variant = "default",
}: {
  title: string;
  items: string[];
  variant?: "default" | "error" | "info";
}) {
  if (!items?.length) return null;
  const border =
    variant === "error"
      ? "border-red-100 bg-red-50/50"
      : variant === "info"
        ? "border-sky-100 bg-sky-50/40"
        : "border-border-light bg-surface-container/30";

  return (
    <div className={`rounded-xl border p-4 ${border}`}>
      <h3 className="text-label-md font-semibold text-deep-navy">{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-body-sm text-warm-slate">
            <span className="text-teal-accent">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
