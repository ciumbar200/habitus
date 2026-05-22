import type { AccountRoleSlug, Profile } from "../types/models";

export function roleNeedsCompatQuiz(role: AccountRoleSlug | null | undefined): boolean {
  return role === "inquilino" || role === "anfitrion";
}

/** Perfil de convivencia: etiquetas, hábitos, cuestionario. */
export function roleShowsLifestyleProfile(role: AccountRoleSlug | null | undefined): boolean {
  return role === "inquilino" || role === "anfitrion";
}

/** Propietario / agencia: confianza por identidad y verificación de inmuebles. */
export function roleShowsTrustProfile(role: AccountRoleSlug | null | undefined): boolean {
  return role === "propietario" || role === "agencia";
}

/** Admin y roles sin cuestionario no lo requieren. */
export function profileNeedsCompatQuiz(profile: Profile | null | undefined): boolean {
  if (!profile?.accountRole || profile.isAdmin) return false;
  return roleNeedsCompatQuiz(profile.accountRole);
}

export function profileNeedsOnboarding(profile: Profile | null): boolean {
  if (!profile) return true;
  if (profile.onboardingCompletedAt) return false;
  const name = profile.displayName?.trim() ?? "";
  if (name.length < 2) return true;
  if (!profile.birthDate) return true;
  return true;
}

export function ageFromBirthDate(birthDate: string): number {
  const birth = new Date(`${birthDate}T12:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function isValidOnboardingAge(age: number): boolean {
  return age >= 18 && age <= 99;
}
