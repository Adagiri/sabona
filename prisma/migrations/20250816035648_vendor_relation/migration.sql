/*
  Warnings:

  - You are about to drop the column `mainVendorId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_mainVendorId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "mainVendorId";

-- CreateTable
CREATE TABLE "VendorRelation" (
    "id" TEXT NOT NULL,
    "mainVendorId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "VendorRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorRelation_branchId_key" ON "VendorRelation"("branchId");

-- CreateIndex
CREATE INDEX "VendorRelation_mainVendorId_idx" ON "VendorRelation"("mainVendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorRelation_mainVendorId_branchId_key" ON "VendorRelation"("mainVendorId", "branchId");

-- AddForeignKey
ALTER TABLE "VendorRelation" ADD CONSTRAINT "VendorRelation_mainVendorId_fkey" FOREIGN KEY ("mainVendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRelation" ADD CONSTRAINT "VendorRelation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
