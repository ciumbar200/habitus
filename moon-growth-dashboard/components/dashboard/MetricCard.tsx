import { MetricCard as MetricCardType } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps extends MetricCardType {}

export function MetricCard({ title, value, change, trend }: MetricCardProps) {
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-slate-500'
  const changeColor = change >= 0 ? 'text-green-500' : 'text-red-500'

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={cn('flex items-center gap-1', trendColor)}>
            <TrendIcon className="h-4 w-4" />
          </div>
        </div>
        <p className={cn('text-xs mt-2', changeColor)}>
          {change >= 0 ? '+' : ''}{change}% vs mes anterior
        </p>
      </CardContent>
    </Card>
  )
}
