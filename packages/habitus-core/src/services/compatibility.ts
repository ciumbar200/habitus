import { DEMO_QUIZ_BY_SLUG } from "../data/compatibilityQuiz";
import type {
  CompatQuizAnswers,
  CompatibilityDimension,
  CompatibilityResult,
  MatchKind,
} from "../types/compatibility";

const ORDER_3 = ["early", "balanced", "night"] as const;
const ORDER_CLEAN = ["tidy", "normal", "relaxed"] as const;
const ORDER_SOCIAL = ["low", "moderate", "high"] as const;

function ordinalScore<T extends string>(a: T | undefined, b: T | undefined, order: readonly T[]): number {
  if (!a || !b) return 55;
  const ia = order.indexOf(a as T);
  const ib = order.indexOf(b as T);
  if (ia < 0 || ib < 0) return 55;
  const diff = Math.abs(ia - ib);
  if (diff === 0) return 100;
  if (diff === 1) return 72;
  return 42;
}

function exactOrPartial(a?: string, b?: string, pairs?: [string, string, number][]): number {
  if (!a || !b) return 55;
  if (a === b) return 100;
  if (pairs) {
    const hit = pairs.find(([x, y]) => (a === x && b === y) || (a === y && b === x));
    if (hit) return hit[2];
  }
  return 48;
}

function petsScore(a?: string, b?: string): number {
  if (!a || !b) return 60;
  if (a === b) return 100;
  if (a === "depends" || b === "depends") return 78;
  return 25;
}

function remoteScore(a?: string, b?: string): number {
  if (!a || !b) return 60;
  if (a === b) return 100;
  if ((a === "hybrid" && b === "full") || (a === "full" && b === "hybrid")) return 82;
  if (a === "hybrid" || b === "hybrid") return 68;
  return 50;
}

function budgetVsPrice(budget?: string, price?: number): { score: number; detail: string } {
  if (!budget || price == null) return { score: 65, detail: "Presupuesto no indicado en uno de los perfiles." };
  if (budget === "tight" && price <= 800) return { score: 100, detail: "El precio encaja con tu techo de 750 €." };
  if (budget === "tight" && price > 850) return { score: 35, detail: "El precio supera tu rango ajustado." };
  if (budget === "medium" && price >= 750 && price <= 980) return { score: 95, detail: "Precio dentro de tu franja 750–950 €." };
  if (budget === "flexible") return { score: 92, detail: "Tu presupuesto admite este rango de precio." };
  return { score: 58, detail: "El precio está algo alejado de tu franja habitual." };
}

function cityScore(preferred?: string, city?: string): { score: number; detail: string } {
  if (!city) return { score: 70, detail: "Ciudad del espacio no especificada." };
  const c = city.toLowerCase();
  const isBcn = c.includes("barcelona");
  const isMad = c.includes("madrid");
  if (!preferred || preferred === "both") return { score: 95, detail: `Ubicación en ${city}, compatible con tu búsqueda.` };
  if (preferred === "barcelona" && isBcn) return { score: 100, detail: "Coincide con tu preferencia por Barcelona." };
  if (preferred === "madrid" && isMad) return { score: 100, detail: "Coincide con tu preferencia por Madrid." };
  return { score: 30, detail: `Prefieres otra ciudad; este espacio está en ${city}.` };
}

function hostTenantExtras(
  host: CompatQuizAnswers,
  tenant: CompatQuizAnswers,
): CompatibilityDimension[] {
  const social = ordinalScore(host.social, tenant.social, ORDER_SOCIAL);
  const style = exactOrPartial(host.hostStyle, tenant.social, [
    ["community", "high", 95],
    ["community", "moderate", 80],
    ["balanced", "moderate", 92],
    ["calm", "low", 95],
    ["calm", "high", 35],
  ]);
  const visits = exactOrPartial(host.visits, tenant.social, [
    ["open", "high", 90],
    ["moderate", "moderate", 88],
    ["strict", "low", 90],
    ["strict", "high", 40],
  ]);

  return [
    {
      key: "hostStyle",
      label: "Estilo de convivencia",
      weight: 22,
      score: style,
      detail:
        style >= 85
          ? "Tu perfil encaja con el ambiente que promueve el anfitrión."
          : "Hay diferencias entre el ambiente del piso y tus expectativas.",
    },
    {
      key: "social",
      label: "Vida social en casa",
      weight: 18,
      score: social,
      detail:
        social >= 85
          ? "Expectativas similares sobre reuniones y actividad en el hogar."
          : "Uno de vosotros busca más (o menos) dinamismo en casa.",
    },
    {
      key: "visits",
      label: "Visitas y normas",
      weight: 12,
      score: visits,
      detail:
        visits >= 85
          ? "Las normas de visitas son compatibles con tu estilo."
          : "Revisad las normas de visitas antes de compartir piso.",
    },
  ];
}

function roommateDimensions(
  a: CompatQuizAnswers,
  b: CompatQuizAnswers,
): CompatibilityDimension[] {
  return [
    {
      key: "schedule",
      label: "Ritmo diario",
      weight: 20,
      score: ordinalScore(a.schedule, b.schedule, ORDER_3),
      detail: "Horarios de descanso y actividad en el hogar.",
    },
    {
      key: "cleanliness",
      label: "Orden y limpieza",
      weight: 18,
      score: ordinalScore(a.cleanliness, b.cleanliness, ORDER_CLEAN),
      detail: "Expectativas sobre orden en zonas comunes.",
    },
    {
      key: "social",
      label: "Vida social en casa",
      weight: 16,
      score: ordinalScore(a.social, b.social, ORDER_SOCIAL),
      detail: "Nivel de actividad y reuniones en el piso.",
    },
    {
      key: "pets",
      label: "Mascotas",
      weight: 12,
      score: petsScore(a.pets, b.pets),
      detail: "Compatibilidad con mascotas en el hogar.",
    },
    {
      key: "remote",
      label: "Teletrabajo",
      weight: 14,
      score: remoteScore(a.remote, b.remote),
      detail: "Uso simultáneo del espacio para trabajo en casa.",
    },
    {
      key: "budget",
      label: "Presupuesto",
      weight: 10,
      score: exactOrPartial(a.budget, b.budget, [
        ["tight", "medium", 65],
        ["medium", "flexible", 75],
        ["tight", "flexible", 45],
      ]),
      detail: "Alineación al alquilar juntos como grupo.",
    },
    {
      key: "stay",
      label: "Duración de estancia",
      weight: 10,
      score: ordinalScore(a.stay, b.stay, ["short", "medium", "long"] as const),
      detail: "Horizonte temporal parecido facilita la convivencia.",
    },
  ];
}

function finalize(dimensions: CompatibilityDimension[], summary: string): CompatibilityResult {
  const withScores = dimensions.map((d) => ({
    ...d,
    detail:
      d.score >= 85
        ? `${d.detail} Muy alineado (${d.score} %).`
        : d.score >= 65
          ? `${d.detail} Aceptable (${d.score} %).`
          : `${d.detail} Punto a conversar (${d.score} %).`,
  }));
  const totalWeight = withScores.reduce((s, d) => s + d.weight, 0);
  const overall = Math.round(
    withScores.reduce((s, d) => s + (d.score * d.weight) / totalWeight, 0),
  );
  return { overall, dimensions: withScores, summary };
}

export function computeCompatibility(
  self: CompatQuizAnswers,
  other: CompatQuizAnswers,
  kind: MatchKind,
): CompatibilityResult {
  if (kind === "roommate") {
    const dims = roommateDimensions(self, other);
    const overall = finalize(dims, "").overall;
    return finalize(
      dims,
      overall >= 80
        ? "Perfil muy compatible para compartir piso y alquilar juntos."
        : overall >= 60
          ? "Buena base; conviene hablar de hábitos antes de firmar."
          : "Hay diferencias importantes; valorad una entrevista conjunta.",
    );
  }

  return computeHostTenantCompatibility(self, other);
}

export function computeHostTenantCompatibility(
  host: CompatQuizAnswers,
  tenant: CompatQuizAnswers,
): CompatibilityResult {
  const extras = hostTenantExtras(host, tenant);
  const extrasKeys = new Set(extras.map((d) => d.key));
  const base = roommateDimensions(host, tenant)
    .filter((d) => !extrasKeys.has(d.key))
    .slice(0, 5);
  const dims = [...base, ...extras];
  const overall = finalize(dims, "").overall;
  return finalize(
    dims,
    overall >= 80
      ? "Encaje sólido entre anfitrión e inquilino para convivir en el mismo espacio."
      : overall >= 60
        ? "Convivencia viable con normas claras desde el primer día."
        : "Recomendamos una videollamada para alinear expectativas.",
  );
}

export function computeListingCompatibility(
  tenant: CompatQuizAnswers,
  host: CompatQuizAnswers,
  listing: { city?: string | null; priceMonthly?: number },
): CompatibilityResult {
  const convivencia = computeCompatibility(tenant, host, "host_tenant");
  const budget = budgetVsPrice(tenant.budget, listing.priceMonthly ?? undefined);
  const city = cityScore(tenant.preferredCity, listing.city ?? undefined);

  const dims: CompatibilityDimension[] = [
    ...convivencia.dimensions,
    {
      key: "budgetListing",
      label: "Precio del espacio",
      weight: 14,
      score: budget.score,
      detail: budget.detail,
    },
    {
      key: "cityListing",
      label: "Ciudad",
      weight: 12,
      score: city.score,
      detail: city.detail,
    },
  ];

  return finalize(
    dims,
    "Afinidad entre tu perfil, el anfitrión y este espacio en concreto.",
  );
}

export function resolveQuizAnswers(
  stored: CompatQuizAnswers | null | undefined,
  demoSlug?: string,
): CompatQuizAnswers {
  if (stored && Object.keys(stored).length > 0) return stored;
  if (demoSlug && DEMO_QUIZ_BY_SLUG[demoSlug]) return DEMO_QUIZ_BY_SLUG[demoSlug];
  return {};
}

export function isQuizComplete(answers: CompatQuizAnswers, role: string): boolean {
  const required =
    role === "anfitrion"
      ? ["schedule", "cleanliness", "social", "pets", "remote", "hostStyle", "visits"]
      : [
          "schedule",
          "cleanliness",
          "social",
          "pets",
          "remote",
          "budget",
          "stay",
          "preferredCity",
        ];
  return required.every((k) => Boolean(answers[k]));
}
