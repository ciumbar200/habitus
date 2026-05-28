import type { AccountRoleSlug } from "../types/models";

/** Textos de publicación según rol. El slug legacy `agencia` se muestra como operador. */
export type ListingCopy = {
  statsListings: string;
  myListings: string;
  newListing: string;
  editListing: string;
  publishModalTitle: string;
  nameSlugRequired: string;
  noListings: string;
  createFirst: string;
  publishCta: string;
  incomingApplications: string;
  noIncomingApplications: string;
  goToListings: string;
  formName: string;
  formPublish: string;
  listColumn: string;
  convivenciaTitle: string;
};

const anfitrion: ListingCopy = {
  statsListings: "Habitaciones",
  myListings: "Mis habitaciones",
  newListing: "Nueva habitación",
  editListing: "Editar habitación",
  publishModalTitle: "Publicar habitación",
  nameSlugRequired: "El nombre y la URL de la habitación son obligatorios.",
  noListings: "Aún no has publicado ninguna habitación.",
  createFirst: "Publica tu primera habitación",
  publishCta: "Publicar habitación",
  incomingApplications: "Solicitudes en tus habitaciones",
  noIncomingApplications: "Aún no hay solicitudes en tus habitaciones publicadas.",
  goToListings: "Ver mis habitaciones",
  formName: "Nombre de la habitación",
  formPublish: "Publicar habitación",
  listColumn: "Habitación",
  convivenciaTitle: "Convivencia con tus inquilinos",
};

const piso: ListingCopy = {
  statsListings: "Pisos",
  myListings: "Mis pisos",
  newListing: "Nuevo piso",
  editListing: "Editar piso",
  publishModalTitle: "Publicar piso",
  nameSlugRequired: "El nombre y la URL del piso son obligatorios.",
  noListings: "Aún no tienes pisos publicados.",
  createFirst: "Publica tu primer piso",
  publishCta: "Publicar piso",
  incomingApplications: "Solicitudes en tus pisos",
  noIncomingApplications: "Aún no hay solicitudes en tus pisos publicados.",
  goToListings: "Ver mis pisos",
  formName: "Nombre del piso",
  formPublish: "Publicar piso",
  listColumn: "Piso",
  convivenciaTitle: "Convivencia en tus pisos",
};

const agencia: ListingCopy = {
  ...piso,
  statsListings: "Unidades",
  myListings: "Inventario",
  newListing: "Nueva unidad",
  editListing: "Editar unidad",
  publishModalTitle: "Publicar inventario",
  noListings: "Aún no has publicado inventario profesional.",
  createFirst: "Publica tu primera unidad",
  publishCta: "Añadir inventario",
  incomingApplications: "Solicitudes en tu inventario",
  noIncomingApplications: "Aún no hay solicitudes en tu inventario publicado.",
  goToListings: "Ver inventario",
  formName: "Nombre de la unidad",
  formPublish: "Publicar unidad",
  listColumn: "Unidad",
  convivenciaTitle: "Compatibilidad de residentes",
};

export function listingCopyForRole(role: AccountRoleSlug | null | undefined): ListingCopy {
  if (role === "anfitrion") return anfitrion;
  if (role === "agencia") return agencia;
  if (role === "propietario") return piso;
  return piso;
}
