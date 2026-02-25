import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { AssignmentStatus, RoundStatus } from "@prisma/client"

// POST /api/routing/[id]/submit-review - Peer reviewer submits comment + approve/reject
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user?.role !== "PEER_REVIEWER" && session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: scheduleId } = await params
    const body = await request.json()
    const { assignmentId, comment, approved } = body

    if (!assignmentId || typeof approved !== "boolean") {
      return NextResponse.json(
        { error: "Missing assignmentId or approved (boolean)" },
        { status: 400 }
      )
    }

    const assignment = await prisma.peerReviewAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        round: true,
        round: {
          include: {
            schedule: {
              include: {
                thesis: true,
                rounds: {
                  include: {
                    assignments: true,
                  },
                  orderBy: { roundNumber: "asc" },
                },
              },
            },
          },
        },
      },
    })

    if (!assignment || assignment.round.scheduleId !== scheduleId) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }
    if (assignment.reviewerId !== session.user?.id) {
      return NextResponse.json({ error: "You are not the assigned reviewer" }, { status: 403 })
    }
    if (assignment.status !== AssignmentStatus.IN_PROGRESS) {
      return NextResponse.json(
        { error: "Assignment is not in progress" },
        { status: 400 }
      )
    }

    const schedule = assignment.round.schedule
    const round = assignment.round

    // Find all assignments for this round (with correct order)
    const scheduleRounds = schedule.rounds || []
    const currentRoundWithAssignments = scheduleRounds.find(
      (r) => r.id === round.id
    )
    const roundAssignments = (currentRoundWithAssignments?.assignments || []).sort(
      (a, b) => a.order - b.order
    )

    // Patch in this review's new status for later checks
    const updatedAssignments = roundAssignments.map((a) =>
      a.id === assignmentId
        ? {
            ...a,
            status: approved
              ? AssignmentStatus.APPROVED
              : AssignmentStatus.REJECTED,
          }
        : a
    )

    const notifications: Promise<unknown>[] = []

    await prisma.$transaction(async (tx) => {
      await tx.peerReviewAssignment.update({
        where: { id: assignmentId },
        data: {
          comment: comment ?? null,
          approved,
          reviewedAt: new Date(),
          status: approved ? AssignmentStatus.APPROVED : AssignmentStatus.REJECTED,
        },
      })

      const nextInRound = updatedAssignments.find(
        (a) => a.order === assignment.order + 1
      )
      if (nextInRound) {
        await tx.peerReviewAssignment.update({
          where: { id: nextInRound.id },
          data: { status: AssignmentStatus.IN_PROGRESS },
        })
        notifications.push(
          createNotification({
            userId: nextInRound.reviewerId,
            type: "REVIEW_DUE",
            title: "Your turn to review",
            message: `You can now review "${schedule.thesis.title}" (round ${round.roundNumber}). Previous reviewer left feedback.`,
            thesisId: schedule.thesisId,
          })
        )
      } else {
        await tx.routingRound.update({
          where: { id: round.id },
          data: {
            status: RoundStatus.COMPLETED,
            completedAt: new Date(),
          },
        })

        const allApprovedThisRound = updatedAssignments.length > 0 &&
          updatedAssignments.every((a) => a.status === AssignmentStatus.APPROVED)

        if (allApprovedThisRound || round.roundNumber === 3) {
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
              message: allApprovedThisRound
                ? `All reviewers in round ${round.roundNumber} for "${schedule.thesis.title}" approved the thesis. Awaiting program head archive decision.`
                : `All 3 routing rounds for "${schedule.thesis.title}" are complete. Awaiting program head approval.`,
              thesisId: schedule.thesisId,
            })
          )
        } else {
          notifications.push(
            createNotification({
              userId: schedule.thesis.userId,
              type: "ROUND_COMPLETE",
              title: "Routing round complete",
              message: `Round ${round.roundNumber} for "${schedule.thesis.title}" is complete. You may submit a revision to start the next round.`,
              thesisId: schedule.thesisId,
            })
          )
        }
      }
    })

    await Promise.all(notifications)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error submitting review:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
