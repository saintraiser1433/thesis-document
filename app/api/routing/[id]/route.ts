import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/routing/[id] - Get one schedule with full details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const schedule = await prisma.routingSchedule.findUnique({
      where: { id },
      include: {
        thesis: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            category: true,
            course: true,
            schoolYear: true,
            authors: true,
          },
        },
        admin: { select: { id: true, name: true, email: true } },
        rounds: {
          include: {
            assignments: {
              include: {
                reviewer: { select: { id: true, name: true, email: true } },
              },
            },
          },
          orderBy: { roundNumber: "asc" },
        },
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    const role = session.user?.role
    const isAdmin = role === "ADMIN"
    const isOwner = schedule.thesis.userId === session.user?.id
    const isReviewer = schedule.rounds.some((r) =>
      r.assignments.some((a) => a.reviewerId === session.user?.id)
    )

    if (!isAdmin && !isOwner && !isReviewer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formatted = {
      ...schedule,
      startDate: schedule.startDate.toISOString(),
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
      rounds: schedule.rounds.map((r) => ({
        ...r,
        startedAt: r.startedAt?.toISOString() ?? null,
        completedAt: r.completedAt?.toISOString() ?? null,
        assignments: r.assignments.map((a) => ({
          ...a,
          deadline: a.deadline.toISOString(),
          reviewedAt: a.reviewedAt?.toISOString() ?? null,
        })),
      })),
    }

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Error fetching routing schedule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/routing/[id] - Admin update schedule (e.g. extend deadlines)
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
    const body = await request.json().catch(() => ({}))
    const { status } = body

    const schedule = await prisma.routingSchedule.findUnique({
      where: { id },
    })
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    const data: { status?: "ACTIVE" | "COMPLETED" | "CANCELLED" } = {}
    if (status && ["ACTIVE", "COMPLETED", "CANCELLED"].includes(status)) {
      data.status = status
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(schedule)
    }

    const updated = await prisma.routingSchedule.update({
      where: { id },
      data,
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating routing schedule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
