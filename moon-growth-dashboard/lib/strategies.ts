// Estrategias de Marketing para : moon shared living

export const MARKETING_STRATEGIES = {
  // Estrategia para España
  spain: {
    target: 50000,
    cities: ['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Bilbao'],
    channels: {
      organic: ['SEO blog', 'Instagram', 'TikTok', 'LinkedIn'],
      paid: ['Google Ads', 'Instagram Ads', 'Facebook Ads'],
      outreach: ['Apollo cold email', 'LinkedIn InMail', 'Brevo sequences'],
    },
    content: {
      blog: ['Guía co-living España', 'Rentabilidad habitaciones', 'Legislación alquiler'],
      social: ['Room tours', 'Host tips', 'Testimonios', 'Behind scenes'],
    },
  },

  // Estrategia para Europa
  europe: {
    target: 200000,
    countries: ['Portugal', 'France', 'Italy', 'Germany', 'Netherlands'],
    expansion: 'Q2 2025',
    channels: {
      organic: ['SEO multi-language', 'Instagram Global', 'TikTok Europe'],
      paid: ['Meta Ads pan-europeo', 'TikTok Ads'],
      outreach: ['Partnerships agencies', 'B2B platforms'],
    },
  },

  // Estrategia de Contenido
  content: {
    frequency: {
      blog: '3x semana',
      instagram: 'daily posts + 3 reels/semana',
      tiktok: '5 videos/semana',
      linkedin: '2 posts/semana',
    },
    pillars: [
      'Educación co-living',
      'Historias anfitriones',
      'Tours propiedades',
      'Tips hosting',
      'Comunidad moon',
    ],
  },

  // Estrategia de Outreach
  outreach: {
    sequences: {
      anfitriones: {
        name: 'Secuencia Anfitriones Cold',
        steps: 5,
        emails: [
          { day: 1, subject: '¿Habitación vacía en Barcelona?', template: 'intro' },
          { day: 3, subject: 'Income extra sin complicaciones', template: 'benefits' },
          { day: 7, subject: 'Lo que dicen nuestros anfitriones', template: 'social-proof' },
          { day: 14, subject: '¿Te llamo 5 min?', template: 'cta-call' },
          { day: 21, subject: 'Última oportunidad', template: 'break-up' },
        ],
      },
      propietarios: {
        name: 'Secuencia Propietarios',
        steps: 3,
        emails: [
          { day: 1, subject: 'Maximiza rentabilidad BCN', template: 'value-prop' },
          { day: 5, subject: 'Case study: +40% ingresos', template: 'case-study' },
          { day: 10, subject: 'Auditoría gratuita', template: 'offer' },
        ],
      },
    },
  },

  // KPIs y Objetivos
  kpis: {
    monthly: {
      leads: 5000,
      conversionRate: 10, // %
      costPerLead: 2.5, // EUR
      activeHosts: 150,
      activeOwners: 100,
    },
    quarterly: {
      growth: 25, // %
      marketShare: 5, // % Barcelona/Madrid
      brandSearch: 1000, // búsquedas mensuales
    },
  },
}

// Plan de lanzamiento por ciudad
export const CITY_LAUNCH_PLAN = {
  barcelona: {
    phase: 'active',
    launched: '2024-01',
    tactics: [
      'Scraping Idealista BCN',
      'Partnership agencies',
      'Instagram hyperlocal',
      'Eventos networking',
    ],
    status: {
      leads: 45234,
      activeHosts: 89,
      activeListings: 234,
    },
  },
  madrid: {
    phase: 'active',
    launched: '2024-02',
    tactics: [
      'Google Ads geo Madrid',
      'LinkedIn B2B',
      'Blog "Co-living Madrid"',
      'Meetup groups',
    ],
    status: {
      leads: 31245,
      activeHosts: 53,
      activeListings: 178,
    },
  },
  valencia: {
    phase: 'planned',
    launch: '2024-Q2',
    tactics: [
      'Pre-launch waitlist',
      'Influencer partnerships',
      'PR local media',
    ],
  },
}
