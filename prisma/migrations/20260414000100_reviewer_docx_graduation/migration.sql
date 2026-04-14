-- AlterTable
ALTER TABLE "users"
ADD COLUMN "isGeneralReviewer" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "theses"
ADD COLUMN "graduationDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "routing_rounds"
ADD COLUMN "routingFileMime" TEXT,
ADD COLUMN "routingFileUrl" TEXT;
