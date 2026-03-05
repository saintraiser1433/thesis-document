-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PROGRAM_HEAD', 'TEACHER', 'STUDENT', 'PEER_REVIEWER');

-- CreateEnum
CREATE TYPE "RoutingStatus" AS ENUM ('NONE', 'PENDING_REVIEW', 'IN_ROUTING', 'PENDING_ARCHIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RoutingScheduleStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'SKIPPED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_years" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT NOT NULL,
    "fileUrl" TEXT,
    "isPublishedOnline" BOOLEAN NOT NULL DEFAULT false,
    "publisherName" TEXT,
    "publisherLink" TEXT,
    "citation" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "routingStatus" "RoutingStatus" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,

    CONSTRAINT "theses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thesis_authors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "thesisId" TEXT NOT NULL,

    CONSTRAINT "thesis_authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indexings" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thesisId" TEXT NOT NULL,

    CONSTRAINT "indexings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routing_schedules" (
    "id" TEXT NOT NULL,
    "thesisId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "status" "RoutingScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routing_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routing_rounds" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'PENDING',
    "thesisFileUrl" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "routing_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peer_review_assignments" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "approved" BOOLEAN,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "peer_review_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "thesisId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "courses_name_key" ON "courses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "school_years_name_key" ON "school_years"("name");

-- CreateIndex
CREATE UNIQUE INDEX "routing_schedules_thesisId_key" ON "routing_schedules"("thesisId");

-- AddForeignKey
ALTER TABLE "theses" ADD CONSTRAINT "theses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theses" ADD CONSTRAINT "theses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theses" ADD CONSTRAINT "theses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theses" ADD CONSTRAINT "theses_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thesis_authors" ADD CONSTRAINT "thesis_authors_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indexings" ADD CONSTRAINT "indexings_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_schedules" ADD CONSTRAINT "routing_schedules_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_schedules" ADD CONSTRAINT "routing_schedules_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_rounds" ADD CONSTRAINT "routing_rounds_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "routing_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_review_assignments" ADD CONSTRAINT "peer_review_assignments_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "routing_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_review_assignments" ADD CONSTRAINT "peer_review_assignments_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
