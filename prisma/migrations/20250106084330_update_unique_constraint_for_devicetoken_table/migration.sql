/*
  Warnings:

  - A unique constraint covering the columns `[token,userId]` on the table `DeviceToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deviceId` to the `DeviceToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DeviceToken_token_key";

-- AlterTable
ALTER TABLE "DeviceToken" ADD COLUMN     "deviceId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_userId_key" ON "DeviceToken"("token", "userId");
