import type { Amenity, I18n } from "@habitus/core";

type AmenityKey = keyof I18n["property"]["amenityLabels"];

const LABEL_TO_KEY: Record<string, AmenityKey> = {
  "wi fi de alta velocidad": "highSpeedWifi",
  "wifi de alta velocidad": "highSpeedWifi",
  "wi fi fibra": "fiberWifi",
  "wifi fibra": "fiberWifi",
  "cocina compartida": "sharedKitchen",
  "balcon o terraza": "balconyTerrace",
  lavadora: "washer",
  escritorio: "desk",
  "limpieza comun": "sharedCleaning",
  "admite mascotas": "petsAllowed",
  "horario de silencio": "quietHours",
  "cafeteria de especialidad": "specialtyCoffee",
  "eventos de networking": "networkingEvents",
};

const ICON_TO_KEY: Record<string, AmenityKey> = {
  wifi: "fiberWifi",
  kitchen: "sharedKitchen",
  balcony: "balconyTerrace",
  local_laundry_service: "washer",
  desk: "desk",
  cleaning_services: "sharedCleaning",
  pets: "petsAllowed",
  volume_off: "quietHours",
  local_cafe: "specialtyCoffee",
  coffee: "specialtyCoffee",
  groups: "networkingEvents",
  event: "networkingEvents",
};

function normalizeAmenityLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[‑–—-]/g, " ")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function translateAmenityLabel(amenity: Amenity, t: I18n): string {
  const key = LABEL_TO_KEY[normalizeAmenityLabel(amenity.label)] ?? ICON_TO_KEY[amenity.icon];
  return key ? t.property.amenityLabels[key] : amenity.label;
}
