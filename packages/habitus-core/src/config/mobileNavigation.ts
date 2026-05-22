import type { AccountRoleSlug } from "../types/models";
import {
  homeScreenForRole,
  primaryNavItemsForRole,
  type PrimaryNavItem,
} from "./roleNavigation";

export type MobileTab = {
  label: string;
  screen: string;
  icon: string;
};

function toMobileTab(item: PrimaryNavItem): MobileTab {
  return { label: item.label, screen: item.screen, icon: item.icon };
}

/** Misma estructura que la barra inferior web (`primaryNavItemsForRole`). */
export function mobileTabsForRole(role: AccountRoleSlug | null | undefined): MobileTab[] {
  return primaryNavItemsForRole(role).map(toMobileTab);
}

export function defaultMobileScreenForRole(role: AccountRoleSlug | null | undefined): string {
  return homeScreenForRole(role);
}
