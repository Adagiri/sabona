-- This migration cleans up the incorrect phone unique constraint
-- that was added by migration 20251103163514_fix_phone_unique_constraint

-- Drop the full unique constraint on phone if it exists
-- (The correct partial index User_phone_active_key should remain)
DROP INDEX IF EXISTS "User_phone_key";

-- Remove the incorrect migration record from migration history
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20251103163514_fix_phone_unique_constraint';
