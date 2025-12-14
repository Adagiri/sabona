-- Migration: Change default user language from English to Arabic
-- File: backend/prisma/migrations/YYYYMMDDHHMMSS_change_default_language_to_arabic/migration.sql
-- 
-- This migration:
-- 1. Changes the default value of preferredLanguage from 'en' to 'ar'
-- 2. Updates existing users with NULL preferredLanguage to 'ar'
--
-- Run this migration AFTER updating schema.prisma

BEGIN;

-- Step 1: Change default value for new users
ALTER TABLE "User" ALTER COLUMN "preferredLanguage" SET DEFAULT 'ar';

-- Step 2: Update existing users who have NULL language to Arabic
-- This ensures all existing users without a preference get Arabic
UPDATE "User" 
SET "preferredLanguage" = 'ar' 
WHERE "preferredLanguage" IS NULL;

-- Optional Step 3: If you want to change ALL existing 'en' users to 'ar':
-- Uncomment the following line ONLY if you want to migrate all English users to Arabic
-- UPDATE "User" SET "preferredLanguage" = 'ar' WHERE "preferredLanguage" = 'en';

COMMIT;

-- Verification queries (run these after migration):
-- SELECT "preferredLanguage", COUNT(*) FROM "User" GROUP BY "preferredLanguage";
-- SELECT column_default FROM information_schema.columns 
-- WHERE table_name = 'User' AND column_name = 'preferredLanguage';
