import { es } from "../i18n/es";

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
};

const LOCALE = "es-ES";

export function currencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code.trim().toUpperCase()] ?? code;
}

export function formatPrice(amount: number, currency: string): string {
  const sym = currencySymbol(currency);
  return `${sym}${amount.toLocaleString(LOCALE)}`;
}

export function formatAvailableDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(LOCALE, { month: "short", day: "numeric" });
}

export function formatAppliedDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso).toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `Solicitud: ${d}`;
}

export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
}

const STATUS_CLASSES: Record<string, string> = {
  final_review: "bg-secondary-container text-on-secondary-container",
  interview_scheduled: "bg-surface-container-high text-on-surface-variant",
  submitted: "bg-surface-container text-on-surface-variant",
  approved: "bg-secondary-container text-on-secondary-container",
  rejected: "bg-error-container text-on-error-container",
  draft: "bg-surface-container-high text-on-surface-variant",
};

export function applicationStatusLabel(status: string): string {
  const key = status as keyof typeof es.applicationStatus;
  return es.applicationStatus[key] ?? status;
}

export function applicationStatusClass(status: string): string {
  return STATUS_CLASSES[status] ?? "bg-surface-container-high text-on-surface-variant";
}

export function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "Correo o contraseña incorrectos.",
    "User already registered": "Ya existe una cuenta con este correo.",
    "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
    "Email not confirmed": "Confirma tu correo antes de iniciar sesión.",
    "email rate limit exceeded":
      "Límite de envío de correos alcanzado. Espera unos minutos e inténtalo de nuevo.",
    "Database error querying schema":
      "Cuenta de prueba dañada en el servidor. Ejecuta «npm run seed:demo-users» o usa los correos demo (ver DEMO_USERS.md).",
    "Unable to validate email address: invalid format": "El formato del correo no es válido.",
    "Signup requires a valid password": "La contraseña no cumple los requisitos mínimos.",
    "For security purposes, you can only request this once every 60 seconds":
      "Por seguridad, solo puedes solicitar esto una vez cada 60 segundos.",
  };
  if (message.includes("Database error querying schema")) {
    return map["Database error querying schema"];
  }
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) return map["Invalid login credentials"];
  if (lower.includes("already registered")) return map["User already registered"];
  if (lower.includes("email not confirmed")) return map["Email not confirmed"];
  return map[message] ?? message;
}
