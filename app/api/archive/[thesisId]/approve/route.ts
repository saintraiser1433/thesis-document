import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

// POST /api/archive/[thesisId]/approve - Program Head approves archiving
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ thesisId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user?.role !== "PROGRAM_HEAD" && session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only program head or admin can approve archiving" },
        { status: 403 }
      )
    }

    const { thesisId } = await params

    const thesis = await prisma.thesis.findUnique({
      where: { id: thesisId },
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

    await prisma.thesis.update({
      where: { id: thesisId },
      data: { routingStatus: "ARCHIVED" },
    })

    await createNotification({
      userId: thesis.userId,
      type: "ARCHIVED",
      title: "Thesis archived",
      message: `Your thesis "${thesis.title}" has been approved and archived.`,
      thesisId,
    })

    return NextResponse.json({
      success: true,
      message: "Thesis archived successfully.",
    })
  } catch (error) {
    console.error("Error approving archive:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
