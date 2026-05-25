import { Navigate, useSearchParams } from "react-router-dom";

/** Compatibilidad con URLs tipo /listings?sort=compatibilidad */
export function ListingsLegacyRedirect() {
  const [params] = useSearchParams();
  const next = new URLSearchParams();

  const sort = params.get("sort");
  if (sort === "compatibilidad" || sort === "compat") next.set("orden", "compatibilidad");
  else if (sort === "price_asc" || sort === "price") next.set("orden", "precio_asc");
  else if (sort === "price_desc") next.set("orden", "precio_desc");
  else if (sort === "recent") next.set("orden", "recientes");

  const city = params.get("city") ?? params.get("ciudad");
  if (city) next.set("ciudad", city.toLowerCase());

  const zone = params.get("zone") ?? params.get("zona");
  if (zone) next.set("zona", zone.toLowerCase());

  const q = next.toString();
  return <Navigate to={q ? `/alojamientos?${q}` : "/alojamientos"} replace />;
}
