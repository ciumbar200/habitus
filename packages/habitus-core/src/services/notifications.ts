import { getSupabase } from "../client";

export type NotificationEventType =
  | "application_submitted"
  | "application_status_changed"
  | "new_message"
  | "group_join_request"
  | "group_member_accepted"
  | "group_member_rejected"
  | "listing_access_granted"
  | "expense_added"
  | "lease_pending_signature";

export type NotificationChannel = "push" | "email" | "in_app";

export type NotificationEvent = {
  type: NotificationEventType;
  profileIds: string[];
  title: string;
  body: string;
  entityId?: string;
  deepLink?: string;
  channels?: NotificationChannel[];
  data?: Record<string, string>;
  idempotencyKey?: string;
};

export type InAppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPreferences = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  emailMessages: boolean;
  emailApplications: boolean;
  emailGroups: boolean;
};

const DEFAULT_PREFS: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  emailMessages: true,
  emailApplications: true,
  emailGroups: true,
};

function mapPrefs(row: Record<string, unknown> | null): NotificationPreferences {
  if (!row) return DEFAULT_PREFS;
  return {
    pushEnabled: row.push_enabled !== false,
    emailEnabled: row.email_enabled !== false,
    emailMessages: row.email_messages !== false,
    emailApplications: row.email_applications !== false,
    emailGroups: row.email_groups !== false,
  };
}

function mapNotification(row: Record<string, unknown>): InAppNotification {
  return {
    id: row.id as string,
    type: row.type as string,
    title: row.title as string,
    body: row.body as string,
    data: (row.data as Record<string, unknown>) ?? {},
    entityId: (row.entity_id as string) ?? null,
    readAt: (row.read_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const { data } = await getSupabase().auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // best-effort
  }
  return headers;
}

/** Encola evento push/email/in-app vía API serverless. */
export async function queueNotificationEvent(event: NotificationEvent): Promise<void> {
  if (typeof fetch === "undefined") return;
  try {
    const headers = await authHeaders();
    await fetch("/api/notify/event", {
      method: "POST",
      headers,
      body: JSON.stringify(event),
    });
  } catch {
    // best-effort
  }
}

export async function fetchNotifications(
  profileId: string,
  limit = 30,
): Promise<InAppNotification[]> {
  const { data, error } = await getSupabase()
    .from("habitus_notifications")
    .select("id, type, title, body, data, entity_id, read_at, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((r) => mapNotification(r as Record<string, unknown>));
}

export async function fetchUnreadNotificationCount(profileId: string): Promise<number> {
  const { count, error } = await getSupabase()
    .from("habitus_notifications")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
}

export async function markNotificationRead(
  profileId: string,
  notificationId: string,
): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("profile_id", profileId);

  return error?.message ?? null;
}

export async function markAllNotificationsRead(profileId: string): Promise<string | null> {
  const { error } = await getSupabase()
    .from("habitus_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .is("read_at", null);

  return error?.message ?? null;
}

export async function fetchNotificationPreferences(
  profileId: string,
): Promise<NotificationPreferences> {
  const { data, error } = await getSupabase()
    .from("habitus_notification_preferences")
    .select("push_enabled, email_enabled, email_messages, email_applications, email_groups")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) throw error;
  return mapPrefs(data as Record<string, unknown> | null);
}

export async function updateNotificationPreferences(
  profileId: string,
  prefs: Partial<NotificationPreferences>,
): Promise<string | null> {
  const row = {
    profile_id: profileId,
    push_enabled: prefs.pushEnabled,
    email_enabled: prefs.emailEnabled,
    email_messages: prefs.emailMessages,
    email_applications: prefs.emailApplications,
    email_groups: prefs.emailGroups,
    updated_at: new Date().toISOString(),
  };

  const { error } = await getSupabase()
    .from("habitus_notification_preferences")
    .upsert(row, { onConflict: "profile_id" });

  return error?.message ?? null;
}

function uniqueChannelSuffix(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function subscribeToNotifications(
  profileId: string,
  onChange: () => void,
  onInsert?: (notification: InAppNotification) => void,
): { unsubscribe: () => void } {
  // Cada suscriptor necesita su propio canal: Supabase no permite .on() tras subscribe()
  // en un topic ya suscrito (campana + toasts + página montados a la vez).
  const channel = getSupabase()
    .channel(`habitus-notifications-${profileId}-${uniqueChannelSuffix()}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "habitus_notifications",
        filter: `profile_id=eq.${profileId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT" && payload.new) {
          onInsert?.(mapNotification(payload.new as Record<string, unknown>));
        }
        onChange();
      },
    )
    .subscribe();

  return {
    unsubscribe: () => {
      void getSupabase().removeChannel(channel);
    },
  };
}

async function listingManagers(listingId: string): Promise<string[]> {
  const { data: listing } = await getSupabase()
    .from("habitus_listings")
    .select("owner_profile_id, host_profile_id")
    .eq("id", listingId)
    .maybeSingle();

  const ids = new Set<string>();
  if (listing?.owner_profile_id) ids.add(listing.owner_profile_id as string);
  if (listing?.host_profile_id) ids.add(listing.host_profile_id as string);

  const { data: assignments } = await getSupabase()
    .from("habitus_listing_assignments")
    .select("host_profile_id")
    .eq("listing_id", listingId);

  for (const a of assignments ?? []) {
    if (a.host_profile_id) ids.add(a.host_profile_id as string);
  }

  return [...ids];
}

export async function notifyApplicationSubmitted(input: {
  applicationId: string;
  listingId: string;
  listingName: string;
  applicantId: string;
  applicantName: string;
}): Promise<void> {
  const managers = await listingManagers(input.listingId);

  await queueNotificationEvent({
    type: "application_submitted",
    profileIds: [input.applicantId],
    title: "Solicitud enviada",
    body: `Tu solicitud para ${input.listingName} ha sido registrada.`,
    entityId: input.applicationId,
    deepLink: "/profile",
    idempotencyKey: `application_submitted:${input.applicationId}:${input.applicantId}`,
  });

  if (managers.length) {
    await queueNotificationEvent({
      type: "application_submitted",
      profileIds: managers.filter((id) => id !== input.applicantId),
      title: "Nueva solicitud de alquiler",
      body: `${input.applicantName} ha solicitado ${input.listingName}.`,
      entityId: input.applicationId,
      deepLink: "/panel/solicitudes",
      idempotencyKey: `application_submitted_mgr:${input.applicationId}`,
    });
  }
}

export async function notifyApplicationStatusChanged(input: {
  applicationId: string;
  applicantId: string;
  listingName: string;
  status: string;
  statusLabel: string;
}): Promise<void> {
  await queueNotificationEvent({
    type: "application_status_changed",
    profileIds: [input.applicantId],
    title: "Actualización de tu solicitud",
    body: `${input.listingName}: ${input.statusLabel}`,
    entityId: input.applicationId,
    deepLink: "/profile",
    data: { status: input.status },
    idempotencyKey: `application_status:${input.applicationId}:${input.status}`,
  });
}

export async function notifyNewMessage(input: {
  conversationId: string;
  recipientId: string;
  senderName: string;
  preview: string;
}): Promise<void> {
  const body =
    input.preview.length > 120 ? `${input.preview.slice(0, 117)}…` : input.preview;

  await queueNotificationEvent({
    type: "new_message",
    profileIds: [input.recipientId],
    title: `Mensaje de ${input.senderName}`,
    body,
    entityId: input.conversationId,
    deepLink: `/messages?c=${input.conversationId}`,
    idempotencyKey: `message:${input.conversationId}:${input.recipientId}:${Date.now().toString(36)}`,
  });
}

export async function notifyGroupJoinRequest(input: {
  groupId: string;
  groupSlug: string;
  groupName: string;
  leadProfileIds: string[];
  requesterName: string;
  requesterId: string;
}): Promise<void> {
  await queueNotificationEvent({
    type: "group_join_request",
    profileIds: input.leadProfileIds,
    title: "Solicitud para unirse al grupo",
    body: `${input.requesterName} quiere unirse a ${input.groupName}.`,
    entityId: input.groupId,
    deepLink: `/grupos/${input.groupSlug}`,
    idempotencyKey: `group_join:${input.groupId}:${input.requesterId}`,
  });
}

export async function notifyGroupMemberAccepted(input: {
  groupId: string;
  groupSlug: string;
  groupName: string;
  profileId: string;
}): Promise<void> {
  await queueNotificationEvent({
    type: "group_member_accepted",
    profileIds: [input.profileId],
    title: "¡Te han aceptado en el grupo!",
    body: `Ya formas parte de ${input.groupName}.`,
    entityId: input.groupId,
    deepLink: `/grupos/${input.groupSlug}`,
    idempotencyKey: `group_accepted:${input.groupId}:${input.profileId}`,
  });
}

export async function notifyGroupMemberRejected(input: {
  groupId: string;
  profileId: string;
  groupName: string;
}): Promise<void> {
  await queueNotificationEvent({
    type: "group_member_rejected",
    profileIds: [input.profileId],
    title: "Solicitud de grupo",
    body: `Tu solicitud para ${input.groupName} no ha sido aceptada.`,
    entityId: input.groupId,
    deepLink: "/grupos",
    idempotencyKey: `group_rejected:${input.groupId}:${input.profileId}`,
  });
}

export async function notifyListingAccessGranted(input: {
  listingId: string;
  listingName: string;
  groupId: string;
  groupName: string;
  memberProfileIds: string[];
}): Promise<void> {
  if (!input.memberProfileIds.length) return;

  await queueNotificationEvent({
    type: "listing_access_granted",
    profileIds: input.memberProfileIds,
    title: "Piso privado desbloqueado",
    body: `Tu grupo puede ver y solicitar ${input.listingName}.`,
    entityId: input.listingId,
    deepLink: "/descubrir",
    idempotencyKey: `listing_access:${input.listingId}:${input.groupId}`,
  });
}

export async function notifyExpenseAdded(input: {
  expenseId: string;
  groupId: string;
  label: string;
  amount: number;
  memberProfileIds: string[];
  actorId: string;
}): Promise<void> {
  const recipients = input.memberProfileIds.filter((id) => id !== input.actorId);
  if (!recipients.length) return;

  await queueNotificationEvent({
    type: "expense_added",
    profileIds: recipients,
    title: "Nuevo gasto en el piso",
    body: `${input.label}: ${input.amount.toFixed(2)} €`,
    entityId: input.expenseId,
    deepLink: `/grupos`,
    channels: ["push", "in_app"],
    idempotencyKey: `expense:${input.expenseId}`,
  });
}

export async function notifyLeasePendingSignature(input: {
  leaseId: string;
  listingName: string;
  partyProfileIds: string[];
}): Promise<void> {
  await queueNotificationEvent({
    type: "lease_pending_signature",
    profileIds: input.partyProfileIds,
    title: "Contrato pendiente de firma",
    body: `Revisa y firma el contrato de ${input.listingName}.`,
    entityId: input.leaseId,
    deepLink: "/profile",
    idempotencyKey: `lease_pending:${input.leaseId}`,
  });
}

export async function fetchGroupLeadProfileIds(groupId: string): Promise<string[]> {
  const { data } = await getSupabase()
    .from("habitus_group_members")
    .select("profile_id")
    .eq("group_id", groupId)
    .eq("role", "lead")
    .eq("is_confirmed", true);

  return (data ?? []).map((r) => r.profile_id as string);
}

export async function fetchConfirmedGroupMemberIds(groupId: string): Promise<string[]> {
  const { data } = await getSupabase()
    .from("habitus_group_members")
    .select("profile_id")
    .eq("group_id", groupId)
    .eq("is_confirmed", true);

  return (data ?? []).map((r) => r.profile_id as string);
}
