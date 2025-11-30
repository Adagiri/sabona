-- Add express pricing columns to LaundryServiceItem
ALTER TABLE "LaundryServiceItem" 
ADD COLUMN IF NOT EXISTS "expressVendorPrice" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "expressPlatformPrice" DOUBLE PRECISION;

-- Make them NOT NULL (safe because they'll have values or be newly added)
ALTER TABLE "LaundryServiceItem" 
ALTER COLUMN "expressVendorPrice" SET NOT NULL,
ALTER COLUMN "expressPlatformPrice" SET NOT NULL;

-- Add express pricing snapshots to OrderLaundryServiceItem
ALTER TABLE "OrderLaundryServiceItem" 
ADD COLUMN IF NOT EXISTS "expressVendorPriceSnapshot" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "expressPlatformPriceSnapshot" DOUBLE PRECISION;