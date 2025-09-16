import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon
  description?: string
}

export function StatsCard({ title, value, change, changeType = "neutral", icon: Icon, description }: StatsCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-green-600"
      case "negative":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card className="shadow-lg shadow-white/20 bg-white/95 backdrop-blur-sm border-white/30 hover:shadow-xl hover:shadow-white/30 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && <p className={`text-xs ${getChangeColor()}`}>{change}</p>}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}
