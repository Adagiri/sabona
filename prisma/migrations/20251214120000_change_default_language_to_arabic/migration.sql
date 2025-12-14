-- Migration: Change default user language from English to Arabic
-- This migration:
-- 1. Changes the default value of preferredLanguage from 'en' to 'ar'
-- 2. Updates existing users with NULL preferredLanguage to 'ar'

BEGIN;

-- Step 1: Change default value for new users
ALTER TABLE "User" ALTER COLUMN "preferredLanguage" SET DEFAULT 'ar';

-- Step 2: Update existing users who have NULL language to Arabic
-- This ensures all existing users without a preference get Arabic
UPDATE "User"
SET "preferredLanguage" = 'ar'
WHERE "preferredLanguage" IS NULL;

COMMIT;
