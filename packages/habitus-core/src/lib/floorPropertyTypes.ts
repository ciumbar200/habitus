/** Tipos de inmueble para pisos (propietario / agencia). Se guardan en `room_type`. */
export const FLOOR_PROPERTY_TYPES = [
  { value: "Estudio / apartamento", label: "Estudio / apartamento" },
  { value: "Casa", label: "Casa" },
] as const;

export const DEFAULT_FLOOR_PROPERTY_TYPE = FLOOR_PROPERTY_TYPES[0].value;
