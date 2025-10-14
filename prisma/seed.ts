import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
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
    prisma.category.upsert({
      where: { name: 'Software Engineering' },
      update: {},
      create: { name: 'Software Engineering' },
    }),
    prisma.category.upsert({
      where: { name: 'Data Science' },
      update: {},
      create: { name: 'Data Science' },
    }),
    prisma.category.upsert({
      where: { name: 'Cybersecurity' },
      update: {},
      create: { name: 'Cybersecurity' },
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
    prisma.course.upsert({
      where: { code: 'BSSE' },
      update: {},
      create: { name: 'Bachelor of Science in Software Engineering', code: 'BSSE' },
    }),
    prisma.course.upsert({
      where: { code: 'BSDS' },
      update: {},
      create: { name: 'Bachelor of Science in Data Science', code: 'BSDS' },
    }),
    prisma.course.upsert({
      where: { code: 'BSCY' },
      update: {},
      create: { name: 'Bachelor of Science in Cybersecurity', code: 'BSCY' },
    }),
  ])

  // Create school years
  const schoolYears = await Promise.all([
    prisma.schoolYear.upsert({ where: { name: '2022-2023' }, update: {}, create: { name: '2022-2023' } }),
    prisma.schoolYear.upsert({ where: { name: '2023-2024' }, update: {}, create: { name: '2023-2024' } }),
    prisma.schoolYear.upsert({ where: { name: '2024-2025' }, update: {}, create: { name: '2024-2025' } }),
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

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      name: 'Dr. Teacher',
      email: 'teacher@example.com',
      password: hashedPassword,
      role: 'TEACHER',
    },
  })

  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      name: 'John Student',
      email: 'student@example.com',
      password: hashedPassword,
      role: 'STUDENT',
    },
  })

  // Create sample thesis
  const thesis1 = await prisma.thesis.create({
    data: {
      title: 'Machine Learning Applications in Healthcare',
      abstract: 'This thesis explores the use of machine learning algorithms in medical diagnosis and treatment planning. The research focuses on developing predictive models that can assist healthcare professionals in making more accurate diagnoses and treatment recommendations.',
      fileUrl: '/uploads/sample-thesis-1.pdf',
      schoolYear: {
        connect: {
          id: schoolYears[1].id // 2023-2024
        }
      },
      isPublishedOnline: true,
      publisherName: 'IEEE',
      publisherLink: 'https://ieeexplore.ieee.org/example',
      citation: 'Doe, J., & Smith, J. (2024). Machine Learning Applications in Healthcare. IEEE Transactions on Medical Informatics.',
      category: { connect: { id: categories[0].id } }, // Computer Science
      course: { connect: { id: courses[0].id } }, // BSIT
      user: { connect: { id: programHead.id } },
      uploadedBy: programHead.name,
      authors: {
        create: [
          { name: 'John Doe' },
          { name: 'Jane Smith' },
        ],
      },
      indexings: {
        create: [
          { type: 'Google Scholar', url: 'https://scholar.google.com/example' },
          { type: 'IEEE Xplore', url: 'https://ieeexplore.ieee.org/example' },
        ],
      },
    },
  })

  const thesis2 = await prisma.thesis.create({
    data: {
      title: 'Blockchain Technology in Supply Chain Management',
      abstract: 'An investigation into how blockchain can improve transparency and efficiency in supply chains. This research examines the implementation of distributed ledger technology to track products from origin to consumer.',
      fileUrl: '/uploads/sample-thesis-2.pdf',
      schoolYear: {
        connect: {
          id: schoolYears[1].id // 2023-2024
        }
      },
      isPublishedOnline: false,
      category: { connect: { id: categories[1].id } }, // Information Technology
      course: { connect: { id: courses[1].id } }, // BSCS
      user: { connect: { id: programHead.id } },
      uploadedBy: programHead.name,
      authors: {
        create: [
          { name: 'Alice Brown' },
        ],
      },
    },
  })

  const thesis3 = await prisma.thesis.create({
    data: {
      title: 'Cybersecurity Framework for Small Businesses',
      abstract: 'A comprehensive security framework designed specifically for small and medium enterprises. This thesis addresses the unique challenges faced by smaller organizations in implementing effective cybersecurity measures.',
      fileUrl: '/uploads/sample-thesis-3.pdf',
      schoolYear: {
        connect: {
          id: schoolYears[0].id // 2022-2023
        }
      },
      isPublishedOnline: true,
      publisherName: 'ACM',
      publisherLink: 'https://dl.acm.org/example',
      citation: 'Johnson, B., & Davis, C. (2023). Cybersecurity Framework for Small Businesses. ACM Computing Surveys.',
      category: { connect: { id: categories[4].id } }, // Cybersecurity
      course: { connect: { id: courses[4].id } }, // BSCY
      user: { connect: { id: programHead.id } },
      uploadedBy: programHead.name,
      authors: {
        create: [
          { name: 'Bob Johnson' },
          { name: 'Carol Davis' },
        ],
      },
      indexings: {
        create: [
          { type: 'ACM Digital Library', url: 'https://dl.acm.org/example' },
          { type: 'ResearchGate', url: 'https://researchgate.net/example' },
        ],
      },
    },
  })

  // Ensure total thesis counts: 53 published, 51 unpublished
  const targetPublished = 53
  const targetUnpublished = 51

  const currentPublished = await prisma.thesis.count({ where: { isPublishedOnline: true } })
  const currentUnpublished = await prisma.thesis.count({ where: { isPublishedOnline: false } })

  const neededPublished = Math.max(0, targetPublished - currentPublished)
  const neededUnpublished = Math.max(0, targetUnpublished - currentUnpublished)

  function randomItem<T>(list: T[]): T {
    return list[Math.floor(Math.random() * list.length)]
  }

  const schoolYearsList = schoolYears
  const publishers = [
    { name: 'IEEE', link: 'https://ieeexplore.ieee.org' },
    { name: 'ACM', link: 'https://dl.acm.org' },
    { name: 'Springer', link: 'https://link.springer.com' },
    { name: 'Elsevier', link: 'https://www.sciencedirect.com' },
  ]

  // Helper to generate lorem-like abstract
  const baseAbstract =
    'This thesis explores contemporary approaches and methodologies, presenting findings, limitations, and future work with emphasis on practical application and academic contribution.'

  for (let i = 0; i < neededPublished; i++) {
    const category = randomItem(categories)
    const course = randomItem(courses)
    const publisher = randomItem(publishers)
    const year = randomItem(schoolYearsList)

    await prisma.thesis.create({
      data: {
        title: `Published Thesis ${currentPublished + i + 1}`,
        abstract: baseAbstract,
        fileUrl: `/uploads/sample-published-${currentPublished + i + 1}.pdf`,
        schoolYear: {
          connect: {
            id: year.id
          }
        },
        isPublishedOnline: true,
        publisherName: publisher.name,
        publisherLink: `${publisher.link}/example-${currentPublished + i + 1}`,
        citation: `Doe, J. (${new Date().getFullYear()}). Published Thesis ${currentPublished + i + 1}. ${publisher.name}.`,
        category: { connect: { id: category.id } },
        course: { connect: { id: course.id } },
        user: { connect: { id: programHead.id } },
        uploadedBy: programHead.name,
        authors: {
          create: [
            { name: `Author A${i + 1}` },
            { name: `Author B${i + 1}` },
          ],
        },
        indexings: {
          create: [
            { type: 'Google Scholar', url: `https://scholar.google.com/example-${currentPublished + i + 1}` },
            { type: 'Institutional Repository', url: `https://example.edu/repo/${currentPublished + i + 1}` },
          ],
        },
      },
    })
  }

  for (let i = 0; i < neededUnpublished; i++) {
    const category = randomItem(categories)
    const course = randomItem(courses)
    const year = randomItem(schoolYearsList)

    await prisma.thesis.create({
      data: {
        title: `Unpublished Thesis ${currentUnpublished + i + 1}`,
        abstract: baseAbstract,
        fileUrl: null,
        schoolYear: {
          connect: {
            id: year.id
          }
        },
        isPublishedOnline: false,
        category: { connect: { id: category.id } },
        course: { connect: { id: course.id } },
        user: { connect: { id: programHead.id } },
        uploadedBy: programHead.name,
        authors: {
          create: [
            { name: `Author U${i + 1}` },
            { name: `Coauthor U${i + 1}` },
          ],
        },
      },
    })
  }

  console.log('Database seeded successfully!')
  console.log('Created users:')
  console.log('- Admin: admin@example.com (password: password123)')
  console.log('- Program Head: programhead@example.com (password: password123)')
  console.log('- Teacher: teacher@example.com (password: password123)')
  console.log('- Student: student@example.com (password: password123)')
  console.log('Created categories:', categories.map(c => c.name))
  console.log('Created courses:', courses.map(c => c.name))
  console.log('Created school years:', schoolYears.map(sy => sy.name))
  console.log('Created thesis:', [thesis1.title, thesis2.title, thesis3.title])
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
