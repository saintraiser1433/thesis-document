"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  BookOpen, 
  Users, 
  FolderOpen, 
  Settings, 
  LogOut, 
  User,
  FileText,
  BarChart3,
  Upload,
  Calendar,
  ClipboardList,
  UserCheck,
  Archive
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { TeamSwitcher } from "@/components/team-switcher"
import { NavUser } from "@/components/nav-user"

const getNavigationItems = (role: string) => {
  const baseItems = []
  
  // Dashboard for ADMIN and PROGRAM_HEAD; PEER_REVIEWER has own dashboard
  if (['ADMIN', 'PROGRAM_HEAD'].includes(role)) {
    baseItems.push({
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
    })
  }
  if (role === 'PEER_REVIEWER') {
    baseItems.push(
      { title: "Dashboard", url: "/peer-reviewer/dashboard", icon: BarChart3 },
      { title: "Assignments", url: "/peer-reviewer/assignments", icon: ClipboardList }
    )
  }

  const roleSpecificItems = {
    ADMIN: [
      {
        title: "User Management",
        url: "/admin/users",
        icon: Users,
      },
      {
        title: "Categories",
        url: "/admin/categories",
        icon: FolderOpen,
      },
      {
        title: "Courses",
        url: "/admin/courses",
        icon: BookOpen,
      },
      {
        title: "School Years",
        url: "/admin/school-years",
        icon: Calendar,
      },
      {
        title: "All Thesis",
        url: "/admin/thesis",
        icon: FileText,
      },
      {
        title: "Routing Schedules",
        url: "/admin/routing",
        icon: ClipboardList,
      },
      {
        title: "Peer Reviewers",
        url: "/admin/peer-reviewers",
        icon: UserCheck,
      },
    ],
    PROGRAM_HEAD: [
      {
        title: "Add thesis",
        url: "/program-head/upload",
        icon: Upload,
      },
      {
        title: "Browse Thesis",
        url: "/thesis/browse",
        icon: BookOpen,
      },
      {
        title: "Presented Thesis",
        url: "/program-head/presented-theses",
        icon: FileText,
      },
      {
        title: "Archive Approvals",
        url: "/program-head/archive-approvals",
        icon: Archive,
      },
    ],
    STUDENT: [
      {
        title: "Upload Thesis",
        url: "/thesis/upload",
        icon: Upload,
      },
      {
        title: "Browse Thesis",
        url: "/thesis/browse",
        icon: BookOpen,
      },
      {
        title: "Thesis Routing",
        url: "/thesis/routing",
        icon: ClipboardList,
      },
    ],
    TEACHER: [
      {
        title: "Upload Thesis",
        url: "/thesis/upload",
        icon: Upload,
      },
      {
        title: "Browse Thesis",
        url: "/thesis/browse",
        icon: BookOpen,
      },
      {
        title: "Thesis Routing",
        url: "/thesis/routing",
        icon: ClipboardList,
      },
    ],
    PEER_REVIEWER: [],
  }

  return [...baseItems, ...(roleSpecificItems[role as keyof typeof roleSpecificItems] || [])]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const role = session?.user?.role || "STUDENT"
  const navigationItems = getNavigationItems(role)

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      router.push("/auth")
    } catch {
      router.push("/auth")
    }
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="px-2">
          <TeamSwitcher
            teams={[
              { name: "Thesis Archive", logo: BookOpen, plan: role },
            ]}
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.url
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <Icon className="mr-2 h-4 w-4" />
                        {item.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: session?.user?.name || "User",
            email: session?.user?.email || "",
            avatar: "", // Will be generated by DiceBear
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
