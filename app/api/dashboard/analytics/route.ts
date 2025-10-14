import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = session.user?.role

    // Get current date and calculate date ranges
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    // Last 12 months for trends
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1)
    
    // Last month for comparison
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Base queries for all roles
    const [
      totalTheses,
      totalUsers,
      totalCategories,
      totalCourses,
      totalSchoolYears,
      publishedTheses,
      unpublishedTheses,
      recentTheses,
      categoryStats,
      monthlyUploads,
      yearlyStats
    ] = await Promise.all([
      // Total counts
      prisma.thesis.count(),
      prisma.user.count(),
      prisma.category.count(),
      prisma.course.count(),
      prisma.schoolYear.count(),
      
      // Published vs unpublished
      prisma.thesis.count({ where: { isPublishedOnline: true } }),
      prisma.thesis.count({ where: { isPublishedOnline: false } }),
      
      // Recent theses (last 30 days)
      prisma.thesis.findMany({
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          category: true,
          course: true,
          schoolYear: true,
          user: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Category distribution
      prisma.thesis.groupBy({
        by: ['categoryId'],
        _count: { categoryId: true }
      }),
      
      // Monthly uploads (last 12 months) - using Prisma instead of raw SQL
      prisma.thesis.findMany({
        where: {
          createdAt: {
            gte: twelveMonthsAgo
          }
        },
        select: {
          createdAt: true
        }
      }),
      
      // Yearly stats (last 5 years) - using Prisma instead of raw SQL
      prisma.thesis.findMany({
        where: {
          createdAt: {
            gte: new Date(currentYear - 5, 0, 1)
          }
        },
        select: {
          createdAt: true,
          isPublishedOnline: true
        }
      })
    ])

    // Get category names for distribution
    const categoryDistribution = await Promise.all(
      categoryStats.map(async (stat) => {
        const category = await prisma.category.findUnique({
          where: { id: stat.categoryId }
        })
        return {
          name: category?.name || 'Unknown',
          value: stat._count.categoryId,
          color: getCategoryColor(category?.name || 'Unknown')
        }
      })
    )

    // Get previous month counts for comparison
    const [
      previousMonthTheses,
      previousMonthUsers,
      previousMonthPublished
    ] = await Promise.all([
      prisma.thesis.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth
          }
        }
      }),
      prisma.thesis.count({
        where: {
          isPublishedOnline: true,
          createdAt: {
            gte: lastMonth,
            lt: thisMonth
          }
        }
      })
    ])

    // Calculate changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return { value: current > 0 ? 100 : 0, type: current > 0 ? 'increase' : 'decrease' }
      const change = ((current - previous) / previous) * 100
      return {
        value: Math.abs(Math.round(change)),
        type: change >= 0 ? 'increase' : 'decrease'
      }
    }

    // Role-specific data
    let roleSpecificData = {}
    
    if (role === "PROGRAM_HEAD") {
      const myTheses = await prisma.thesis.count({
        where: { userId: session.user?.id }
      })
      
      const myPublishedTheses = await prisma.thesis.count({
        where: { 
          userId: session.user?.id,
          isPublishedOnline: true 
        }
      })
      
      const myPreviousMonthTheses = await prisma.thesis.count({
        where: {
          userId: session.user?.id,
          createdAt: {
            gte: lastMonth,
            lt: thisMonth
          }
        }
      })

      roleSpecificData = {
        myTheses,
        myPublishedTheses,
        myPendingTheses: myTheses - myPublishedTheses,
        myThesesChange: calculateChange(myTheses, myPreviousMonthTheses)
      }
    }

    // Process monthly data for charts - ensure all 12 months are shown
    const monthlyDataMap = new Map<string, number>()
    monthlyUploads.forEach(thesis => {
      const monthKey = `${thesis.createdAt.getFullYear()}-${String(thesis.createdAt.getMonth() + 1).padStart(2, '0')}`
      monthlyDataMap.set(monthKey, (monthlyDataMap.get(monthKey) || 0) + 1)
    })
    
    // Generate all 12 months with zero values for missing months
    const monthlyData = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const count = monthlyDataMap.get(monthKey) || 0
      monthlyData.push({
        name: formatMonthName(monthKey),
        value: count
      })
    }

    // Process yearly data for charts
    const yearlyDataMap = new Map<string, { total: number; published: number }>()
    yearlyStats.forEach(thesis => {
      const year = thesis.createdAt.getFullYear().toString()
      const current = yearlyDataMap.get(year) || { total: 0, published: 0 }
      current.total += 1
      if (thesis.isPublishedOnline) {
        current.published += 1
      }
      yearlyDataMap.set(year, current)
    })
    
    const yearlyData = Array.from(yearlyDataMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, stats]) => ({
        name: year,
        value: stats.published
      }))

    // Format recent activity
    const recentActivity = recentTheses.map(thesis => ({
      id: thesis.id,
      type: 'thesis_upload',
      title: `New thesis uploaded: ${thesis.title}`,
      subtitle: `by ${thesis.user?.name || 'Unknown'} in ${thesis.category.name}`,
      timestamp: thesis.createdAt,
      icon: 'upload'
    }))

    return NextResponse.json({
      // General stats
      totalTheses,
      totalUsers,
      totalCategories,
      totalCourses,
      totalSchoolYears,
      publishedTheses,
      unpublishedTheses,
      
      // Changes from previous month
      changes: {
        theses: calculateChange(totalTheses, previousMonthTheses),
        users: calculateChange(totalUsers, previousMonthUsers),
        published: calculateChange(publishedTheses, previousMonthPublished)
      },
      
      // Charts data
      categoryDistribution,
      monthlyUploads: monthlyData,
      yearlyPublications: yearlyData,
      
      // Recent activity
      recentActivity,
      
      // Role-specific data
      ...roleSpecificData
    })

  } catch (error) {
    console.error("Error fetching dashboard analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getCategoryColor(categoryName: string): string {
  const colors = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8",
    "#82CA9D", "#FFC658", "#FF7C7C", "#8DD1E1", "#D084D0"
  ]
  
  const hash = categoryName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  return colors[Math.abs(hash) % colors.length]
}

function formatMonthName(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  const currentYear = new Date().getFullYear()
  const monthYear = parseInt(year)
  
  // Show year if it's different from current year or if we're showing multiple years
  if (monthYear !== currentYear) {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  return date.toLocaleDateString('en-US', { month: 'short' })
}
