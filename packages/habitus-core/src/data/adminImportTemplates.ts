import { rowsToCsv } from "../lib/csv";

export const USERS_CSV_HEADERS = [
  "email",
  "password",
  "display_name",
  "account_role",
  "role_title",
  "bio_quote",
  "avatar_url",
  "slug",
  "tags",
  "is_discoverable",
  "identity_status",
  "birth_date",
] as const;

export const LISTINGS_CSV_HEADERS = [
  "owner_email",
  "host_email",
  "name",
  "slug",
  "location",
  "city",
  "price_monthly",
  "currency",
  "category_slug",
  "room_type",
  "description",
  "cover_image_url",
  "status",
  "visibility",
  "available_from",
  "listing_conditions",
] as const;

const USERS_CSV_EXAMPLE_ROWS: string[][] = [
  [...USERS_CSV_HEADERS],
  [
    "maria.garcia@example.com",
    "TempPass123!",
    "María García",
    "inquilino",
    "Estudiante de medicina",
    "Busco piso tranquilo cerca del campus.",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    "maria-garcia",
    "deportista|no fumador",
    "true",
    "none",
    "1998-05-12",
  ],
  [
    "carlos.host@example.com",
    "TempPass123!",
    "Carlos Ruiz",
    "anfitrion",
    "Enfermero",
    "Convivo en un piso amplio con terraza.",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    "",
    "cocina|mascotas",
    "false",
    "verified",
    "1990-11-03",
  ],
];

const LISTINGS_CSV_EXAMPLE_ROWS: string[][] = [
  [...LISTINGS_CSV_HEADERS],
  [
    "propietario@example.com",
    "anfitrion@example.com",
    "Habitación luminosa Gràcia",
    "hab-gracia-luminosa",
    "gracia",
    "barcelona",
    "650",
    "EUR",
    "habitacion",
    "individual",
    "Habitación exterior en piso compartido. WiFi y lavadora incluidos.",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    "published",
    "public",
    "2026-06-01",
    "",
  ],
  [
    "anfitrion@example.com",
    "",
    "Habitación en Malasaña",
    "hab-malasana-centro",
    "malasana",
    "madrid",
    "720",
    "EUR",
    "habitacion",
    "doble",
    "Borrador de ejemplo para revisar antes de publicar.",
    "",
    "draft",
    "public",
    "",
    "",
  ],
];

export function usersCsvExample(): string {
  return rowsToCsv(USERS_CSV_EXAMPLE_ROWS);
}

export function listingsCsvExample(): string {
  return rowsToCsv(LISTINGS_CSV_EXAMPLE_ROWS);
}
