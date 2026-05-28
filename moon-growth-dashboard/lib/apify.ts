// Apify Integration - Scrapers automatizados

export interface ScraperConfig {
  name: string
  type: 'idealista' | 'fotocasa' | 'airbnb' | 'linkedin'
  city: string
  maxResults: number
}

export interface ScraperLead {
  name: string
  email?: string
  phone?: string
  properties?: number
  city: string
  source: string
}

// Ejecutar scraper de Idealista
export async function scrapeIdealista(city: string, maxResults: number = 100): Promise<ScraperLead[]> {
  // TODO: Llamar a Apify actor: apify/idealista-scraper
  // POST https://api.apify.com/v2/acts/apify~idealista-scraper/runs

  return []
}

// Ejecutar scraper de Fotocasa
export async function scrapeFotocasa(city: string, maxResults: number = 100): Promise<ScraperLead[]> {
  // TODO: Llamar a Apify actor para Fotocasa
  return []
}

// Scrapear anfitriones de Airbnb
export async function scrapeAirbnbHosts(city: string): Promise<ScraperLead[]> {
  // TODO: Usar Apify actor para Airbnb
  return []
}

// Scrapear agencias de LinkedIn
export async function scrapeLinkedInAgencies(city: string): Promise<ScraperLead[]> {
  // TODO: LinkedIn scraper vía Apify
  return []
}

// Procesar leads y guardar en Supabase
export async function processScrapedLeads(leads: ScraperLead[], type: 'anfitrion' | 'propietario' | 'agencia') {
  // TODO: Enviar a Supabase + Brevo
}
