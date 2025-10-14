import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/courses/[id] - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, code } = await request.json()
    const { id } = await params

    if (!name || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id }
    })

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Check if course code/name is taken by another course
    const duplicateCourse = await prisma.course.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { code: code.toUpperCase() },
              { name: name }
            ]
          }
        ]
      }
    })

    if (duplicateCourse) {
      return NextResponse.json({ 
        error: duplicateCourse.code === code.toUpperCase() 
          ? "Course code already taken by another course" 
          : "Course name already taken by another course" 
      }, { status: 400 })
    }

    const course = await prisma.course.update({
      where: { id },
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
    })
  } catch (error) {
    console.error("Error updating course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            thesis: true
          }
        }
      }
    })

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Check if course has thesis
    if (existingCourse._count.thesis > 0) {
      return NextResponse.json({ 
        error: "Cannot delete course with existing thesis. Please move or delete the thesis first." 
      }, { status: 400 })
    }

    await prisma.course.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Course deleted successfully" })
  } catch (error) {
    console.error("Error deleting course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
