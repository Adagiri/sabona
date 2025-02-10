/*
  Warnings:

  - You are about to drop the `TipPayment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tipTransactionId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentTransactionType" AS ENUM ('ORDER', 'TIP');

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_orderId_fkey";

-- DropForeignKey
ALTER TABLE "TipPayment" DROP CONSTRAINT "TipPayment_tipId_fkey";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paymentType" "PaymentTransactionType" DEFAULT 'ORDER',
ADD COLUMN     "tipTransactionId" TEXT,
ALTER COLUMN "orderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Tip" ADD COLUMN     "transactionId" TEXT;

-- DropTable
DROP TABLE "TipPayment";

-- CreateTable
CREATE TABLE "TipTransaction" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_tipTransactionId_key" ON "Payment"("tipTransactionId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tipTransactionId_fkey" FOREIGN KEY ("tipTransactionId") REFERENCES "TipTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "TipTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
