import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "PROGRAM_HEAD"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            thesis: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const categoriesWithCount = categories.map(category => ({
      id: category.id,
      name: category.name,
      createdAt: category.createdAt.toISOString().split('T')[0],
      thesisCount: category._count.thesis
    }))

    return NextResponse.json(categoriesWithCount)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name }
    })

    if (existingCategory) {
      return NextResponse.json({ error: "Category already exists" }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: { name },
      include: {
        _count: {
          select: {
            thesis: true
          }
        }
      }
    })

    return NextResponse.json({
      id: category.id,
      name: category.name,
      createdAt: category.createdAt.toISOString().split('T')[0],
      thesisCount: category._count.thesis
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
