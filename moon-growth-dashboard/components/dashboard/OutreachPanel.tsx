import { OutreachSequence } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, Users, TrendingUp } from 'lucide-react'

interface OutreachPanelProps {
  sequences: OutreachSequence[]
}

export function OutreachPanel({ sequences }: OutreachPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {sequences.map((seq) => (
        <Card key={seq.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{seq.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Pasos</span>
                <span className="font-semibold">{seq.steps}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Leads activos</span>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span className="font-semibold">{seq.activeLeads}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Conversión</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="font-semibold text-green-600">{seq.conversionRate}%</span>
                </div>
              </div>
              <Button className="w-full" size="sm" variant="moon">
                <Zap className="h-3 w-3 mr-1" />
                Gestionar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <Card className="border-dashed border-2 flex items-center justify-center min-h-[160px]">
        <div className="text-center">
          <Zap className="h-8 w-8 mx-auto mb-2 text-[#c9a962]" />
          <p className="text-sm font-medium">Nueva Secuencia</p>
          <p className="text-xs text-slate-500">Apollo + Brevo</p>
        </div>
      </Card>
    </div>
  )
}
