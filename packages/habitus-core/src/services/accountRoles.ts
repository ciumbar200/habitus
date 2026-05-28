export type AccountRoleSlug = "inquilino" | "anfitrion" | "propietario" | "agencia" | "embajador";

export type AccountRoleOption = {
  slug: AccountRoleSlug;
  label: string;
  description: string;
  icon: string;
};

export const ACCOUNT_ROLES: AccountRoleOption[] = [
  {
    slug: "inquilino",
    label: "Inquilino",
    description: "Busco un hogar compartido y compañeros con los que convivir de verdad.",
    icon: "person_search",
  },
  {
    slug: "anfitrion",
    label: "Anfitrión",
    description: "Tengo habitación libre: la publico con fotos y busco inquilinos compatibles con la convivencia.",
    icon: "home_work",
  },
  {
    slug: "propietario",
    label: "Propietario",
    description: "Soy dueño/a del inmueble y quiero alquilar con tranquilidad y personas afines.",
    icon: "real_estate_agent",
  },
  {
    slug: "agencia",
    label: "Operador",
    description: "Gestiono colivings, varias habitaciones o inventario profesional y quiero candidatos compatibles.",
    icon: "business_center",
  },
];

export function accountRoleLabel(slug: AccountRoleSlug | string | null | undefined): string {
  const found = ACCOUNT_ROLES.find((r) => r.slug === slug);
  return found?.label ?? "";
}
