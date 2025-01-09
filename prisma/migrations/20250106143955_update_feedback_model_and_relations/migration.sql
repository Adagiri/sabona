/*
  Warnings:

  - Added the required column `type` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('RIDER_PICKUP', 'RIDER_DELIVERY', 'VENDOR');

-- DropIndex
DROP INDEX "Feedback_orderId_key";

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "type" "FeedbackType" NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
