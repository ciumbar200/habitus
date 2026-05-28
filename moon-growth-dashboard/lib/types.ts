// Types para Moon Growth Dashboard

export type LeadType = 'anfitrion' | 'propietario' | 'agencia'
export type LeadStatus = 'nuevo' | 'contactado' | 'en_progreso' | 'convertido' | 'perdido'
export type ContentType = 'blog' | 'social' | 'email' | 'video' | 'landing'

export interface Lead {
  id: string
  type: LeadType
  name: string
  email: string
  phone?: string
  city: string
  properties?: number
  status: LeadStatus
  source: 'apollo' | 'brevo' | 'web' | 'referral' | 'manual' | 'apify'
  createdAt: Date
  lastContact?: Date
  notes?: string
}

export interface Campaign {
  id: string
  name: string
  type: 'email' | 'social' | 'ads' | 'content'
  platform?: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  leads: number
  conversionRate: number
  budget?: number
  spent?: number
  startDate: Date
  endDate?: Date
}

export interface ContentItem {
  id: string
  type: ContentType
  title: string
  status: 'idea' | 'draft' | 'scheduled' | 'published'
  platform?: string
  scheduledFor?: Date
  publishedAt?: Date
  engagement?: { views: number; likes: number; shares: number }
  aiGenerated: boolean
}

export interface MetricCard {
  title: string
  value: string | number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export interface ScraperTask {
  id: string
  name: string
  type: 'idealista' | 'fotocasa' | 'airbnb' | 'linkedin'
  status: 'idle' | 'running' | 'completed' | 'error'
  leadsFound: number
  lastRun?: Date
}

export interface OutreachSequence {
  id: string
  name: string
  type: LeadType
  steps: number
  activeLeads: number
  conversionRate: number
}
