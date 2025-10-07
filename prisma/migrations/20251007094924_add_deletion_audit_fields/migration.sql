-- Add audit fields for tracking deleted user information
-- These fields store historical data and are NOT indexed
ALTER TABLE "User" ADD COLUMN "deletedPhone" TEXT;
ALTER TABLE "User" ADD COLUMN "deletedEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "deletionReason" TEXT;
ALTER TABLE "User" ADD COLUMN "deletedByAdminId" TEXT;