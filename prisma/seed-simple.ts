import { PrismaClient } from '../lib/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting simple seed...')

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Computer Science' },
      update: {},
      create: { name: 'Computer Science' },
    }),
    prisma.category.upsert({
      where: { name: 'Information Technology' },
      update: {},
      create: { name: 'Information Technology' },
    }),
  ])

  // Create courses
  const courses = await Promise.all([
    prisma.course.upsert({
      where: { code: 'BSIT' },
      update: {},
      create: { name: 'Bachelor of Science in Information Technology', code: 'BSIT' },
    }),
    prisma.course.upsert({
      where: { code: 'BSCS' },
      update: {},
      create: { name: 'Bachelor of Science in Computer Science', code: 'BSCS' },
    }),
  ])

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const programHead = await prisma.user.upsert({
    where: { email: 'programhead@example.com' },
    update: {},
    create: {
      name: 'Dr. Program Head',
      email: 'programhead@example.com',
      password: hashedPassword,
      role: 'PROGRAM_HEAD',
    },
  })

  // Create a simple thesis
  const thesis = await prisma.thesis.create({
    data: {
      title: 'Test Thesis',
      abstract: 'This is a test thesis',
      fileUrl: '/uploads/test.pdf',
      schoolYear: '2023-2024',
      isPublishedOnline: false,
      uploadedBy: programHead.name,
      categoryId: categories[0].id,
      courseId: courses[0].id,
      userId: programHead.id,
    },
  })

  console.log('Simple seed completed successfully!')
  console.log('Created thesis:', thesis.title)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
