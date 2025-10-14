import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/theses/[id] - Get single thesis
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const thesis = await prisma.thesis.findUnique({
      where: { id },
      include: {
        category: true,
        course: true,
        schoolYear: true,
        user: {
          select: {
            name: true,
            email: true
          }
        },
        authors: true,
        indexings: true
      }
    })

    if (!thesis) {
      return NextResponse.json({ error: "Thesis not found" }, { status: 404 })
    }

    // Check if user can access this thesis
    const role = session.user?.role
    if (role === "PROGRAM_HEAD" && thesis.userId !== session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const formattedThesis = {
      id: thesis.id,
      title: thesis.title,
      abstract: thesis.abstract,
      fileUrl: thesis.fileUrl,
      schoolYear: thesis.schoolYear.name,
      isPublishedOnline: thesis.isPublishedOnline,
      publisherName: thesis.publisherName,
      publisherLink: thesis.publisherLink,
      citation: thesis.citation,
      uploadedBy: thesis.uploadedBy,
      createdAt: thesis.createdAt.toISOString().split('T')[0],
      category: thesis.category.name,
      course: thesis.course.name,
      courseCode: thesis.course.code,
      authors: thesis.authors.map(author => author.name),
      indexings: thesis.indexings.map(indexing => ({
        type: indexing.type,
        url: indexing.url
      }))
    }

    return NextResponse.json(formattedThesis)
  } catch (error) {
    console.error("Error fetching thesis:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/theses/[id] - Update thesis
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "PROGRAM_HEAD")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { 
      title, 
      abstract, 
      isPublishedOnline, 
      publisherName, 
      publisherLink, 
      citation, 
      authors, 
      indexings 
    } = await request.json()

    // Check if thesis exists and user can modify it
    const existingThesis = await prisma.thesis.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existingThesis) {
      return NextResponse.json({ error: "Thesis not found" }, { status: 404 })
    }

    if (session.user?.role === "PROGRAM_HEAD" && existingThesis.userId !== session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update thesis
    const thesis = await prisma.thesis.update({
      where: { id },
      data: {
        title,
        abstract,
        isPublishedOnline: isPublishedOnline || false,
        publisherName,
        publisherLink,
        citation,
        // Update authors
        authors: {
          deleteMany: {},
          create: authors?.map((author: string) => ({ name: author })) || []
        },
        // Update indexings
        indexings: {
          deleteMany: {},
          create: indexings?.map((indexing: { type: string; url: string }) => ({
            type: indexing.type,
            url: indexing.url
          })) || []
        }
      },
      include: {
        category: true,
        course: true,
        schoolYear: true,
        authors: true,
        indexings: true
      }
    })

    const formattedThesis = {
      id: thesis.id,
      title: thesis.title,
      abstract: thesis.abstract,
      fileUrl: thesis.fileUrl,
      schoolYear: thesis.schoolYear.name,
      isPublishedOnline: thesis.isPublishedOnline,
      publisherName: thesis.publisherName,
      publisherLink: thesis.publisherLink,
      citation: thesis.citation,
      uploadedBy: thesis.uploadedBy,
      createdAt: thesis.createdAt.toISOString().split('T')[0],
      category: thesis.category.name,
      course: thesis.course.name,
      courseCode: thesis.course.code,
      authors: thesis.authors.map(author => author.name),
      indexings: thesis.indexings.map(indexing => ({
        type: indexing.type,
        url: indexing.url
      }))
    }

    return NextResponse.json(formattedThesis)
  } catch (error) {
    console.error("Error updating thesis:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/theses/[id] - Delete thesis
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "PROGRAM_HEAD")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if thesis exists and user can delete it
    const existingThesis = await prisma.thesis.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existingThesis) {
      return NextResponse.json({ error: "Thesis not found" }, { status: 404 })
    }

    if (session.user?.role === "PROGRAM_HEAD" && existingThesis.userId !== session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.thesis.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Thesis deleted successfully" })
  } catch (error) {
    console.error("Error deleting thesis:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
