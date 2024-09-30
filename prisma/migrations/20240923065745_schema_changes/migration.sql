/*
  Warnings:

  - The values [USER] on the enum `UserType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `UserOAuth` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserType_new" AS ENUM ('CUSTOMER', 'VENDOR', 'DRIVER', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "type" TYPE "UserType_new" USING ("type"::text::"UserType_new");
ALTER TYPE "UserType" RENAME TO "UserType_old";
ALTER TYPE "UserType_new" RENAME TO "UserType";
DROP TYPE "UserType_old";
ALTER TABLE "User" ALTER COLUMN "type" SET DEFAULT 'CUSTOMER';
COMMIT;

-- DropForeignKey
ALTER TABLE "UserOAuth" DROP CONSTRAINT "UserOAuth_userId_fkey";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'CUSTOMER',
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE "UserOAuth";

-- DropEnum
DROP TYPE "UserOAuthType";

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
