import type { Amenity } from "../types/models";

/** Amenities habituales al publicar una habitación. */
export const LISTING_AMENITY_PRESETS: Amenity[] = [
  { icon: "wifi", label: "Wi‑Fi fibra" },
  { icon: "kitchen", label: "Cocina compartida" },
  { icon: "balcony", label: "Balcón o terraza" },
  { icon: "local_laundry_service", label: "Lavadora" },
  { icon: "desk", label: "Escritorio" },
  { icon: "cleaning_services", label: "Limpieza común" },
  { icon: "pets", label: "Admite mascotas" },
  { icon: "volume_off", label: "Horario de silencio" },
];
