/*
  Warnings:

  - You are about to drop the column `notificationsEnabled` on the `UserSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "notificationsEnabled",
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
