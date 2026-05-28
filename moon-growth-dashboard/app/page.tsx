'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { LeadsTable } from '@/components/dashboard/LeadsTable'
import { ScraperPanel } from '@/components/dashboard/ScraperPanel'
import { ContentCalendar } from '@/components/dashboard/ContentCalendar'
import { AIContentGenerator } from '@/components/dashboard/AIContentGenerator'
import { OutreachPanel } from '@/components/dashboard/OutreachPanel'
import { mockMetrics, mockLeads, mockScrapers, mockContent, mockSequences } from '@/lib/data'
import { Moon, Target, TrendingUp, Users, Zap, Globe, FileText, Video, Settings } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 pb-16">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#c9a962] flex items-center justify-center">
                <Moon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">: moon Growth Dashboard</h1>
                <p className="text-xs text-slate-500">Centro de mando • Europa Leader Strategy</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <p className="font-semibold">Target Europa</p>
                <p className="text-xs text-slate-500">200K leads objetivo</p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#1a1a2e] to-[#c9a962] text-white text-sm font-medium hover:opacity-90 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Config
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Metricas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
          {mockMetrics.map((metric, i) => (
            <MetricCard key={i} {...metric} />
          ))}
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <Users className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="scrapers" className="gap-2">
              <Globe className="h-4 w-4" />
              Scrapers
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <FileText className="h-4 w-4" />
              Contenido
            </TabsTrigger>
            <TabsTrigger value="outreach" className="gap-2">
              <Zap className="h-4 w-4" />
              Outreach
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Video className="h-4 w-4" />
              AI Studio
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <LeadsTable leads={mockLeads.slice(0, 3)} title="Leads Recientes" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <Target className="h-8 w-8 mb-2 opacity-80" />
                    <p className="text-sm opacity-80">Leads España</p>
                    <p className="text-2xl font-bold">45,234 / 50,000</p>
                    <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white w-[90%]" />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <Globe className="h-8 w-8 mb-2 opacity-80" />
                    <p className="text-sm opacity-80">Leads Europa</p>
                    <p className="text-2xl font-bold">12,847 / 200,000</p>
                    <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white w-[6%]" />
                    </div>
                  </div>
                </div>
              </div>
              <ContentCalendar content={mockContent.slice(0, 4)} />
            </div>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <LeadsTable leads={mockLeads.filter(l => l.type === 'anfitrion')} title="Anfitriones" />
              <LeadsTable leads={mockLeads.filter(l => l.type === 'propietario')} title="Propietarios" />
            </div>
            <LeadsTable leads={mockLeads.filter(l => l.type === 'agencia')} title="Agencias" />
          </TabsContent>

          {/* Scrapers Tab */}
          <TabsContent value="scrapers" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Scrapers Automatizados</h2>
                <p className="text-slate-500">Apify + Custom Integrations</p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#1a1a2e] to-[#c9a962] text-white text-sm font-medium hover:opacity-90">
                Ejecutar Todos
              </button>
            </div>
            <ScraperPanel scrapers={mockScrapers} />
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ContentCalendar content={mockContent} />
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900">
                  <h3 className="font-semibold mb-2">Blog Posts SEO</h3>
                  <div className="space-y-2">
                    {['Cómo convertir piso en income', 'Guía co-living BCN', 'Rentabilidad habitaciones'].map((title, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-800">
                        <span className="text-sm">{title}</span>
                        <span className="text-xs text-green-600">+{200 + i * 50} views</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900">
                  <h3 className="font-semibold mb-2">Redes Sociales</h3>
                  <div className="space-y-2">
                    {['Instagram', 'TikTok', 'LinkedIn'].map((platform, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-800">
                        <span className="text-sm">{platform}</span>
                        <span className="text-xs">{['12.5K', '8.3K', '4.2K'][i]} followers</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Outreach Tab */}
          <TabsContent value="outreach" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Outreach Automatizado</h2>
                <p className="text-slate-500">Apollo.io + Brevo CRM + Sequences</p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#1a1a2e] to-[#c9a962] text-white text-sm font-medium hover:opacity-90">
                Nueva Campaña
              </button>
            </div>
            <OutreachPanel sequences={mockSequences} />
          </TabsContent>

          {/* AI Studio Tab */}
          <TabsContent value="ai" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">AI Content Studio</h2>
                <p className="text-slate-500">Claude Skills + Video IA + Multi-platform</p>
              </div>
            </div>
            <AIContentGenerator />
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { platform: 'Instagram', desc: 'Posts, Reels, Stories', type: 'social' as const, platformKey: 'instagram' },
                { platform: 'TikTok', desc: 'Videos cortos IA', type: 'video' as const, platformKey: 'tiktok' },
                { platform: 'Blog', desc: 'Artículos SEO', type: 'blog' as const, platformKey: undefined },
              ].map((item, i) => (
                <div key={item.platform} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-lg ${i === 0 ? 'bg-pink-500/20' : i === 1 ? 'bg-black' : 'bg-blue-500/20'} flex items-center justify-center`}>
                      <Video className={`h-5 w-5 ${i === 1 ? 'text-white' : ''}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{item.platform}</h4>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Usa el generador de arriba — selecciona tipo {item.type} y pulsa Generar.
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer status bar */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2 px-4">
        <div className="container mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Apollo.io conectado
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Brevo CRM sincronizado
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Supabase activo
            </span>
          </div>
          <div className="text-slate-500">
            : moon shared living • Growth Dashboard v1.0
          </div>
        </div>
      </footer>
    </div>
  )
}
