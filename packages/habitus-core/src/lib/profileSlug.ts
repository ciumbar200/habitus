import { slugify } from "./slug";

/** Slug público único para /miembro/:slug */
export function buildProfileSlug(displayName: string, userId: string): string {
  const base = slugify(displayName.trim()) || "usuario";
  const suffix = userId.replace(/-/g, "").slice(0, 6);
  return `${base}-${suffix}`.slice(0, 80);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidLike(value: string): boolean {
  return UUID_RE.test(value);
}
