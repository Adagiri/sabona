-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_PLACED';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "data" JSONB;
