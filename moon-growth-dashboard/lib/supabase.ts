// Supabase Integration - Base de datos centralizada

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// Leads
export async function getLeads(type?: 'anfitrion' | 'propietario' | 'agencia') {
  let query = supabase.from('leads').select('*')
  if (type) query = query.eq('type', type)
  const { data, error } = await query.order('created_at', { ascending: false })
  return { data, error }
}

export async function createLead(lead: {
  type: 'anfitrion' | 'propietario' | 'agencia'
  name: string
  email: string
  phone?: string
  city: string
  properties?: number
  source: string
}) {
  const { data, error } = await supabase.from('leads').insert([lead]).select()
  return { data, error }
}

export async function updateLeadStatus(id: string, status: string) {
  const { data, error } = await supabase.from('leads').update({ status }).eq('id', id).select()
  return { data, error }
}

// Métricas
export async function getMetrics() {
  const [leadsCount, anfitrionesCount, propietariosCount] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('type', 'anfitrion'),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('type', 'propietario'),
  ])

  return {
    total: leadsCount.count || 0,
    anfitriones: anfitrionesCount.count || 0,
    propietarios: propietariosCount.count || 0,
  }
}

// Contenido
export async function getContentItems() {
  const { data, error } = await supabase.from('content').select('*').order('created_at', { ascending: false })
  return { data, error }
}

export async function createContent(content: {
  type: string
  title: string
  platform?: string
  scheduled_for?: string
  ai_generated: boolean
}) {
  const { data, error } = await supabase.from('content').insert([content]).select()
  return { data, error }
}
