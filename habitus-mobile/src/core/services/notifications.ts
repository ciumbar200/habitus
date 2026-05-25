export type NotificationEventType =
  | "application_submitted"
  | "application_status_changed"
  | "group_join_request"
  | "group_member_accepted"
  | "expense_added"
  | "lease_pending_signature";

export type NotificationEvent = {
  type: NotificationEventType;
  profileIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
};

/** Encola evento para OneSignal/email (API serverless; sin envío si no hay backend). */
export async function queueNotificationEvent(event: NotificationEvent): Promise<void> {
  if (typeof fetch === "undefined") return;
  try {
    await fetch("/api/notify/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    // best-effort
  }
}
