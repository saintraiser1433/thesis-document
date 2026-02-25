import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/routing/assignment/[assignmentId] - Get one assignment with schedule, thesis, round, prior comments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assignmentId } = await params

    const assignment = await prisma.peerReviewAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
        round: {
          include: {
            schedule: {
              include: {
                thesis: {
                  include: {
                    user: { select: { name: true } },
                    category: true,
                    course: true,
                  },
                },
              },
            },
            assignments: {
              include: {
                reviewer: { select: { name: true } },
              },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }
    if (assignment.reviewerId !== session.user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const schedule = assignment.round.schedule
    const priorInRound = assignment.round.assignments.filter(
      (a) => a.order < assignment.order
    )

    return NextResponse.json({
      id: assignment.id,
      order: assignment.order,
      deadline: assignment.deadline.toISOString(),
      status: assignment.status,
      comment: assignment.comment,
      approved: assignment.approved,
      reviewedAt: assignment.reviewedAt?.toISOString() ?? null,
      round: {
        id: assignment.round.id,
        roundNumber: assignment.round.roundNumber,
        status: assignment.round.status,
        thesisFileUrl: assignment.round.thesisFileUrl,
      },
      scheduleId: schedule.id,
      thesis: schedule.thesis,
      priorReviews: priorInRound.map((a) => ({
        reviewerName: a.reviewer.name,
        order: a.order,
        comment: a.comment,
        approved: a.approved,
      })),
    })
  } catch (error) {
    console.error("Error fetching assignment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
