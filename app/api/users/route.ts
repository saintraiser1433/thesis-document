import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { promises as fs } from "fs"
import path from "path"

// GET /api/users - Get all users
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            thesis: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const usersWithCount = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString().split('T')[0],
      thesisCount: user._count.thesis,
      image: user.image || null
    }))

    return NextResponse.json(usersWithCount)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const form = await request.formData()
    const name = String(form.get("name") ?? "")
    const email = String(form.get("email") ?? "")
    const password = String(form.get("password") ?? "")
    const role = String(form.get("role") ?? "")
    const file = form.get("image") as File | null

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Handle image upload if present
    let imageUrl: string | null = null
    if (file && typeof file === "object" && (file as any).arrayBuffer) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "users")
      await fs.mkdir(uploadsDir, { recursive: true })
      const ext = (file.type?.split("/")[1] || "png").replace(/[^a-zA-Z0-9]/g, "")
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const filepath = path.join(uploadsDir, filename)
      await fs.writeFile(filepath, buffer)
      imageUrl = `/uploads/users/${filename}`
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        image: imageUrl
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      ...user,
      createdAt: user.createdAt.toISOString().split('T')[0],
      thesisCount: 0
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
