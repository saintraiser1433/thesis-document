import { PrismaClient } from "../lib/generated/prisma"

const prisma = new PrismaClient()

async function main() {
  const countBefore = await prisma.thesis.count()
  await prisma.thesis.deleteMany({})
  const countAfter = await prisma.thesis.count()
  console.log(`Deleted ${countBefore - countAfter} thesis (remaining: ${countAfter}).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


