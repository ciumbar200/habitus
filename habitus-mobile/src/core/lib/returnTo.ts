/** Rutas internas válidas tras completar auth/onboarding (no externas ni auth). */
export function isValidReturnPath(path: string | null | undefined): boolean {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return false;
  const blocked = [
    "/access",
    "/auth",
    "/olvide-contrasena",
    "/onboarding",
    "/completar-rol",
    "/cuestionario-compatibilidad",
    "/profile/editar",
  ];
  return !blocked.some((b) => path === b || path.startsWith(`${b}/`));
}

export function isPropertyReturnPath(path: string | null | undefined): boolean {
  return Boolean(path?.startsWith("/property/"));
}

/** Paso intermedio del funnel tras login (no destino final guardado en returnTo). */
export function isAuthFunnelStep(path: string): boolean {
  const [pathname, search = ""] = path.split("?");
  if (pathname === "/profile/editar") {
    return search.includes("setup=1");
  }
  return (
    pathname === "/completar-rol" ||
    pathname === "/onboarding" ||
    pathname === "/cuestionario-compatibilidad"
  );
}
