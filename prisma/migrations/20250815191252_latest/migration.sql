/*
  Warnings:

  - You are about to drop the column `vendorId` on the `CouponUsage` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `DeviceToken` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `Pickup` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `Reward` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `RiderOrder` table. All the data in the column will be lost.
  - You are about to drop the column `vendorGiverId` on the `Tip` table. All the data in the column will be lost.
  - You are about to drop the column `vendorReceiverId` on the `Tip` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the `Vendor` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `userId` on table `CouponUsage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Device` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `DeviceToken` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `lat` to the `Laundry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `long` to the `Laundry` table without a default value. This is not possible if the table is not empty.
  - Made the column `vendorId` on table `Laundry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Notification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Reward` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `UserAddress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `UserSettings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'REJECTED';

-- DropForeignKey
ALTER TABLE "CouponUsage" DROP CONSTRAINT "CouponUsage_userId_fkey";

-- DropForeignKey
ALTER TABLE "CouponUsage" DROP CONSTRAINT "CouponUsage_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_userId_fkey";

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "DeviceToken" DROP CONSTRAINT "DeviceToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "DeviceToken" DROP CONSTRAINT "DeviceToken_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "Laundry" DROP CONSTRAINT "Laundry_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "Pickup" DROP CONSTRAINT "Pickup_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "Reward" DROP CONSTRAINT "Reward_userId_fkey";

-- DropForeignKey
ALTER TABLE "Reward" DROP CONSTRAINT "Reward_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "RiderOrder" DROP CONSTRAINT "RiderOrder_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "Tip" DROP CONSTRAINT "Tip_vendorGiverId_fkey";

-- DropForeignKey
ALTER TABLE "Tip" DROP CONSTRAINT "Tip_vendorReceiverId_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "UserAddress" DROP CONSTRAINT "UserAddress_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserSettings" DROP CONSTRAINT "UserSettings_userId_fkey";

-- DropForeignKey
ALTER TABLE "Vendor" DROP CONSTRAINT "Vendor_mainVendorId_fkey";

-- DropForeignKey
ALTER TABLE "Vendor" DROP CONSTRAINT "Vendor_userSettingsId_fkey";

-- DropForeignKey
ALTER TABLE "VendorOrder" DROP CONSTRAINT "VendorOrder_vendorId_fkey";

-- AlterTable
ALTER TABLE "CouponUsage" DROP COLUMN "vendorId",
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Delivery" DROP COLUMN "vendorId";

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "vendorId",
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "DeviceToken" DROP COLUMN "vendorId",
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Feedback" DROP COLUMN "vendorId";

-- AlterTable
ALTER TABLE "Laundry" ADD COLUMN     "lat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "long" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "vendorId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "vendorId";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "vendorId",
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "vendorId";

-- AlterTable
ALTER TABLE "Pickup" DROP COLUMN "vendorId";

-- AlterTable
ALTER TABLE "Reward" DROP COLUMN "vendorId",
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "RiderOrder" DROP COLUMN "vendorId";

-- AlterTable
ALTER TABLE "Tip" DROP COLUMN "vendorGiverId",
DROP COLUMN "vendorReceiverId";

-- AlterTable
ALTER TABLE "Token" DROP COLUMN "vendorId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mainVendorId" TEXT;

-- AlterTable
ALTER TABLE "UserAddress" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "isDocumentsUploaded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "laundryName" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ALTER COLUMN "userId" SET NOT NULL;

-- DropTable
DROP TABLE "Vendor";

-- DropEnum
DROP TYPE "VendorStatus";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_mainVendorId_fkey" FOREIGN KEY ("mainVendorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAddress" ADD CONSTRAINT "UserAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laundry" ADD CONSTRAINT "Laundry_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorOrder" ADD CONSTRAINT "VendorOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
