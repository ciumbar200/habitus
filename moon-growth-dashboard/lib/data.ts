import { Lead, Campaign, ContentItem, MetricCard, ScraperTask, OutreachSequence } from './types'

// Datos de ejemplo - después conectar con APIs reales
export const mockLeads: Lead[] = [
  { id: '1', type: 'anfitrion', name: 'María García', email: 'maria@example.com', city: 'Barcelona', properties: 2, status: 'contactado', source: 'apollo', createdAt: new Date('2024-01-15'), lastContact: new Date('2024-01-20') },
  { id: '2', type: 'propietario', name: 'Juan López', email: 'juan@example.com', phone: '+34612345678', city: 'Madrid', properties: 5, status: 'en_progreso', source: 'brevo', createdAt: new Date('2024-01-10'), lastContact: new Date('2024-01-18') },
  { id: '3', type: 'agencia', name: 'Inmo BCN', email: 'info@immobcn.com', city: 'Barcelona', properties: 15, status: 'nuevo', source: 'apify', createdAt: new Date() },
  { id: '4', type: 'anfitrion', name: 'Carlos Ruiz', email: 'carlos@example.com', city: 'Madrid', status: 'convertido', source: 'web', createdAt: new Date('2024-01-05') },
  { id: '5', type: 'propietario', name: 'Ana Martínez', email: 'ana@example.com', city: 'Barcelona', properties: 3, status: 'perdido', source: 'apollo', createdAt: new Date('2024-01-01') },
]

export const mockCampaigns: Campaign[] = [
  { id: '1', name: 'Lanzamiento Anfitriones Barcelona', type: 'email', status: 'active', leads: 245, conversionRate: 12.5, startDate: new Date('2024-01-01') },
  { id: '2', name: 'Instagram Ads Propietarios', type: 'ads', platform: 'instagram', status: 'active', leads: 1200, conversionRate: 3.2, budget: 500, spent: 320, startDate: new Date('2024-01-10') },
  { id: '3', name: 'SEO Blog Co-living', type: 'content', status: 'active', leads: 890, conversionRate: 8.7, startDate: new Date('2024-01-01') },
]

export const mockContent: ContentItem[] = [
  { id: '1', type: 'blog', title: 'Cómo convertir tu piso en income pasivo en Barcelona', status: 'published', publishedAt: new Date('2024-01-15'), engagement: { views: 2400, likes: 120, shares: 45 }, aiGenerated: true },
  { id: '2', type: 'social', title: 'Reel 5 tips para anfitriones', status: 'scheduled', platform: 'instagram', scheduledFor: new Date('2024-01-25'), aiGenerated: true },
  { id: '3', type: 'video', title: 'TikTok tour virtual habitación', status: 'draft', platform: 'tiktok', aiGenerated: true },
  { id: '4', type: 'email', title: 'Secuencia bienvenida propietarios', status: 'published', aiGenerated: false },
]

export const mockMetrics: MetricCard[] = [
  { title: 'Leads Totales', value: '2,847', change: 23.5, trend: 'up' },
  { title: 'Anfitriones Activos', value: '142', change: 12.0, trend: 'up' },
  { title: 'Propietarios Activos', value: '89', change: 8.5, trend: 'up' },
  { title: 'Conversión Global', value: '11.2%', change: -2.1, trend: 'down' },
  { title: 'Coste por Lead', value: '€2.34', change: -15.8, trend: 'up' },
  { title: 'Engagement Social', value: '8.7%', change: 34.2, trend: 'up' },
]

export const mockScrapers: ScraperTask[] = [
  { id: '1', name: 'Idealista Barcelona Anfitriones', type: 'idealista', status: 'idle', leadsFound: 234, lastRun: new Date('2024-01-20') },
  { id: '2', name: 'Fotocasa Madrid Propietarios', type: 'fotocasa', status: 'idle', leadsFound: 189, lastRun: new Date('2024-01-19') },
  { id: '3', name: 'LinkedIn Agencias Inmobiliarias', type: 'linkedin', status: 'idle', leadsFound: 45, lastRun: new Date('2024-01-18') },
]

export const mockSequences: OutreachSequence[] = [
  { id: '1', name: 'Secuencia Anfitriones Cold', type: 'anfitrion', steps: 5, activeLeads: 145, conversionRate: 8.3 },
  { id: '2', name: 'Secuencia Propietarios Warm', type: 'propietario', steps: 3, activeLeads: 67, conversionRate: 24.5 },
  { id: '3', name: 'Onboarding Agencias', type: 'agencia', steps: 7, activeLeads: 23, conversionRate: 31.2 },
]

export const targets = {
  spain: { cities: ['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Zaragoza'], targetLeads: 50000 },
  europe: { countries: ['Portugal', 'France', 'Italy', 'Germany', 'Netherlands'], targetLeads: 200000 },
}
