import type { AccountRoleSlug } from "../types/models";

export type QuizOption = { value: string; label: string };

export type QuizQuestion = {
  id: string;
  label: string;
  hint?: string;
  options: QuizOption[];
  roles: AccountRoleSlug[];
};

export const COMPAT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "schedule",
    label: "¿Cuál es tu ritmo diario?",
    hint: "Horarios de sueño y actividad en casa.",
    roles: ["inquilino", "anfitrion"],
    options: [
      { value: "early", label: "Madrugador/a (silencio por la noche)" },
      { value: "balanced", label: "Equilibrado/a" },
      { value: "night", label: "Nocturno/a (activo/a por la tarde-noche)" },
    ],
  },
  {
    id: "cleanliness",
    label: "¿Cómo mantienes la casa?",
    roles: ["inquilino", "anfitrion"],
    options: [
      { value: "tidy", label: "Muy ordenado/a" },
      { value: "normal", label: "Orden razonable" },
      { value: "relaxed", label: "Flexible con el desorden" },
    ],
  },
  {
    id: "social",
    label: "¿Cuánta vida social quieres en casa?",
    roles: ["inquilino", "anfitrion"],
    options: [
      { value: "high", label: "Mucha (cenas, eventos, gente)" },
      { value: "moderate", label: "Moderada" },
      { value: "low", label: "Poca (casa tranquila)" },
    ],
  },
  {
    id: "pets",
    label: "¿Mascotas en el piso?",
    roles: ["inquilino", "anfitrion"],
    options: [
      { value: "yes", label: "Sí, me encantan" },
      { value: "depends", label: "Depende del tipo" },
      { value: "no", label: "Prefiero sin mascotas" },
    ],
  },
  {
    id: "remote",
    label: "¿Trabajas desde casa?",
    roles: ["inquilino", "anfitrion"],
    options: [
      { value: "full", label: "Casi siempre" },
      { value: "hybrid", label: "Híbrido" },
      { value: "office", label: "Casi nunca" },
    ],
  },
  {
    id: "budget",
    label: "Presupuesto mensual por habitación",
    roles: ["inquilino"],
    options: [
      { value: "tight", label: "Hasta 750 €" },
      { value: "medium", label: "750 – 950 €" },
      { value: "flexible", label: "Más de 950 €" },
    ],
  },
  {
    id: "stay",
    label: "Duración prevista de la estancia",
    roles: ["inquilino"],
    options: [
      { value: "short", label: "Menos de 6 meses" },
      { value: "medium", label: "6 – 12 meses" },
      { value: "long", label: "Más de un año" },
    ],
  },
  {
    id: "preferredCity",
    label: "¿En qué ciudad buscas espacio?",
    roles: ["inquilino"],
    options: [
      { value: "barcelona", label: "Barcelona" },
      { value: "madrid", label: "Madrid" },
      { value: "both", label: "Ambas" },
    ],
  },
  {
    id: "hostStyle",
    label: "Como anfitrión, ¿qué ambiente promueves?",
    roles: ["anfitrion"],
    options: [
      { value: "community", label: "Comunidad activa y eventos" },
      { value: "balanced", label: "Equilibrio convivencia y privacidad" },
      { value: "calm", label: "Calma y normas claras" },
    ],
  },
  {
    id: "visits",
    label: "Norma sobre visitas",
    roles: ["anfitrion"],
    options: [
      { value: "open", label: "Visitas con aviso, ambiente abierto" },
      { value: "moderate", label: "Visitas moderadas" },
      { value: "strict", label: "Pocas visitas / horarios limitados" },
    ],
  },
];

export function questionsForRole(role: AccountRoleSlug): QuizQuestion[] {
  return COMPAT_QUIZ_QUESTIONS.filter((q) => q.roles.includes(role));
}

export const DEMO_QUIZ_BY_SLUG: Record<string, Record<string, string>> = {
  elena: {
    schedule: "balanced",
    cleanliness: "tidy",
    social: "moderate",
    pets: "depends",
    remote: "hybrid",
    budget: "medium",
    stay: "long",
    preferredCity: "barcelona",
  },
  marcus: {
    schedule: "early",
    cleanliness: "tidy",
    social: "low",
    pets: "no",
    remote: "full",
    budget: "flexible",
    stay: "medium",
    preferredCity: "madrid",
  },
  sofia: {
    schedule: "night",
    cleanliness: "normal",
    social: "high",
    pets: "yes",
    remote: "hybrid",
    budget: "medium",
    stay: "long",
    preferredCity: "both",
  },
};
