import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/theses/[id]/cancel-routing - Student/Teacher cancels routing request
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const thesis = await prisma.thesis.findUnique({
      where: { id },
      select: { id: true, userId: true, routingStatus: true },
    })

    if (!thesis) {
      return NextResponse.json({ error: "Thesis not found" }, { status: 404 })
    }

    const isOwner = thesis.userId === session.user?.id
    const isAdmin = session.user?.role === "ADMIN"

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You are not allowed to cancel routing for this thesis" },
        { status: 403 }
      )
    }

    if (thesis.routingStatus !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: "Only theses pending routing review can be cancelled" },
        { status: 400 }
      )
    }

    await prisma.thesis.update({
      where: { id },
      data: { routingStatus: "NONE" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error cancelling routing:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

