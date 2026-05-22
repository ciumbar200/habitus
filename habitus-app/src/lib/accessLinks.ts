import type { AccountRoleSlug } from "@habitus/core";

const VALID_ROLES = new Set<AccountRoleSlug>(["inquilino", "anfitrion", "propietario", "agencia"]);

export function parseAccessRole(value: string | null | undefined): AccountRoleSlug | null {
  if (!value) return null;
  return VALID_ROLES.has(value as AccountRoleSlug) ? (value as AccountRoleSlug) : null;
}

/** Registro con rol preseleccionado (CTAs «Crear cuenta» en landings). */
export function accessSignupUrl(role: AccountRoleSlug = "inquilino"): string {
  return `/access?signup=1&role=${role}`;
}

/** Inicio de sesión (nav «Iniciar sesión», rutas protegidas). */
export function accessSignInUrl(): string {
  return "/access";
}

/** Página «Cómo funciona» con sección por rol (?role=anfitrion). */
export function howItWorksUrl(role?: AccountRoleSlug): string {
  if (!role) return "/como-funciona";
  return `/como-funciona?role=${role}`;
}

export function accessWantsSignup(searchParams: URLSearchParams): boolean {
  const signup = searchParams.get("signup");
  return signup === "1" || signup === "true" || parseAccessRole(searchParams.get("role")) != null;
}
