import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/theses/[id]/submit-routing - Student submits thesis for routing
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: thesisId } = await params

    const thesis = await prisma.thesis.findUnique({
      where: { id: thesisId },
    })

    if (!thesis) {
      return NextResponse.json({ error: "Thesis not found" }, { status: 404 })
    }
    if (thesis.userId !== session.user?.id) {
      return NextResponse.json(
        { error: "You can only submit your own thesis for routing" },
        { status: 403 }
      )
    }
    if (!thesis.fileUrl) {
      return NextResponse.json(
        { error: "Thesis must have a PDF file to submit for routing" },
        { status: 400 }
      )
    }
    if (thesis.routingStatus !== "NONE") {
      return NextResponse.json(
        { error: "Thesis is already submitted or in routing" },
        { status: 400 }
      )
    }

    await prisma.thesis.update({
      where: { id: thesisId },
      data: { routingStatus: "PENDING_REVIEW" },
    })

    return NextResponse.json({
      success: true,
      message: "Thesis submitted for routing. Admin will assign peer reviewers.",
    })
  } catch (error) {
    console.error("Error submitting thesis for routing:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
