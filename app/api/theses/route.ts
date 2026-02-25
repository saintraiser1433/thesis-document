import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/theses - Get all theses
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const theses = await prisma.thesis.findMany({
      include: {
        category: true,
        course: true,
        schoolYear: true,
        authors: true,
        indexings: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const thesesWithFormattedData = theses.map(thesis => ({
      id: thesis.id,
      title: thesis.title,
      abstract: thesis.abstract,
      fileUrl: thesis.fileUrl,
      isPublishedOnline: thesis.isPublishedOnline,
      publisherName: thesis.publisherName,
      publisherLink: thesis.publisherLink,
      citation: thesis.citation,
      uploadedBy: thesis.uploadedBy,
      routingStatus: thesis.routingStatus ?? "NONE",
      createdAt: thesis.createdAt.toISOString().split('T')[0],
      updatedAt: thesis.updatedAt.toISOString().split('T')[0],
      category: thesis.category.name,
      course: thesis.course.name,
      courseCode: thesis.course.code,
      schoolYear: thesis.schoolYear.name,
      authors: thesis.authors.map(author => author.name),
      indexings: thesis.indexings.map(indexing => ({
        type: indexing.type,
        url: indexing.url
      })),
      user: thesis.user
    }))

    return NextResponse.json(thesesWithFormattedData)
  } catch (error) {
    console.error("Error fetching theses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/theses - Create new thesis
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "PROGRAM_HEAD", "STUDENT", "TEACHER"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Session user:", session.user)
    console.log("Session user ID:", session.user?.id)

    const body = await request.json()
    console.log("Request body:", body)
    
    const {
      title,
      abstract,
      categoryId,
      courseId,
      schoolYearId,
      fileUrl,
      isPublishedOnline,
      publisherName,
      publisherLink,
      citation,
      authors,
      indexings
    } = body

    // Validate required fields
    if (!title || !abstract || !categoryId || !courseId || !schoolYearId || !fileUrl) {
      return NextResponse.json({ 
        error: "Missing required fields: title, abstract, category, course, school year, and file are required" 
      }, { status: 400 })
    }

    if (!authors || authors.length === 0) {
      return NextResponse.json({ 
        error: "At least one author is required" 
      }, { status: 400 })
    }

    if (!session.user?.id) {
      return NextResponse.json({ 
        error: "User ID not found in session. Please log out and log back in." 
      }, { status: 400 })
    }

    // Program Head and Admin theses go straight to archive; students/teachers go through routing.
    const role = session.user?.role || ""
    const autoArchive = role === "PROGRAM_HEAD" || role === "ADMIN"

    const thesis = await prisma.thesis.create({
      data: {
        title,
        abstract,
        fileUrl,
        routingStatus: autoArchive ? "ARCHIVED" : "PENDING_REVIEW",
        isPublishedOnline: isPublishedOnline || false,
        publisherName: publisherName || null,
        publisherLink: publisherLink || null,
        citation: citation || null,
        uploadedBy: session.user?.name || "Unknown",
        userId: session.user?.id || "",
        categoryId,
        courseId,
        schoolYearId,
        authors: {
          create: authors.map((authorName: string) => ({
            name: authorName
          }))
        },
        indexings: {
          create: (indexings || []).map((indexing: { type: string; url: string }) => ({
            type: indexing.type,
            url: indexing.url
          }))
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

    return NextResponse.json({
      id: thesis.id,
      title: thesis.title,
      abstract: thesis.abstract,
      fileUrl: thesis.fileUrl,
      isPublishedOnline: thesis.isPublishedOnline,
      publisherName: thesis.publisherName,
      publisherLink: thesis.publisherLink,
      citation: thesis.citation,
      uploadedBy: thesis.uploadedBy,
      createdAt: thesis.createdAt.toISOString().split('T')[0],
      category: thesis.category.name,
      course: thesis.course.name,
      courseCode: thesis.course.code,
      schoolYear: thesis.schoolYear.name,
      authors: thesis.authors.map(author => author.name),
      indexings: thesis.indexings.map(indexing => ({
        type: indexing.type,
        url: indexing.url
      }))
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating thesis:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}