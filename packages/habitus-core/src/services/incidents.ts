import { getSupabase } from "../client";
import type {
  GroupIncident,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
} from "../types/models";

/**
 * Incidencias de convivencia / mantenimiento dentro de un grupo (piso compartido).
 * Parte del "OS de la convivencia": un conviviente reporta (lavadora rota, fuga de
 * gas, ruido...) y el grupo la gestiona (open -> in_progress -> resolved).
 * El historial limpio y bien gestionado es señal reputacional para el Moon Score.
 */

type IncidentRow = {
  id: string;
  group_id: string;
  reported_by: string;
  title: string;
  description: string | null;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

function mapIncident(r: IncidentRow): GroupIncident {
  return {
    id: r.id,
    groupId: r.group_id,
    reportedBy: r.reported_by,
    title: r.title,
    description: r.description,
    category: r.category,
    severity: r.severity,
    status: r.status,
    resolutionNote: r.resolution_note,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at,
  };
}

export async function fetchGroupIncidents(groupId: string): Promise<GroupIncident[]> {
  const { data, error } = await getSupabase()
    .from("habitus_group_incidents")
    .select(
      "id, group_id, reported_by, title, description, category, severity, status, resolution_note, created_at, resolved_at",
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as IncidentRow[]).map(mapIncident);
}

export type CreateIncidentInput = {
  groupId: string;
  reportedBy: string;
  title: string;
  description?: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
};

export async function createGroupIncident(input: CreateIncidentInput): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_group_incidents")
    .insert({
      group_id: input.groupId,
      reported_by: input.reportedBy,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category: input.category,
      severity: input.severity,
    });
  return error ? error.message : null;
}

export async function updateIncidentStatus(
  incidentId: string,
  status: IncidentStatus,
  resolutionNote?: string,
): Promise<string | null> {
  const payload: Record<string, unknown> = { status };
  if (resolutionNote !== undefined) payload.resolution_note = resolutionNote;
  const { error } = await getSupabase()
    .from("habitus_group_incidents")
    .update(payload)
    .eq("id", incidentId);
  return error ? error.message : null;
}
