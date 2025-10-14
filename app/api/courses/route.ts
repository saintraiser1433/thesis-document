import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/courses - Get all courses
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "PROGRAM_HEAD"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const courses = await prisma.course.findMany({
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

    const coursesWithCount = courses.map(course => ({
      id: course.id,
      name: course.name,
      code: course.code,
      createdAt: course.createdAt.toISOString().split('T')[0],
      thesisCount: course._count.thesis
    }))

    return NextResponse.json(coursesWithCount)
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/courses - Create new course
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, code } = await request.json()

    if (!name || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if course code already exists
    const existingCourse = await prisma.course.findFirst({
      where: {
        OR: [
          { code: code.toUpperCase() },
          { name: name }
        ]
      }
    })

    if (existingCourse) {
      return NextResponse.json({ 
        error: existingCourse.code === code.toUpperCase() 
          ? "Course code already exists" 
          : "Course name already exists" 
      }, { status: 400 })
    }

    const course = await prisma.course.create({
      data: {
        name,
        code: code.toUpperCase()
      },
      include: {
        _count: {
          select: {
            thesis: true
          }
        }
      }
    })

    return NextResponse.json({
      id: course.id,
      name: course.name,
      code: course.code,
      createdAt: course.createdAt.toISOString().split('T')[0],
      thesisCount: course._count.thesis
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
