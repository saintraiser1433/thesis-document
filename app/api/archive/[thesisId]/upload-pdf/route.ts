import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// POST /api/archive/[thesisId]/upload-pdf - Student/Teacher uploads archival PDF while pending archive
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ thesisId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["STUDENT", "TEACHER"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { thesisId } = await params
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    const thesis = await prisma.thesis.findUnique({
      where: { id: thesisId },
      include: { user: true },
    })

    if (!thesis) {
      return NextResponse.json({ error: "Thesis not found" }, { status: 404 })
    }
    if (thesis.userId !== session.user?.id) {
      return NextResponse.json({ error: "You are not the thesis owner" }, { status: 403 })
    }
    if (thesis.routingStatus !== "PENDING_ARCHIVE") {
      return NextResponse.json(
        { error: "Thesis is not pending archive approval" },
        { status: 400 }
      )
    }
    if (thesis.fileUrl) {
      return NextResponse.json(
        { error: "Final archival PDF already uploaded. Upload is disabled unless archive is rejected." },
        { status: 400 }
      )
    }

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

    await prisma.thesis.update({
      where: { id: thesisId },
      data: { fileUrl },
    })

    const thesisDepartmentId = thesis.departmentId ?? thesis.user.departmentId ?? null
    const programHeads = await prisma.user.findMany({
      where: {
        role: "PROGRAM_HEAD",
        ...(thesisDepartmentId ? { departmentId: thesisDepartmentId } : {}),
      },
      select: { id: true },
    })

    await Promise.all([
      ...programHeads.map((u) =>
        createNotification({
          userId: u.id,
          type: "ARCHIVE_PDF_UPLOADED",
          title: "Archival PDF uploaded",
          message: `Archival PDF was uploaded for "${thesis.title}". You may now review the PDF and approve/reject archiving.`,
          thesisId,
        })
      ),
    ])

    return NextResponse.json({ success: true, fileUrl })
  } catch (error) {
    console.error("Error uploading archival PDF:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

