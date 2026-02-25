"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalyticsWidget } from "@/components/analytics/analytics-widget"
import { AnalyticsLineChart } from "@/components/analytics/line-chart"
import { AnalyticsBarChart } from "@/components/analytics/bar-chart"
import { AnalyticsPieChart } from "@/components/analytics/pie-chart"
import { AnalyticsAreaChart } from "@/components/analytics/area-chart"
import { BookOpen, Users, FileText, BarChart3, TrendingUp, Download, Eye, Upload, Calendar, Award, Clock, UserPlus } from "lucide-react"
import { toast } from "react-toastify"

interface DashboardData {
  totalTheses: number
  totalUsers: number
  totalCategories: number
  totalCourses: number
  totalSchoolYears: number
  publishedTheses: number
  unpublishedTheses: number
  changes: {
    theses: { value: number; type: 'increase' | 'decrease' }
    users: { value: number; type: 'increase' | 'decrease' }
    published: { value: number; type: 'increase' | 'decrease' }
  }
  categoryDistribution: Array<{ name: string; value: number; color: string }>
  monthlyUploads: Array<{ name: string; value: number }>
  yearlyPublications: Array<{ name: string; value: number }>
  recentActivity: Array<{
    id: string
    type: string
    title: string
    subtitle: string
    timestamp: string
    icon: string
  }>
  myTheses?: number
  myPublishedTheses?: number
  myPendingTheses?: number
  myThesesChange?: { value: number; type: 'increase' | 'decrease' }
}

export default function Page() {
  const { data: session } = useSession()
  const role = session?.user?.role || "STUDENT"
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [session])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/analytics')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      } else {
        toast.error("Failed to load dashboard data")
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const getDashboardStats = () => {
    if (!dashboardData) return []

    switch (role) {
      case "ADMIN":
        return [
          { 
            title: "Total Users", 
            value: dashboardData.totalUsers.toLocaleString(), 
            icon: Users, 
            change: { ...dashboardData.changes.users, period: "from last month" } 
          },
          { 
            title: "Total Thesis", 
            value: dashboardData.totalTheses.toLocaleString(), 
            icon: FileText, 
            change: { ...dashboardData.changes.theses, period: "from last month" } 
          },
          { 
            title: "Categories", 
            value: dashboardData.totalCategories.toString(), 
            icon: BookOpen, 
            change: { value: 0, type: "increase" as const, period: "from last month" } 
          },
          { 
            title: "Published Online", 
            value: dashboardData.publishedTheses.toLocaleString(), 
            icon: BarChart3, 
            change: { ...dashboardData.changes.published, period: "from last month" } 
          },
        ]
      case "PROGRAM_HEAD":
        return [
          { 
            title: "My Thesis", 
            value: (dashboardData.myTheses || 0).toString(), 
            icon: FileText, 
            change: { ...(dashboardData.myThesesChange || { value: 0, type: "increase" }), period: "from last month" } 
          },
          { 
            title: "Published", 
            value: (dashboardData.myPublishedTheses || 0).toString(), 
            icon: BarChart3, 
            change: { value: 0, type: "increase" as const, period: "from last month" } 
          },
          { 
            title: "Pending Review", 
            value: (dashboardData.myPendingTheses || 0).toString(), 
            icon: BookOpen, 
            change: { value: 0, type: "decrease" as const, period: "from last month" } 
          },
          { 
            title: "Total Downloads", 
            value: "1,234", 
            icon: Download, 
            change: { value: 18, type: "increase" as const, period: "from last month" } 
          },
        ]
      default:
        return [
          { 
            title: "Available Thesis", 
            value: dashboardData.totalTheses.toLocaleString(), 
            icon: FileText, 
            change: { ...dashboardData.changes.theses, period: "from last month" } 
          },
          { 
            title: "Categories", 
            value: dashboardData.totalCategories.toString(), 
            icon: BookOpen, 
            change: { value: 0, type: "increase" as const, period: "from last month" } 
          },
          { 
            title: "Published Online", 
            value: dashboardData.publishedTheses.toLocaleString(), 
            icon: BarChart3, 
            change: { ...dashboardData.changes.published, period: "from last month" } 
          },
          { 
            title: "Total Views", 
            value: "8,234", 
            icon: Eye, 
            change: { value: 22, type: "increase" as const, period: "from last month" } 
          },
        ]
    }
  }

  const stats = getDashboardStats()

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name}! Here's an overview of your thesis archive system.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <AnalyticsWidget
                key={stat.title}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                icon={Icon}
              />
            )
          })}
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Thesis Uploads Trend
              </CardTitle>
              <CardDescription>
                Monthly thesis uploads over the last 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsLineChart 
                data={dashboardData?.monthlyUploads || []} 
                color="#8884d8" 
                height={250} 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Category Distribution
              </CardTitle>
              <CardDescription>
                Thesis distribution across different categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsPieChart 
                data={dashboardData?.categoryDistribution || []} 
                height={250} 
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="mr-2 h-5 w-5" />
                Published vs Unpublished
              </CardTitle>
              <CardDescription>
                Current thesis publication status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Published Online</span>
                  </div>
                  <span className="font-semibold">{dashboardData?.publishedTheses || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                    <span className="text-sm">Unpublished</span>
                  </div>
                  <span className="font-semibold">{dashboardData?.unpublishedTheses || 0}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total</span>
                    <span className="font-bold text-lg">{dashboardData?.totalTheses || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Publication Trends
              </CardTitle>
              <CardDescription>
                Published thesis by year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsBarChart 
                data={dashboardData?.yearlyPublications || []} 
                color="#FF8042" 
                height={250} 
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity and Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest updates in the thesis archive system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={activity.id} className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        activity.type === 'thesis_upload' ? 'bg-green-500' :
                        activity.type === 'thesis_published' ? 'bg-blue-500' :
                        activity.type === 'category_created' ? 'bg-yellow-500' :
                        'bg-purple-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks based on your role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {role === "ADMIN" && (
                  <>
                    <a href="/admin/users" className="block w-full text-left p-2 rounded hover:bg-muted transition-colors">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Manage Users ({dashboardData?.totalUsers || 0})
                      </div>
                    </a>
                    <a href="/admin/thesis" className="block w-full text-left p-2 rounded hover:bg-muted transition-colors">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        View All Thesis ({dashboardData?.totalTheses || 0})
                      </div>
                    </a>
                    <a href="/admin/categories" className="block w-full text-left p-2 rounded hover:bg-muted transition-colors">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Manage Categories ({dashboardData?.totalCategories || 0})
                      </div>
                    </a>
                    <a href="/admin/courses" className="block w-full text-left p-2 rounded hover:bg-muted transition-colors">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2" />
                        Manage Courses ({dashboardData?.totalCourses || 0})
                      </div>
                    </a>
                  </>
                )}
                {role === "PROGRAM_HEAD" && (
                  <>
                    <a href="/program-head/upload" className="block w-full text-left p-2 rounded hover:bg-muted transition-colors">
                      <div className="flex items-center">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New Thesis
                      </div>
                    </a>
                    <a href="/program-head/thesis" className="block w-full text-left p-2 rounded hover:bg-muted transition-colors">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Manage My Thesis ({dashboardData?.myTheses || 0})
                      </div>
                    </a>
                    <a href="/program-head/thesis" className="block w-full text-left p-2 rounded hover:bg-muted transition-colors">
                      <div className="flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Published ({dashboardData?.myPublishedTheses || 0})
                      </div>
                    </a>
                    <a href="/program-head/thesis" className="block w-full text-left p-2 rounded hover:bg-muted transition-colors">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Pending Review ({dashboardData?.myPendingTheses || 0})
                      </div>
                    </a>
                  </>
                )}
                {(role === "STUDENT" || role === "TEACHER") && (
                  <>
                    <a href="/thesis/browse" className="block w-full text-left p-2 rounded hover:bg-muted transition-colors">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Browse Thesis ({dashboardData?.totalTheses || 0})
                      </div>
                    </a>
                    <a href="/thesis/browse" className="block w-full text-left p-2 rounded hover:bg-muted transition-colors">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        View Published Works ({dashboardData?.publishedTheses || 0})
                      </div>
                    </a>
                    <a href="/thesis/browse" className="block w-full text-left p-2 rounded hover:bg-muted transition-colors">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Browse by Category ({dashboardData?.totalCategories || 0})
                      </div>
                    </a>
                    <a href="/thesis/browse" className="block w-full text-left p-2 rounded hover:bg-muted transition-colors">
                      <div className="flex items-center">
                        <Download className="h-4 w-4 mr-2" />
                        Download Thesis
                      </div>
                    </a>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
