-- First, check if there's any invalid data
-- Delete device tokens where deviceId doesn't reference a valid Device.id
DELETE FROM "DeviceToken" 
WHERE NOT EXISTS (
    SELECT 1 FROM "Device" 
    WHERE "Device"."id"::text = "DeviceToken"."deviceId"
);

-- Remove the broken unique constraint if it exists
DROP INDEX IF EXISTS "DeviceToken_userId_key";

-- Create a temporary column
ALTER TABLE "DeviceToken" ADD COLUMN "deviceId_new" INTEGER;

-- Convert the data (this will fail if deviceId contains non-numeric values)
UPDATE "DeviceToken" 
SET "deviceId_new" = "deviceId"::integer;

-- Drop the old column
ALTER TABLE "DeviceToken" DROP COLUMN "deviceId";

-- Rename the new column
ALTER TABLE "DeviceToken" RENAME COLUMN "deviceId_new" TO "deviceId";

-- Make it NOT NULL
ALTER TABLE "DeviceToken" ALTER COLUMN "deviceId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "DeviceToken" 
ADD CONSTRAINT "DeviceToken_deviceId_fkey" 
FOREIGN KEY ("deviceId") REFERENCES "Device"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add proper composite unique constraint
CREATE UNIQUE INDEX "DeviceToken_userId_deviceId_key" 
ON "DeviceToken"("userId", "deviceId");

-- Add index for token lookups
CREATE INDEX "DeviceToken_token_idx" ON "DeviceToken"("token");