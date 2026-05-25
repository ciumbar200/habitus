import type { ComponentType } from "react";
import type { AccountRoleSlug } from "@habitus/core";
import {
  Briefcase,
  Buildings,
  ChartLineUp,
  ChatCircle,
  CheckCircle,
  Funnel,
  House,
  MagnifyingGlass,
  Shield,
  User,
  UserCircle,
  Users,
} from "@phosphor-icons/react";

type StepIcon = ComponentType<{ size?: number; weight?: "fill" | "bold" | "thin"; className?: string }>;

export type HowItWorksStep = {
  num: string;
  title: string;
  desc: string;
  icon: StepIcon;
};

export type HowItWorksRoleConfig = {
  slug: AccountRoleSlug;
  label: string;
  labelPlural: string;
  headline: string;
  intro: string;
  accent: string;
  accentMuted: string;
  accentRing: string;
  accentBg: string;
  ctaLabel: string;
  landingPath: string;
  steps: HowItWorksStep[];
  extras?: { title: string; items: string[] };
};

export const HOW_IT_WORKS_ROLES: HowItWorksRoleConfig[] = [
  {
    slug: "inquilino",
    label: "Inquilino",
    labelPlural: "inquilinos",
    headline: "Encuentra hogar y compañeros que encajan",
    intro:
      "Para estudiantes, expats, profesionales o quien reinicia etapa: perfil de convivencia, grupos para alquilar entero y habitaciones con anfitrión visible.",
    accent: "text-terracotta",
    accentMuted: "text-terracotta/80",
    accentRing: "ring-terracotta/30",
    accentBg: "bg-terracotta/10",
    ctaLabel: "Crear cuenta como inquilino",
    landingPath: "/",
    steps: [
      {
        num: "01",
        title: "Perfil y cuestionario",
        desc: "Cuéntanos rutinas, hábitos y preferencias. Verifica tu identidad (demo) para generar confianza desde el primer contacto.",
        icon: User,
      },
      {
        num: "02",
        title: "Grupo o búsqueda individual",
        desc: "Forma equipo para alquilar un piso entero con reparto transparente, o busca habitación en pisos ya habitados.",
        icon: Users,
      },
      {
        num: "03",
        title: "Descubre con afinidad",
        desc: "Explora alojamientos públicos en Barcelona, Madrid, Valencia, Sevilla y Granada. Filtra por ciudad y zona.",
        icon: MagnifyingGlass,
      },
      {
        num: "04",
        title: "Conecta y solicita",
        desc: "Chatea, revisa perfiles completos y envía solicitudes solo donde la afinidad tiene sentido.",
        icon: ChatCircle,
      },
      {
        num: "05",
        title: "Múdate con claridad",
        desc: "Entra sabiendo qué esperar: reglas de convivencia, personas implicadas y expectativas alineadas antes de firmar.",
        icon: CheckCircle,
      },
    ],
    extras: {
      title: "Alquilar en grupo, sin caos",
      items: [
        "Crea o únete a un grupo compatible por estilo de vida",
        "Repartid el alquiler con pesos por habitación",
        "Solicitad pisos públicos o privados desbloqueados para vuestro grupo",
      ],
    },
  },
  {
    slug: "anfitrion",
    label: "Anfitrión",
    labelPlural: "anfitriones",
    headline: "Gestiona convivencia en tu piso",
    intro:
      "Vives en el piso y quieres compañeros afines: publica tu habitación, define cómo convives y elige solicitantes con datos, no solo intuición.",
    accent: "text-emerald-700",
    accentMuted: "text-emerald-600",
    accentRing: "ring-emerald-500/30",
    accentBg: "bg-emerald-100",
    ctaLabel: "Registrarme como anfitrión",
    landingPath: "/anfitriones",
    steps: [
      {
        num: "01",
        title: "Perfil de anfitrión",
        desc: "Presenta quién eres, tu rol en el piso y qué tipo de convivencia buscas.",
        icon: UserCircle,
      },
      {
        num: "02",
        title: "Cuestionario de convivencia",
        desc: "Horarios, limpieza, visitas, ruido… : moon traduce tus respuestas en señales de compatibilidad.",
        icon: CheckCircle,
      },
      {
        num: "03",
        title: "Publica tu espacio",
        desc: "Fotos, habitación disponible, reglas de casa y amenities. Tu listing es la carta de presentación del piso.",
        icon: House,
      },
      {
        num: "04",
        title: "Recibe solicitudes filtradas",
        desc: "Candidatos ordenados por afinidad. Menos mensajes irrelevantes, más conversaciones con sentido.",
        icon: Funnel,
      },
      {
        num: "05",
        title: "Elige y convive mejor",
        desc: "Conoce perfiles, chatea y acepta cuando encaja. Menos rotación, menos fricción diaria.",
        icon: Users,
      },
    ],
  },
  {
    slug: "propietario",
    label: "Propietario",
    labelPlural: "propietarios",
    headline: "Tu cartera, grupos pre-validados",
    intro:
      "Tienes uno o varios pisos compartidos: publica inmuebles, asigna anfitriones y recibe solicitudes de grupos e inquilinos ya filtrados por compatibilidad.",
    accent: "text-amber-800",
    accentMuted: "text-amber-700",
    accentRing: "ring-amber-500/30",
    accentBg: "bg-amber-100",
    ctaLabel: "Registrarme como propietario",
    landingPath: "/propietarios",
    steps: [
      {
        num: "01",
        title: "Alta y verificación",
        desc: "Cuenta de propietario con identidad verificada (demo). Base de confianza para inquilinos y agencias.",
        icon: Shield,
      },
      {
        num: "02",
        title: "Registra propiedades",
        desc: "Añade pisos, habitaciones, condiciones y documentación. Define si el listing es público o privado.",
        icon: Buildings,
      },
      {
        num: "03",
        title: "Asigna anfitriones",
        desc: "Vincula a la persona que vive en el piso y gestiona el día a día de la convivencia.",
        icon: UserCircle,
      },
      {
        num: "04",
        title: "Recibe grupos cualificados",
        desc: "Solicitudes con desglose de compatibilidad del grupo. Menos sorpresas, menos rotación.",
        icon: Users,
      },
      {
        num: "05",
        title: "Supervisa con tranquilidad",
        desc: "Panel con estado de cada inmueble, solicitudes pendientes e historial de convivencia.",
        icon: ChartLineUp,
      },
    ],
    extras: {
      title: "¿Gestionas muchos pisos?",
      items: [
        "Las agencias pueden operar tu cartera desde un panel multi-cliente",
        "Mismos filtros de compatibilidad y anfitriones asignados por inmueble",
      ],
    },
  },
  {
    slug: "agencia",
    label: "Agencia",
    labelPlural: "agencias",
    headline: "Opera carteras de convivencia compartida",
    intro:
      "Para inmobiliarias y gestores profesionales: publica en nombre de propietarios, asigna anfitriones y entrega informes claros por piso y por cliente.",
    accent: "text-stone-800",
    accentMuted: "text-stone-600",
    accentRing: "ring-stone-400/40",
    accentBg: "bg-stone-200",
    ctaLabel: "Registrar agencia",
    landingPath: "/agencias",
    steps: [
      {
        num: "01",
        title: "Cuenta agencia",
        desc: "Alta con perfil profesional. Invita al equipo y organiza propietarios bajo tu cartera.",
        icon: Briefcase,
      },
      {
        num: "02",
        title: "Publica por cliente",
        desc: "Listings vinculados al propietario correcto: fotos, condiciones, visibilidad pública o privada.",
        icon: Buildings,
      },
      {
        num: "03",
        title: "Anfitriones por piso",
        desc: "Asigna referentes de convivencia en cada inmueble para filtrar candidatos en el terreno.",
        icon: UserCircle,
      },
      {
        num: "04",
        title: "Solicitudes con afinidad",
        desc: "Grupos e inquilinos llegan con score de compatibilidad. Prioriza entradas estables.",
        icon: Funnel,
      },
      {
        num: "05",
        title: "Informes y retención",
        desc: "Métricas por inmueble y propietario: menos incidencias, más satisfacción de cartera.",
        icon: ChartLineUp,
      },
    ],
  },
];

export function howItWorksRoleConfig(slug: AccountRoleSlug): HowItWorksRoleConfig {
  return HOW_IT_WORKS_ROLES.find((r) => r.slug === slug) ?? HOW_IT_WORKS_ROLES[0];
}
