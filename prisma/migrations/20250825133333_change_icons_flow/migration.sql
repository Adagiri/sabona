-- CreateEnum
CREATE TYPE "IconType" AS ENUM ('SERVICE', 'CATEGORY', 'GENERAL');

-- DropForeignKey
ALTER TABLE "LaundryItemCategory" DROP CONSTRAINT "LaundryItemCategory_iconId_fkey";

-- DropForeignKey
ALTER TABLE "LaundryService" DROP CONSTRAINT "LaundryService_iconId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_laundryId_fkey";

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "customerPaymentDate" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Icon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mediaId" INTEGER NOT NULL,
    "type" "IconType" NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Icon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Icon_mediaId_key" ON "Icon"("mediaId");

-- AddForeignKey
ALTER TABLE "Icon" ADD CONSTRAINT "Icon_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaundryService" ADD CONSTRAINT "LaundryService_iconId_fkey" FOREIGN KEY ("iconId") REFERENCES "Icon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaundryItemCategory" ADD CONSTRAINT "LaundryItemCategory_iconId_fkey" FOREIGN KEY ("iconId") REFERENCES "Icon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_laundryId_fkey" FOREIGN KEY ("laundryId") REFERENCES "Laundry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
