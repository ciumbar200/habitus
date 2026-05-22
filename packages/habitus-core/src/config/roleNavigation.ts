import type { AccountRoleSlug, Profile } from "../types/models";

export type NavItem = {
  label: string;
  path: string;
  icon: string;
};

/** Ítem de navegación principal (web path + pantalla React Navigation). */
export type PrimaryNavItem = NavItem & {
  screen: string;
};

/** Máximo de ítems en la barra inferior (mobile first). */
export const MAX_BOTTOM_NAV_ITEMS = 5;

const PRIMARY_NAV: Record<string, PrimaryNavItem[]> = {
  inquilino: [
    { label: "Descubrir", path: "/descubrir", screen: "Discover", icon: "explore" },
    { label: "Compañeros", path: "/matches", screen: "Matches", icon: "group" },
    { label: "Comunidad", path: "/comunidad", screen: "Community", icon: "groups" },
    { label: "Mensajes", path: "/messages", screen: "Messages", icon: "chat_bubble" },
    { label: "Perfil", path: "/profile", screen: "Profile", icon: "person" },
  ],
  anfitrion: [
    { label: "Panel", path: "/panel", screen: "Panel", icon: "dashboard" },
    { label: "Mis habitaciones", path: "/panel/espacios", screen: "Spaces", icon: "home_work" },
    { label: "Solicitudes", path: "/panel/solicitudes", screen: "Applications", icon: "assignment" },
    { label: "Mensajes", path: "/messages", screen: "Messages", icon: "chat_bubble" },
    { label: "Perfil", path: "/profile", screen: "Profile", icon: "person" },
  ],
  propietario: [
    { label: "Panel", path: "/panel", screen: "Panel", icon: "dashboard" },
    { label: "Mis pisos", path: "/panel/espacios", screen: "Spaces", icon: "apartment" },
    { label: "Solicitudes", path: "/panel/solicitudes", screen: "Applications", icon: "assignment" },
    { label: "Mensajes", path: "/messages", screen: "Messages", icon: "chat_bubble" },
    { label: "Perfil", path: "/profile", screen: "Profile", icon: "person" },
  ],
  agencia: [
    { label: "Panel", path: "/panel", screen: "Panel", icon: "dashboard" },
    { label: "Cartera de pisos", path: "/panel/espacios", screen: "Spaces", icon: "business_center" },
    { label: "Solicitudes", path: "/panel/solicitudes", screen: "Applications", icon: "assignment" },
    { label: "Mensajes", path: "/messages", screen: "Messages", icon: "chat_bubble" },
    { label: "Perfil", path: "/profile", screen: "Profile", icon: "person" },
  ],
  default: [
    { label: "Descubrir", path: "/descubrir", screen: "Discover", icon: "explore" },
    { label: "Mensajes", path: "/messages", screen: "Messages", icon: "chat_bubble" },
    { label: "Perfil", path: "/profile", screen: "Profile", icon: "person" },
  ],
};

/** Rutas secundarias (panel, escritorio): no van en la barra inferior. */
const SECONDARY_NAV: Partial<Record<AccountRoleSlug, NavItem[]>> = {
  inquilino: [{ label: "Grupos", path: "/grupos", icon: "groups" }],
  anfitrion: [
    { label: "Convivencia", path: "/panel/convivencia", icon: "group" },
    { label: "Comunidad", path: "/comunidad", icon: "groups" },
  ],
  propietario: [{ label: "Comunidad", path: "/comunidad", icon: "groups" }],
  agencia: [{ label: "Comunidad", path: "/comunidad", icon: "groups" }],
};

function primaryNavForRole(role: AccountRoleSlug | null | undefined): PrimaryNavItem[] {
  const key = role && role in PRIMARY_NAV ? role : "default";
  return (PRIMARY_NAV[key] ?? PRIMARY_NAV.default).slice(0, MAX_BOTTOM_NAV_ITEMS);
}

export function homePathForRole(role: AccountRoleSlug | null | undefined): string {
  return primaryNavForRole(role)[0]?.path ?? "/descubrir";
}

export function homePathForProfile(profile: Pick<Profile, "accountRole" | "isAdmin"> | null | undefined): string {
  if (profile?.isAdmin) return "/admin";
  return homePathForRole(profile?.accountRole);
}

/** Navegación principal: misma en web (barra + header) y app móvil (tabs). */
export function primaryNavItemsForRole(
  role: AccountRoleSlug | null | undefined,
): PrimaryNavItem[] {
  return primaryNavForRole(role);
}

export function bottomNavItemsForRole(role: AccountRoleSlug | null | undefined): NavItem[] {
  return primaryNavForRole(role).map(({ label, path, icon }) => ({ label, path, icon }));
}

/** Header escritorio: primaria + enlaces secundarios del panel. */
export function navItemsForRole(role: AccountRoleSlug | null | undefined): NavItem[] {
  const primary = bottomNavItemsForRole(role);
  const secondary = role ? (SECONDARY_NAV[role] ?? []) : [];
  return [...primary, ...secondary];
}

export function homeScreenForRole(role: AccountRoleSlug | null | undefined): string {
  return primaryNavForRole(role)[0]?.screen ?? "Discover";
}

/** Enlaces secundarios (grupos, convivencia…) para menú de perfil u overflow en mobile. */
export function secondaryNavItemsForRole(
  role: AccountRoleSlug | null | undefined,
): NavItem[] {
  return role ? (SECONDARY_NAV[role] ?? []) : [];
}

export type CanAccessOptions = {
  isAdmin?: boolean;
};

export function canAccessPath(
  role: AccountRoleSlug | null | undefined,
  pathname: string,
  options?: CanAccessOptions,
): boolean {
  if (pathname.startsWith("/admin")) return options?.isAdmin === true;

  if (!role) return pathname === "/profile" || pathname === "/completar-rol";

  if (pathname === "/" || pathname === "/completar-rol") return true;

  if (pathname.startsWith("/comunidad")) return true;

  if (role === "inquilino") {
    return (
      pathname === "/descubrir" ||
      pathname.startsWith("/matches") ||
      pathname.startsWith("/miembro/") ||
      pathname.startsWith("/grupos") ||
      pathname.startsWith("/messages") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/profile/") ||
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/cuestionario-compatibilidad") ||
      pathname.startsWith("/property/")
    );
  }

  if (role === "anfitrion") {
    return (
      pathname.startsWith("/panel") ||
      pathname.startsWith("/comunidad") ||
      pathname.startsWith("/cuestionario-compatibilidad") ||
      pathname.startsWith("/miembro/") ||
      pathname.startsWith("/messages") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/profile/") ||
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/property/")
    );
  }

  if (role === "propietario" || role === "agencia") {
    return (
      pathname.startsWith("/panel") ||
      pathname.startsWith("/comunidad") ||
      pathname.startsWith("/messages") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/profile/") ||
      pathname.startsWith("/property/")
    );
  }

  return true;
}
