"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LucideIcon } from "lucide-react"

interface AnalyticsWidgetProps {
  title: string
  description?: string
  value: string | number
  change?: {
    value: number
    type: "increase" | "decrease"
    period: string
  }
  icon?: LucideIcon
  children?: React.ReactNode
}

export function AnalyticsWidget({ 
  title, 
  description, 
  value, 
  change, 
  icon: Icon,
  children 
}: AnalyticsWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {change && (
          <div className="flex items-center mt-2">
            <Badge 
              variant={change.type === "increase" ? "default" : "destructive"}
              className="text-xs"
            >
              {change.type === "increase" ? "+" : "-"}{Math.abs(change.value)}%
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">
              {change.period}
            </span>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  )
}
