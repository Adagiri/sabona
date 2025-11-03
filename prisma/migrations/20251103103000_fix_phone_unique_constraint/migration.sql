DROP INDEX IF EXISTS "User_phone_key";

-- Recreate the partial unique index (in case it was also dropped)
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_active_key" 
ON "User"("phone") 
WHERE "deletedAt" IS NULL AND "phone" IS NOT NULL;