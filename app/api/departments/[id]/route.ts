import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/departments/[id] - update department
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const name = String(body.name ?? "").trim()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const dept = await prisma.department.findUnique({ where: { id } })
    if (!dept) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    const existing = await prisma.department.findFirst({
      where: {
        name,
        NOT: { id },
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Another department with this name already exists" },
        { status: 400 }
      )
    }

    const updated = await prisma.department.update({
      where: { id },
      data: { name },
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Error updating department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/departments/[id] - delete department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            theses: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    if (existing._count.users > 0 || existing._count.theses > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete department that is assigned to users or theses. Please reassign or remove them first.",
        },
        { status: 400 }
      )
    }

    await prisma.department.delete({ where: { id } })

    return NextResponse.json({ message: "Department deleted successfully" })
  } catch (error) {
    console.error("Error deleting department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

