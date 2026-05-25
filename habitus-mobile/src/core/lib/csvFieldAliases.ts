/** Normaliza cabeceras CSV (espacios, mayúsculas, acentos básicos). */
export function normalizeCsvHeader(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

/** Busca un valor en un registro CSV probando varios alias de columna. */
export function pickCsvField(record: Record<string, string>, ...aliases: string[]): string {
  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(record)) {
    normalized[normalizeCsvHeader(k)] = v;
  }
  for (const alias of aliases) {
    const v = normalized[normalizeCsvHeader(alias)];
    if (v !== undefined && v.trim() !== "") return v.trim();
  }
  return "";
}

/** Comprueba si el registro tiene al menos uno de los alias. */
export function csvRecordHasField(record: Record<string, string>, ...aliases: string[]): boolean {
  return pickCsvField(record, ...aliases) !== "";
}

export const USER_CSV_FIELD_ALIASES = {
  email: ["email", "correo", "e-mail", "mail"],
  password: ["password", "pass", "contrasena", "contraseña"],
  display_name: ["display_name", "display name", "name", "nombre", "full_name", "fullname"],
  account_role: ["account_role", "account role", "role", "rol", "tipo_cuenta"],
  role_title: ["role_title", "role title", "title", "titulo", "titulo_rol", "occupation", "profesion"],
  bio_quote: ["bio_quote", "bio", "bio quote", "description", "descripcion", "about", "sobre_mi"],
  avatar_url: [
    "avatar_url",
    "avatar",
    "avatar url",
    "photo_url",
    "photo",
    "profile_image",
    "profile_image_url",
    "image_url",
    "imagen",
    "foto",
    "picture",
  ],
  slug: ["slug", "username", "usuario"],
  tags: ["tags", "etiquetas", "lifestyle_tags"],
  is_discoverable: ["is_discoverable", "discoverable", "visible", "descubrible"],
  identity_status: ["identity_status", "identity", "verification", "verificacion", "kyc"],
  birth_date: ["birth_date", "birthdate", "birthday", "fecha_nacimiento", "fecha_nac"],
} as const;

export type UserCsvCanonicalField = keyof typeof USER_CSV_FIELD_ALIASES;

export function validateUserCsvRecords(records: Record<string, string>[]): string | null {
  if (records.length === 0) return "empty";
  const sample = records[0];
  const missing: string[] = [];
  if (!csvRecordHasField(sample, ...USER_CSV_FIELD_ALIASES.email)) missing.push("email");
  if (!csvRecordHasField(sample, ...USER_CSV_FIELD_ALIASES.display_name)) missing.push("display_name");
  if (!csvRecordHasField(sample, ...USER_CSV_FIELD_ALIASES.account_role)) missing.push("account_role");
  if (missing.length > 0) return missing.join(", ");
  return null;
}
