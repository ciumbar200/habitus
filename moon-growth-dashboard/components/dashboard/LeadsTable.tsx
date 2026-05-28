import { Lead } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MoreVertical } from 'lucide-react'

interface LeadsTableProps {
  leads: Lead[]
  title: string
}

const statusColors: Record<Lead['status'], 'default' | 'success' | 'warning' | 'danger'> = {
  nuevo: 'default',
  contactado: 'default',
  en_progreso: 'warning',
  convertido: 'success',
  perdido: 'danger',
}

const typeColors: Record<Lead['type'], 'moon' | 'default'> = {
  anfitrion: 'moon',
  propietario: 'moon',
  agencia: 'default',
}

export function LeadsTable({ leads, title }: LeadsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="moon">{leads.length} leads</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Nombre</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Tipo</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Ciudad</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Estado</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Fuente</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-slate-500">{lead.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={typeColors[lead.type]} className="capitalize">{lead.type}</Badge>
                  </td>
                  <td className="py-3 px-4 text-sm">{lead.city}</td>
                  <td className="py-3 px-4">
                    <Badge variant={statusColors[lead.status]} className="capitalize">{lead.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="py-3 px-4 text-sm capitalize">{lead.source}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost"><Mail className="h-4 w-4" /></Button>
                      {lead.phone && <Button size="sm" variant="ghost"><Phone className="h-4 w-4" /></Button>}
                      <Button size="sm" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
