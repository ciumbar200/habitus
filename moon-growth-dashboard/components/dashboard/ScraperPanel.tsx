import { ScraperTask } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, RefreshCw, Globe, Home, Link } from 'lucide-react'

interface ScraperPanelProps {
  scrapers: ScraperTask[]
}

const scraperIcons = {
  idealista: Globe,
  fotocasa: Globe,
  airbnb: Home,
  linkedin: Link,
}

export function ScraperPanel({ scrapers }: ScraperPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {scrapers.map((scraper) => {
        const Icon = scraperIcons[scraper.type]
        const statusColor = {
          idle: 'default',
          running: 'warning',
          completed: 'success',
          error: 'danger',
        }[scraper.status]

        return (
          <Card key={scraper.id} className={scraper.status === 'running' ? 'border-yellow-500/50' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[#c9a962]" />
                  {scraper.name}
                </div>
                <Badge variant={statusColor as any} className="capitalize">{scraper.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Leads encontrados</span>
                  <span className="font-semibold">{scraper.leadsFound}</span>
                </div>
                {scraper.lastRun && (
                  <div className="text-xs text-slate-500">
                    Última ejecución: {scraper.lastRun.toLocaleDateString('es-ES')}
                  </div>
                )}
                <Button className="w-full" size="sm" variant={scraper.status === 'running' ? 'warning' : 'moon'}>
                  {scraper.status === 'running' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Ejecutando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Ejecutar Scraper
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
      <Card className="border-dashed border-2 flex items-center justify-center min-h-[180px] cursor-pointer hover:border-[#c9a962] transition-colors">
        <div className="text-center">
          <PlusIcon className="h-8 w-8 mx-auto mb-2 text-slate-400" />
          <p className="text-sm font-medium">Nuevo Scraper</p>
          <p className="text-xs text-slate-500">Idealista, Fotocasa, Airbnb...</p>
        </div>
      </Card>
    </div>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
