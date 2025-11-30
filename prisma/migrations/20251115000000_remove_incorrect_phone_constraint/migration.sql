-- Drop incorrect phone constraint (idempotent)
DROP INDEX IF EXISTS "User_phone_key";

-- Ensure correct partial index exists
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_active_key" 
ON "User"("phone") 
WHERE "deletedAt" IS NULL AND "phone" IS NOT NULL;