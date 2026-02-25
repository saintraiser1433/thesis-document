import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { AssignmentStatus, RoundStatus } from "@prisma/client"

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// POST /api/routing/[id]/submit-revision - Student uploads revised thesis for next round
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: scheduleId } = await params
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      )
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      )
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      )
    }

    const schedule = await prisma.routingSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        thesis: true,
        rounds: {
          include: {
            assignments: { include: { reviewer: { select: { id: true } } } },
          },
          orderBy: { roundNumber: "asc" },
        },
      },
    })

    if (!schedule || schedule.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Schedule not found or not active" },
        { status: 404 }
      )
    }
    if (schedule.thesis.userId !== session.user?.id) {
      return NextResponse.json(
        { error: "You are not the thesis owner" },
        { status: 403 }
      )
    }

    const completedRounds = schedule.rounds.filter((r) => r.status === RoundStatus.COMPLETED)
    const nextRoundNumber = completedRounds.length + 1
    if (nextRoundNumber > 3) {
      return NextResponse.json(
        { error: "All 3 rounds are already complete" },
        { status: 400 }
      )
    }

    const firstRound = schedule.rounds[0]
    if (!firstRound || firstRound.assignments.length === 0) {
      return NextResponse.json(
        { error: "Invalid schedule: round 1 assignments missing" },
        { status: 400 }
      )
    }

    const sortedAssignments = [...firstRound.assignments].sort(
      (a, b) => a.order - b.order
    )
    const reviewerIds = sortedAssignments.map((a) => a.reviewerId)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadsDir = join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`
    const filepath = join(uploadsDir, filename)
    await writeFile(filepath, buffer)
    const fileUrl = `/uploads/${filename}`

    const now = new Date()

    await prisma.$transaction(async (tx) => {
      const round = await tx.routingRound.create({
        data: {
          scheduleId,
          roundNumber: nextRoundNumber,
          status: RoundStatus.IN_PROGRESS,
          thesisFileUrl: fileUrl,
          startedAt: now,
        },
      })

      await tx.peerReviewAssignment.createMany({
        data: reviewerIds.map((reviewerId, index) => ({
          roundId: round.id,
          reviewerId,
          order: index + 1,
          deadline: addDays(now, 14 * (index + 1)),
          status: index === 0 ? AssignmentStatus.IN_PROGRESS : AssignmentStatus.PENDING,
        })),
      })
    })

    // Notify all reviewers about the new round, highlighting the first reviewer
    await Promise.all(
      reviewerIds.map((reviewerId, index) =>
        createNotification({
          userId: reviewerId,
          type: "REVIEW_ASSIGNED",
          title: "New revision to review",
          message: `Round ${nextRoundNumber} revision for "${schedule.thesis.title}" is ready${index === 0 ? " for your review as the first reviewer" : ` (you are reviewer ${index + 1})`}. Deadline: ${addDays(
            now,
            14 * (index + 1)
          )
            .toISOString()
            .slice(0, 10)}.`,
          thesisId: schedule.thesisId,
        })
      )
    )

    return NextResponse.json({
      success: true,
      roundNumber: nextRoundNumber,
      fileUrl,
    })
  } catch (error) {
    console.error("Error submitting revision:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
