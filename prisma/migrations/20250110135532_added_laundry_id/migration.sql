/*
  Warnings:

  - You are about to drop the `_FeedbackToLaundry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_FeedbackToLaundry" DROP CONSTRAINT "_FeedbackToLaundry_A_fkey";

-- DropForeignKey
ALTER TABLE "_FeedbackToLaundry" DROP CONSTRAINT "_FeedbackToLaundry_B_fkey";

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "laundryId" TEXT;

-- DropTable
DROP TABLE "_FeedbackToLaundry";

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_laundryId_fkey" FOREIGN KEY ("laundryId") REFERENCES "Laundry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
