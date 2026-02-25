import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

// POST /api/archive/[thesisId]/reject - Program Head rejects archiving (continue routing)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ thesisId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user?.role !== "PROGRAM_HEAD" && session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only program head or admin can reject archiving" },
        { status: 403 }
      )
    }

    const { thesisId } = await params
    const body = await request.json().catch(() => ({} as { comment?: string }))
    const rejectComment = body.comment as string | undefined

    const thesis = await prisma.thesis.findUnique({
      where: { id: thesisId },
      include: { user: true },
    })

    if (!thesis) {
      return NextResponse.json({ error: "Thesis not found" }, { status: 404 })
    }
    if (thesis.routingStatus !== "PENDING_ARCHIVE") {
      return NextResponse.json(
        { error: "Thesis is not pending archive approval" },
        { status: 400 }
      )
    }

    // There is at most one routing schedule per thesis (thesisId is unique)
    const schedule = await prisma.routingSchedule.findUnique({
      where: { thesisId },
    })

    await prisma.$transaction(async (tx) => {
      await tx.thesis.update({
        where: { id: thesisId },
        data: { routingStatus: "IN_ROUTING" },
      })

      if (schedule) {
        await tx.routingSchedule.update({
          where: { id: schedule.id },
          data: { status: "ACTIVE" },
        })
      }
    })

    await createNotification({
      userId: thesis.userId,
      type: "ARCHIVE_REJECTED",
      title: "Archive request rejected",
      message:
        rejectComment && rejectComment.trim().length > 0
          ? `Your thesis "${thesis.title}" was not archived. Program head comments: ${rejectComment}`
          : `Your thesis "${thesis.title}" was not archived. Please revise according to the panel feedback and continue routing.`,
      thesisId,
    })

    return NextResponse.json({
      success: true,
      message: "Archive rejected; thesis returned to routing.",
    })
  } catch (error) {
    console.error("Error rejecting archive:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

