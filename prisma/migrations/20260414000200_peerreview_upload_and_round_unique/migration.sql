-- AlterTable
ALTER TABLE "peer_review_assignments"
ADD COLUMN "reviewFileMime" TEXT,
ADD COLUMN "reviewFileUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "routing_rounds_scheduleId_roundNumber_key" ON "routing_rounds"("scheduleId", "roundNumber");
