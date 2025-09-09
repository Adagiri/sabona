/*
  Warnings:

  - The `serviceChargeType` column on the `AdminSettings` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ServiceChargeType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "AdminSettings" DROP COLUMN "serviceChargeType",
ADD COLUMN     "serviceChargeType" "ServiceChargeType" NOT NULL DEFAULT 'PERCENTAGE';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "postDiscountAmount" DOUBLE PRECISION,
ADD COLUMN     "preDiscountAmount" DOUBLE PRECISION,
ADD COLUMN     "subtotalAmount" DOUBLE PRECISION,
ADD COLUMN     "vatPercentage" DOUBLE PRECISION;
