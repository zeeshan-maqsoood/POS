import { ArrowUp, ArrowDown, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string
  change: string
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
}

export function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
}: StatsCardProps) {
  return (
    <div className="relative rounded-xl border border-gray-200 bg-white/90 p-6 shadow-sm hover-lift animate-fade-in">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-purple-400/40 via-indigo-400/40 to-purple-400/40" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{title}</p>
          <h3 className="mt-1 text-2xl font-semibold text-gray-900">{value}</h3>
          <div
            className={cn(
              "mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
              changeType === 'increase' && 'bg-emerald-50 text-emerald-700',
              changeType === 'decrease' && 'bg-red-50 text-red-700',
              changeType === 'neutral' && 'bg-gray-100 text-gray-600'
            )}
          >
            {changeType === 'increase' && <ArrowUp className="mr-1 h-3.5 w-3.5" />}
            {changeType === 'decrease' && <ArrowDown className="mr-1 h-3.5 w-3.5" />}
            {changeType === 'neutral' && <ArrowRight className="mr-1 h-3.5 w-3.5" />}
            {change}
          </div>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 p-3 ring-1 ring-inset ring-indigo-100">
          <Icon className="h-6 w-6 text-indigo-600" />
        </div>
      </div>
    </div>
  )
}

