import type { InAppNotification } from "@habitus/core";
import { sileo, type SileoState } from "sileo";

export function notificationHref(n: InAppNotification): string {
  const deepLink = n.data?.deepLink;
  if (typeof deepLink === "string" && deepLink.startsWith("/")) return deepLink;
  if (n.type === "new_message" && n.entityId) return `/messages?c=${n.entityId}`;
  if (n.type === "application_submitted") return "/panel/solicitudes";
  return "/notifications";
}

function toastState(n: InAppNotification): SileoState {
  if (n.type === "group_member_rejected") return "warning";
  if (n.type === "application_status_changed") {
    const status = n.data?.status;
    if (status === "rejected" || status === "declined") return "warning";
    if (status === "approved" || status === "accepted") return "success";
  }
  if (n.type === "group_member_accepted") return "success";
  return "info";
}

export function showNotificationToast(
  n: InAppNotification,
  onOpen?: (href: string) => void,
): void {
  const href = notificationHref(n);
  const state = toastState(n);
  const opts = {
    title: n.title,
    description: n.body,
    duration: 7000,
    button: onOpen
      ? {
          title: "Ver",
          onClick: () => onOpen(href),
        }
      : undefined,
  };

  switch (state) {
    case "success":
      sileo.success(opts);
      break;
    case "warning":
      sileo.warning(opts);
      break;
    default:
      sileo.info(opts);
  }
}
