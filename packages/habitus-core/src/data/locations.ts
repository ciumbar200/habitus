export type MoonCitySlug = "barcelona" | "madrid" | "valencia" | "sevilla" | "granada";

export type MoonZone = { slug: string; label: string };

export const MOON_CITIES: { slug: MoonCitySlug; label: string }[] = [
  { slug: "barcelona", label: "Barcelona" },
  { slug: "madrid", label: "Madrid" },
  { slug: "valencia", label: "Valencia" },
  { slug: "sevilla", label: "Sevilla" },
  { slug: "granada", label: "Granada" },
];

export const MOON_ZONES_BY_CITY: Record<MoonCitySlug, MoonZone[]> = {
  barcelona: [
    { slug: "eixample", label: "Eixample" },
    { slug: "gracia", label: "Gràcia" },
    { slug: "poblenou", label: "Poblenou" },
    { slug: "sant-antoni", label: "Sant Antoni" },
    { slug: "les-corts", label: "Les Corts" },
    { slug: "sarria", label: "Sarrià" },
    { slug: "sants", label: "Sants" },
    { slug: "ciutat-vella", label: "Ciutat Vella" },
    { slug: "sant-marti", label: "Sant Martí" },
    { slug: "hospitalet", label: "L'Hospitalet" },
    { slug: "badalona", label: "Badalona" },
    { slug: "gava", label: "Gavà" },
    { slug: "viladecans", label: "Viladecans" },
    { slug: "castelldefels", label: "Castelldefels" },
    { slug: "sant-cugat", label: "Sant Cugat" },
    { slug: "sant-celoni", label: "Sant Celoni" },
    { slug: "mataro", label: "Mataró" },
  ],
  madrid: [
    { slug: "centro", label: "Centro" },
    { slug: "malasana", label: "Malasaña" },
    { slug: "chamberi", label: "Chamberí" },
    { slug: "salamanca", label: "Salamanca" },
    { slug: "retiro", label: "Retiro" },
    { slug: "moncloa", label: "Moncloa" },
    { slug: "tetuan", label: "Tetuán" },
    { slug: "chamartin", label: "Chamartín" },
    { slug: "usera", label: "Usera" },
    { slug: "ciudad-lineal", label: "Ciudad Lineal" },
    { slug: "getafe", label: "Getafe" },
    { slug: "leganes", label: "Leganés" },
    { slug: "mostoles", label: "Móstoles" },
    { slug: "pozuelo", label: "Pozuelo" },
    { slug: "alcobendas", label: "Alcobendas" },
  ],
  valencia: [
    { slug: "ciutat-vella", label: "Ciutat Vella" },
    { slug: "eixample", label: "Eixample" },
    { slug: "benimaclet", label: "Benimaclet" },
    { slug: "campanar", label: "Campanar" },
    { slug: "ruzafa", label: "Ruzafa" },
    { slug: "patraix", label: "Patraix" },
    { slug: "algiros", label: "Algirós" },
    { slug: "mislata", label: "Mislata" },
    { slug: "burjassot", label: "Burjassot" },
    { slug: "paterna", label: "Paterna" },
    { slug: "alboraya", label: "Alboraya" },
  ],
  sevilla: [
    { slug: "centro", label: "Centro" },
    { slug: "triana", label: "Triana" },
    { slug: "nervion", label: "Nervión" },
    { slug: "los-remedios", label: "Los Remedios" },
    { slug: "macarena", label: "Macarena" },
    { slug: "sevilla-este", label: "Sevilla Este" },
    { slug: "san-pablo", label: "San Pablo" },
    { slug: "tomares", label: "Tomares" },
    { slug: "dos-hermanas", label: "Dos Hermanas" },
  ],
  granada: [
    { slug: "centro", label: "Centro" },
    { slug: "realejo", label: "Realejo" },
    { slug: "albaicin", label: "Albaicín" },
    { slug: "zaidin", label: "Zaidín" },
    { slug: "chana", label: "Chana" },
    { slug: "genil", label: "Genil" },
    { slug: "ronda", label: "Ronda" },
    { slug: "armilla", label: "Armilla" },
    { slug: "maracena", label: "Maracena" },
  ],
};

const CITY_SLUGS = new Set(MOON_CITIES.map((c) => c.slug));

const LEGACY_CITY_ALIASES: Record<string, MoonCitySlug> = {
  barcelona: "barcelona",
  bcn: "barcelona",
  madrid: "madrid",
  mad: "madrid",
  valencia: "valencia",
  vlc: "valencia",
  sevilla: "sevilla",
  seville: "sevilla",
  svq: "sevilla",
  granada: "granada",
  grx: "granada",
};

/** Legacy location strings → zone slug per city */
const LEGACY_ZONE_ALIASES: Partial<Record<MoonCitySlug, Record<string, string>>> = {
  barcelona: {
    eixample: "eixample",
    gracia: "gracia",
    gràcia: "gracia",
    poblenou: "poblenou",
    gava: "gava",
    gavà: "gava",
    viladecans: "viladecans",
    "sant celoni": "sant-celoni",
    "eixample, barcelona": "eixample",
  },
  madrid: {
    malasana: "malasana",
    malasaña: "malasana",
    "malasaña, madrid": "malasana",
    centro: "centro",
    chamberi: "chamberi",
    chamberí: "chamberi",
  },
};

export function isMoonCitySlug(value: string): value is MoonCitySlug {
  return CITY_SLUGS.has(value as MoonCitySlug);
}

export function getCityLabel(citySlug: string | null | undefined): string {
  if (!citySlug) return "";
  const found = MOON_CITIES.find((c) => c.slug === citySlug);
  if (found) return found.label;
  const normalized = normalizeCitySlug(citySlug);
  if (normalized) return getCityLabel(normalized);
  return citySlug;
}

export function getZonesForCity(citySlug: MoonCitySlug | ""): MoonZone[] {
  if (!citySlug) return [];
  return MOON_ZONES_BY_CITY[citySlug] ?? [];
}

export function getDefaultZoneForCity(citySlug: MoonCitySlug): string {
  return MOON_ZONES_BY_CITY[citySlug][0]?.slug ?? "";
}

export function getZoneLabel(citySlug: string | null | undefined, zoneSlug: string | null | undefined): string {
  if (!zoneSlug) return "";
  const city = normalizeCitySlug(citySlug ?? "");
  if (city) {
    const zone = MOON_ZONES_BY_CITY[city].find((z) => z.slug === zoneSlug);
    if (zone) return zone.label;
  }
  return zoneSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeCitySlug(raw: string | null | undefined): MoonCitySlug | "" {
  if (!raw?.trim()) return "";
  const key = raw.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (key === "both") return "";
  if (isMoonCitySlug(key)) return key;
  if (LEGACY_CITY_ALIASES[key]) return LEGACY_CITY_ALIASES[key];
  for (const city of MOON_CITIES) {
    if (key.includes(city.slug) || key.includes(city.label.toLowerCase())) {
      return city.slug;
    }
  }
  return "";
}

export function normalizeZoneSlug(
  cityRaw: string | null | undefined,
  zoneRaw: string | null | undefined,
): string {
  if (!zoneRaw?.trim()) return "";
  const city = normalizeCitySlug(cityRaw ?? "");
  const key = zoneRaw.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (city) {
    const zones = MOON_ZONES_BY_CITY[city];
    const exact = zones.find((z) => z.slug === key);
    if (exact) return exact.slug;
    const byLabel = zones.find(
      (z) => z.label.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "") === key,
    );
    if (byLabel) return byLabel.slug;
    const legacy = LEGACY_ZONE_ALIASES[city]?.[key];
    if (legacy) return legacy;
    for (const zone of zones) {
      const labelKey = zone.label.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
      if (key.includes(labelKey) || labelKey.includes(key)) return zone.slug;
    }
  }
  return key.replace(/\s+/g, "-");
}

export function isValidCityZone(cityRaw: string, zoneRaw: string): boolean {
  const city = normalizeCitySlug(cityRaw);
  if (!city) return false;
  const zone = normalizeZoneSlug(city, zoneRaw);
  return getZonesForCity(city).some((z) => z.slug === zone);
}

export function formatMoonLocation(
  cityRaw: string | null | undefined,
  zoneRaw: string | null | undefined,
): string {
  const city = normalizeCitySlug(cityRaw ?? "");
  const zone = city ? normalizeZoneSlug(city, zoneRaw ?? "") : normalizeZoneSlug("", zoneRaw ?? "");
  const cityLabel = city ? getCityLabel(city) : getCityLabel(cityRaw ?? "");
  const zoneLabel = zone ? getZoneLabel(city || cityRaw, zone) : zoneRaw?.trim() ?? "";
  if (zoneLabel && cityLabel) return `${zoneLabel} · ${cityLabel}`;
  return cityLabel || zoneLabel || "";
}

export function matchesCityZoneFilter(
  listingCity: string | null | undefined,
  listingZone: string | null | undefined,
  filterCity: string | null | undefined,
  filterZone: string | null | undefined,
): boolean {
  const city = normalizeCitySlug(filterCity ?? "");
  const zone = filterZone?.trim() ? normalizeZoneSlug(city || filterCity, filterZone) : "";
  if (city) {
    const itemCity = normalizeCitySlug(listingCity ?? "");
    if (itemCity !== city) return false;
  }
  if (zone) {
    const itemCity = normalizeCitySlug(listingCity ?? "") || normalizeCitySlug(filterCity ?? "");
    const itemZone = normalizeZoneSlug(itemCity, listingZone ?? "");
    if (itemZone !== zone) return false;
  }
  return true;
}
