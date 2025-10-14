import * as React from "react"
import { cn } from "@/lib/utils"

interface GradientBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "published" | "unpublished" | "admin" | "program_head" | "teacher" | "student" | "default"
  children: React.ReactNode
}

const gradientVariants = {
  published: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25",
  unpublished: "bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-lg shadow-slate-500/25",
  admin: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25",
  program_head: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25",
  teacher: "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25",
  student: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25",
  default: "bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg shadow-gray-500/25",
}

export function GradientBadge({ 
  className, 
  variant = "default", 
  children, 
  ...props 
}: GradientBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 hover:scale-105",
        gradientVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
