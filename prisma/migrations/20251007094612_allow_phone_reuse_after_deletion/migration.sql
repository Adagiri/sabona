-- Drop existing unique constraint on phone
DROP INDEX IF EXISTS "User_phone_key";

-- Create partial unique index that excludes soft-deleted users
-- This allows phone numbers to be reused after deletion
CREATE UNIQUE INDEX "User_phone_active_key" 
ON "User"("phone") 
WHERE "deletedAt" IS NULL AND "phone" IS NOT NULL;

-- Also handle email if it exists
DROP INDEX IF EXISTS "User_email_key";

CREATE UNIQUE INDEX "User_email_active_key" 
ON "User"("email") 
WHERE "deletedAt" IS NULL AND "email" IS NOT NULL;