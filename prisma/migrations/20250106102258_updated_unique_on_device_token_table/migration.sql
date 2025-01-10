/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `DeviceToken` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "DeviceToken_token_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_userId_key" ON "DeviceToken"("userId");
