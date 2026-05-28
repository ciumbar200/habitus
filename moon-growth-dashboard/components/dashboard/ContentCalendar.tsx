import { ContentItem } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Video, FileText, Mail, Share2 } from 'lucide-react'

interface ContentCalendarProps {
  content: ContentItem[]
}

const typeIcons = {
  blog: FileText,
  social: Share2,
  email: Mail,
  video: Video,
  landing: FileText,
}

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-500',
  tiktok: 'bg-black',
  linkedin: 'bg-blue-600',
  blog: 'bg-slate-600',
}

export function ContentCalendar({ content }: ContentCalendarProps) {
  const statusColors: Record<ContentItem['status'], 'default' | 'success' | 'warning'> = {
    idea: 'default',
    draft: 'default',
    scheduled: 'warning',
    published: 'success',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendario de Contenido</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {content.map((item) => {
            const Icon = typeIcons[item.type]
            return (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <div className="h-10 w-10 rounded-lg bg-[#c9a962]/20 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[#c9a962]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={statusColors[item.status]} className="capitalize text-xs">{item.status}</Badge>
                    {item.platform && (
                      <Badge className={`${platformColors[item.platform]} text-white text-xs`}>{item.platform}</Badge>
                    )}
                    {item.aiGenerated && <Badge variant="moon" className="text-xs">✨ IA</Badge>}
                  </div>
                </div>
                <div className="text-right text-sm text-slate-500">
                  {item.scheduledFor && (
                    <p className="text-xs">{item.scheduledFor.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                  )}
                  {item.engagement && (
                    <p className="text-xs font-medium">{item.engagement.views} views</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
