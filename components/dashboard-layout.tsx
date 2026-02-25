"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { Bell } from "lucide-react"
import { FullPageLoadingSpinner } from "@/components/ui/loading-spinner"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (status === "loading") return // Still loading
    if (!session) {
      router.push("/auth")
    }
  }, [session, status, router])

  useEffect(() => {
    if (!session) return
    fetch("/api/notifications?unreadOnly=true")
      .then((res) => (res.ok ? res.json() : []))
      .then((list: unknown[]) => setUnreadCount(list.length))
      .catch(() => {})
  }, [session])

  if (status === "loading") {
    return <FullPageLoadingSpinner />
  }

  if (!session) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Current Page</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href="/notifications" title="Notifications">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-xs" variant="destructive">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
