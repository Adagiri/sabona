-- Add new express pricing column (nullable first)
ALTER TABLE "LaundryServiceItem" ADD COLUMN "expressPrice" DOUBLE PRECISION;

-- Migrate existing data: set express price equal to platform price initially
UPDATE "LaundryServiceItem" 
SET "expressPrice" = "platformPrice"
WHERE "expressPrice" IS NULL;

-- Make new column required after data migration
ALTER TABLE "LaundryServiceItem" ALTER COLUMN "expressPrice" SET NOT NULL;