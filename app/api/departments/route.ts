import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/departments - list all departments
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(
      departments.map((d) => ({
        id: d.id,
        name: d.name,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error("Error fetching departments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/departments - create new department
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const name = String(body.name ?? "").trim()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const existing = await prisma.department.findUnique({
      where: { name },
    })

    if (existing) {
      return NextResponse.json({ error: "Department with this name already exists" }, { status: 400 })
    }

    const department = await prisma.department.create({
      data: { name },
    })

    return NextResponse.json(
      {
        id: department.id,
        name: department.name,
        createdAt: department.createdAt.toISOString(),
        updatedAt: department.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

