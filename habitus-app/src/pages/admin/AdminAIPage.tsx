import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ErrorState, LoadingState, EmptyState } from "../../components/PageState";
import { AdminPageShell, AdminSection } from "../../components/admin/AdminPageShell";
import {
  AdminBadge,
  AdminDataTable,
  AdminTableBody,
  AdminTableHead,
  AdminTableRow,
  AdminTableTd,
  AdminTableTh,
} from "../../components/admin/AdminDataTable";
import { es } from "@habitus/core";

type Usage = {
  id: string;
  agent_name: string;
  model_used: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

type Safety = {
  id: string;
  subject_type: string;
  subject_id: string;
  risk_level: string;
  result: Record<string, unknown>;
};

function statusVariant(status: string): "success" | "warning" | "error" | "default" {
  if (status === "success" || status === "completed") return "success";
  if (status === "pending") return "warning";
  if (status === "error" || status === "failed") return "error";
  return "default";
}

function riskVariant(level: string): "success" | "warning" | "error" | "default" {
  if (level === "low") return "success";
  if (level === "medium") return "warning";
  if (level === "high" || level === "critical") return "error";
  return "default";
}

export function AdminAIPage() {
  const [usage, setUsage] = useState<Usage[]>([]);
  const [safety, setSafety] = useState<Safety[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      supabase
        .from("ai_usage_logs")
        .select("id,agent_name,model_used,status,error_message,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("safety_reviews")
        .select("id,subject_type,subject_id,risk_level,result")
        .order("created_at", { ascending: false })
        .limit(100),
    ])
      .then(([logs, reviews]) => {
        if (logs.error) throw logs.error;
        if (reviews.error) throw reviews.error;
        setUsage((logs.data ?? []) as Usage[]);
        setSafety((reviews.data ?? []) as Safety[]);
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <AdminPageShell title={es.admin.aiTitle} subtitle={es.admin.aiSubtitle}>
      <AdminSection
        title={es.admin.aiSafetyTitle}
        description={`${safety.length} revisiones en cola`}
      >
        {safety.length === 0 ? (
          <EmptyState
            icon="shield"
            title={es.admin.aiSafetyEmpty}
            description="Los agentes de safety marcarán contenido sospechoso aquí."
          />
        ) : (
          <div className="space-y-3">
            {safety.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border-light bg-surface-container/30 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-deep-navy">
                    {item.subject_type}: {item.subject_id.slice(0, 8)}…
                  </p>
                  <AdminBadge variant={riskVariant(item.risk_level)}>
                    Riesgo {item.risk_level}
                  </AdminBadge>
                </div>
                <p className="mt-2 text-body-sm text-warm-slate">
                  {String(item.result.explanation_internal ?? "Pendiente de revisión humana")}
                </p>
              </div>
            ))}
          </div>
        )}
      </AdminSection>

      <AdminSection
        title={es.admin.aiLogsTitle}
        description="Últimas 100 ejecuciones"
        className="mt-6"
      >
        <AdminDataTable empty={usage.length === 0} emptyMessage={es.admin.aiLogsEmpty} minWidth="720px">
          <AdminTableHead>
            <AdminTableTh>Fecha</AdminTableTh>
            <AdminTableTh>Agente</AdminTableTh>
            <AdminTableTh>Modelo</AdminTableTh>
            <AdminTableTh>Estado</AdminTableTh>
            <AdminTableTh>Error</AdminTableTh>
          </AdminTableHead>
          <AdminTableBody>
            {usage.map((item) => (
              <AdminTableRow key={item.id}>
                <AdminTableTd className="whitespace-nowrap text-warm-slate">
                  {new Date(item.created_at).toLocaleString("es-ES")}
                </AdminTableTd>
                <AdminTableTd>{item.agent_name}</AdminTableTd>
                <AdminTableTd className="text-warm-slate">{item.model_used}</AdminTableTd>
                <AdminTableTd>
                  <AdminBadge variant={statusVariant(item.status)}>{item.status}</AdminBadge>
                </AdminTableTd>
                <AdminTableTd className="max-w-[200px] truncate text-error">
                  {item.error_message ?? "—"}
                </AdminTableTd>
              </AdminTableRow>
            ))}
          </AdminTableBody>
        </AdminDataTable>
      </AdminSection>
    </AdminPageShell>
  );
}
