import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { es } from "@habitus/core";
import { Icon } from "../Icon";
import { fetchIntegrationHealth, type IntegrationHealth } from "../../lib/admin/integrations";

type PillProps = {
  label: string;
  ok: boolean;
  detail?: string;
  href?: string;
};

function StatusPill({ label, ok, detail, href }: PillProps) {
  const inner = (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-label-sm font-medium ${
        ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
      }`}
    >
      <Icon name={ok ? "check_circle" : "error"} className="text-[16px]" />
      <span>{label}</span>
      {detail && <span className="text-warm-slate/80">· {detail}</span>}
    </span>
  );
  if (href) {
    return (
      <Link to={href} className="transition-opacity hover:opacity-80">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function AdminIntegrationHealthBar({ configureHref = "/admin/integraciones" }: { configureHref?: string }) {
  const [health, setHealth] = useState<IntegrationHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchIntegrationHealth()
      .then(setHealth)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-body-sm text-red-800">{error}</p>
        <button type="button" onClick={load} className="text-label-sm font-medium text-red-900 underline">
          Reintentar
        </button>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="h-12 animate-pulse rounded-2xl bg-surface-container" aria-hidden />
    );
  }

  const allOk = health.stripe.ready && health.stripe.webhookConfigured && health.ai.configured;

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
        allOk ? "border-emerald-200/80 bg-emerald-50/50" : "border-amber-200/80 bg-amber-50/40"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill
          label="Stripe Identity"
          ok={health.stripe.ready}
          detail={
            health.stripe.ready
              ? health.stripe.stripeSecretSource === "database"
                ? "API en BD"
                : "API en Vercel"
              : "Falta API key o URL"
          }
          href={configureHref}
        />
        <StatusPill
          label="Webhook Stripe"
          ok={health.stripe.webhookConfigured}
          detail={health.stripe.webhookConfigured ? "Activo" : "Sin whsec_"}
          href={configureHref}
        />
        <StatusPill
          label="Motor IA"
          ok={health.ai.configured}
          detail={health.ai.configured ? "Conectado" : "Sin API key"}
          href={configureHref}
        />
      </div>
      <Link
        to={configureHref}
        className="inline-flex items-center gap-1.5 text-label-sm font-semibold text-deep-navy hover:text-teal-accent"
      >
        <Icon name="tune" className="text-[18px]" />
        {es.admin.integrations.configure}
      </Link>
    </div>
  );
}
