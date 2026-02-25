import { prisma } from "./prisma"

export async function createNotification(params: {
  userId: string
  type: string
  title: string
  message: string
  thesisId?: string
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      thesisId: params.thesisId,
    },
  })
}
