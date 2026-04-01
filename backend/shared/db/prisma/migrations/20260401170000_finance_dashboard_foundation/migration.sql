-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('VIEWER', 'ANALYST', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "FinancialRecordType" AS ENUM ('INCOME', 'EXPENSE');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "FinancialRecord" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "type" "FinancialRecordType" NOT NULL,
    "category" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialRecord_createdById_createdAt_idx" ON "FinancialRecord"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "FinancialRecord_type_entryDate_idx" ON "FinancialRecord"("type", "entryDate");

-- CreateIndex
CREATE INDEX "FinancialRecord_category_entryDate_idx" ON "FinancialRecord"("category", "entryDate");

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
