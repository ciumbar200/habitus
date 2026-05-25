import { es } from "../i18n/es";

export function listingStatusLabel(status: string): string {
  const key = status as keyof typeof es.panel.listingStatus;
  return es.panel.listingStatus[key] ?? status;
}

export function listingStatusClass(status: string): string {
  switch (status) {
    case "published":
      return "bg-secondary-container text-on-secondary-container";
    case "draft":
      return "bg-surface-container-high text-on-surface-variant";
    case "archived":
      return "bg-error-container/50 text-on-error-container";
    default:
      return "bg-surface-container text-on-surface-variant";
  }
}
