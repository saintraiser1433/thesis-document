import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { AssignmentStatus, RoundStatus } from "@prisma/client"

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// GET /api/routing - List schedules (admin: all, student/teacher: own theses)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = session.user?.role
    const isAdmin = role === "ADMIN"
    const isPeerReviewer = role === "PEER_REVIEWER"

    const where = isAdmin
      ? {}
      : isPeerReviewer
        ? { rounds: { some: { assignments: { some: { reviewerId: session.user?.id } } } } }
        : { thesis: { userId: session.user?.id } }

    const schedules = await prisma.routingSchedule.findMany({
      where,
      include: {
        thesis: {
          select: {
            id: true,
            title: true,
            userId: true,
            routingStatus: true,
            user: { select: { name: true, email: true } },
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
      orderBy: { createdAt: "desc" },
    })

    const formatted = schedules.map((s) => ({
      id: s.id,
      thesisId: s.thesisId,
      thesis: s.thesis,
      admin: s.admin,
      startDate: s.startDate.toISOString(),
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      rounds: s.rounds.map((r) => ({
        id: r.id,
        roundNumber: r.roundNumber,
        status: r.status,
        thesisFileUrl: r.thesisFileUrl,
        startedAt: r.startedAt?.toISOString() ?? null,
        completedAt: r.completedAt?.toISOString() ?? null,
        assignments: r.assignments.map((a) => ({
          id: a.id,
          reviewerId: a.reviewerId,
          reviewer: a.reviewer,
          order: a.order,
          deadline: a.deadline.toISOString(),
          status: a.status,
          comment: a.comment,
          approved: a.approved,
          reviewedAt: a.reviewedAt?.toISOString() ?? null,
        })),
      })),
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Error fetching routing schedules:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/routing - Admin create routing schedule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { thesisId, reviewerIds, reviewer1Id, reviewer2Id, startDate } = body

    // Support both new (reviewerIds[]) and legacy (reviewer1Id/reviewer2Id) payloads
    let reviewers: string[] = Array.isArray(reviewerIds)
      ? reviewerIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
      : []

    if (reviewers.length === 0 && reviewer1Id && reviewer2Id) {
      reviewers = [reviewer1Id, reviewer2Id]
    }

    if (!thesisId || !startDate) {
      return NextResponse.json(
        { error: "Missing thesisId or startDate" },
        { status: 400 }
      )
    }

    if (reviewers.length === 0) {
      return NextResponse.json(
        { error: "At least one peer reviewer is required" },
        { status: 400 }
      )
    }

    const uniqueReviewers = Array.from(new Set(reviewers))
    if (uniqueReviewers.length !== reviewers.length) {
      return NextResponse.json(
        { error: "Reviewers must be unique" },
        { status: 400 }
      )
    }

    const thesis = await prisma.thesis.findUnique({
      where: { id: thesisId },
      include: { user: true },
    })
    if (!thesis) {
      return NextResponse.json({ error: "Thesis not found" }, { status: 404 })
    }
    if (thesis.routingStatus !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: "Thesis is not pending review" },
        { status: 400 }
      )
    }

    const reviewersFromDb = await prisma.user.findMany({
      where: { id: { in: uniqueReviewers } },
    })

    if (
      reviewersFromDb.length !== uniqueReviewers.length ||
      reviewersFromDb.some((r) => r.role !== "PEER_REVIEWER")
    ) {
      return NextResponse.json(
        { error: "All selected reviewers must be peer reviewers" },
        { status: 400 }
      )
    }

    const start = new Date(startDate)

    const schedule = await prisma.$transaction(async (tx) => {
      const s = await tx.routingSchedule.create({
        data: {
          thesisId,
          adminId: session.user!.id,
          startDate: start,
          status: "ACTIVE",
        },
      })

      const round = await tx.routingRound.create({
        data: {
          scheduleId: s.id,
          roundNumber: 1,
          status: RoundStatus.IN_PROGRESS,
          thesisFileUrl: thesis.fileUrl,
          startedAt: start,
        },
      })

      await tx.peerReviewAssignment.createMany({
        data: uniqueReviewers.map((reviewerId, index) => ({
          roundId: round.id,
          reviewerId,
          order: index + 1,
          deadline: addDays(start, 14 * (index + 1)),
          status: index === 0 ? AssignmentStatus.IN_PROGRESS : AssignmentStatus.PENDING,
        })),
      })

      await tx.thesis.update({
        where: { id: thesisId },
        data: { routingStatus: "IN_ROUTING" },
      })

      return { schedule: s, round }
    })

    const scheduleId = (schedule as { schedule: { id: string } }).schedule.id
    const thesisUserId = thesis.userId

    const notifications = [
      createNotification({
        userId: thesisUserId,
        type: "ROUTING_ASSIGNED",
        title: "Routing schedule created",
        message: `Your thesis "${thesis.title}" has been assigned for routing.`,
        thesisId,
      }),
    ]

    uniqueReviewers.forEach((reviewerId, index) => {
      const deadline = addDays(start, 14 * (index + 1))
      notifications.push(
        createNotification({
          userId: reviewerId,
          type: "REVIEW_ASSIGNED",
          title: "Review assigned",
          message: `You have been assigned to review "${thesis.title}" (${index === 0 ? "first" : `${index + 1}th`} reviewer). Deadline: ${deadline
            .toISOString()
            .slice(0, 10)}.`,
          thesisId,
        })
      )
    })

    await Promise.all(notifications)

    const created = await prisma.routingSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        thesis: true,
        admin: { select: { id: true, name: true, email: true } },
        rounds: {
          include: {
            assignments: {
              include: {
                reviewer: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    })

    return NextResponse.json(created)
  } catch (error) {
    console.error("Error creating routing schedule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
