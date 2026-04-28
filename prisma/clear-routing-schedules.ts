import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * Deletes all routing schedules (and cascaded rounds + peer review assignments).
 * Resets affected theses so routing can be recreated (non-archived → PENDING_REVIEW).
 */
async function main() {
  const schedules = await prisma.routingSchedule.findMany({
    select: { id: true, thesisId: true },
  })

  if (schedules.length === 0) {
    console.log("No routing schedules to delete.")
    return
  }

  const thesisIds = [...new Set(schedules.map((s) => s.thesisId))]

  const deleted = await prisma.routingSchedule.deleteMany({})

  const updated = await prisma.thesis.updateMany({
    where: {
      id: { in: thesisIds },
      routingStatus: { not: "ARCHIVED" },
    },
    data: { routingStatus: "PENDING_REVIEW" },
  })

  console.log(
    `Removed ${deleted.count} routing schedule(s) for ${thesisIds.length} thesis(es).`
  )
  console.log(
    `Reset routingStatus to PENDING_REVIEW for ${updated.count} non-archived thesis(es).`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
