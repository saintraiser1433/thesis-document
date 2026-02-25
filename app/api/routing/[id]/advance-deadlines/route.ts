import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { AssignmentStatus, RoundStatus } from "@prisma/client"

// POST /api/routing/[id]/advance-deadlines - Check and auto-advance overdue assignments
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: scheduleId } = await params
    const now = new Date()

    const schedule = await prisma.routingSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        thesis: true,
        rounds: {
          include: {
            assignments: {
              include: { reviewer: { select: { id: true, name: true } } },
            },
          },
          orderBy: { roundNumber: "asc" },
        },
      },
    })
    if (!schedule || schedule.status !== "ACTIVE") {
      return NextResponse.json({ error: "Schedule not found or not active" }, { status: 404 })
    }

    let advanced = false
    const notifications: Promise<unknown>[] = []

    for (const round of schedule.rounds) {
      if (round.status !== RoundStatus.IN_PROGRESS) continue

      const overdue = round.assignments.find(
        (a) => a.status === AssignmentStatus.IN_PROGRESS && a.deadline < now
      )
      if (!overdue) continue

      const nextAssignment = round.assignments.find(
        (a) => a.order === overdue.order + 1
      )

      await prisma.$transaction(async (tx) => {
        await tx.peerReviewAssignment.update({
          where: { id: overdue.id },
          data: { status: AssignmentStatus.SKIPPED },
        })

        if (nextAssignment) {
          await tx.peerReviewAssignment.update({
            where: { id: nextAssignment.id },
            data: { status: AssignmentStatus.IN_PROGRESS },
          })
          notifications.push(
            createNotification({
              userId: nextAssignment.reviewerId,
              type: "REVIEW_DUE",
              title: "Review now active",
              message: `Previous reviewer did not respond in time. You can now review "${schedule.thesis.title}".`,
              thesisId: schedule.thesisId,
            })
          )
        } else {
          await tx.routingRound.update({
            where: { id: round.id },
            data: {
              status: RoundStatus.COMPLETED,
              completedAt: now,
            },
          })
          notifications.push(
            createNotification({
              userId: schedule.thesis.userId,
              type: "ROUND_COMPLETE",
              title: "Routing round complete",
              message: `Round ${round.roundNumber} for "${schedule.thesis.title}" is complete (one reviewer did not respond in time). You may submit a revision to start the next round.`,
              thesisId: schedule.thesisId,
            })
          )

          const allRounds = await tx.routingRound.findMany({
            where: { scheduleId },
            orderBy: { roundNumber: "asc" },
          })
          const allCompleted = allRounds.every(
            (r) => r.id === round.id || r.status === RoundStatus.COMPLETED
          )
          if (allCompleted && round.roundNumber === 3) {
            await tx.thesis.update({
              where: { id: schedule.thesisId },
              data: { routingStatus: "PENDING_ARCHIVE" },
            })
            await tx.routingSchedule.update({
              where: { id: scheduleId },
              data: { status: "COMPLETED" },
            })
            notifications.push(
              createNotification({
                userId: schedule.thesis.userId,
                type: "PENDING_ARCHIVE",
                title: "Ready for archive",
                message: `All 3 routing rounds for "${schedule.thesis.title}" are complete. Awaiting program head approval for archiving.`,
                thesisId: schedule.thesisId,
              })
            )
          }
        }
      })
      advanced = true
      break
    }

    await Promise.all(notifications)
    return NextResponse.json({ advanced })
  } catch (error) {
    console.error("Error advancing deadlines:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
