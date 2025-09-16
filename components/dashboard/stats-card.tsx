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
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-semibold text-gray-900 mt-1">{value}</h3>
          <div className={cn(
            "flex items-center mt-2 text-sm",
            changeType === 'increase' && 'text-green-600',
            changeType === 'decrease' && 'text-red-600',
            changeType === 'neutral' && 'text-gray-500'
          )}>
            {changeType === 'increase' && <ArrowUp className="h-4 w-4 mr-1" />}
            {changeType === 'decrease' && <ArrowDown className="h-4 w-4 mr-1" />}
            {changeType === 'neutral' && <ArrowRight className="h-4 w-4 mr-1" />}
            {change}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-blue-50">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  )
}
