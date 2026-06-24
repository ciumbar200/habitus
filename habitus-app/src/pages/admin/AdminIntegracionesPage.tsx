import { es } from "@habitus/core";
import { AdminPageShell } from "../../components/admin/AdminPageShell";
import { AdminIntegrationHealthBar } from "../../components/admin/AdminIntegrationHealthBar";
import { AdminAiConfigSection } from "../../components/admin/AdminAiConfigSection";
import { AdminStripeConfigSection } from "../../components/admin/AdminStripeConfigSection";
import { AdminPlatformInsightsSection } from "../../components/admin/AdminPlatformInsightsSection";

export function AdminIntegracionesPage() {
  return (
    <AdminPageShell
      title={es.admin.integrations.title}
      subtitle={es.admin.integrations.subtitle}
    >
      <AdminIntegrationHealthBar configureHref="/admin/integraciones" />
      <div className="mt-6 space-y-6">
        <AdminStripeConfigSection />
        <AdminAiConfigSection />
        <AdminPlatformInsightsSection />
        <p className="rounded-xl border border-border-light bg-surface-container/60 px-4 py-3 text-body-sm text-warm-slate">
          {es.admin.integrations.envNote}
        </p>
      </div>
    </AdminPageShell>
  );
}
