-- Add transfer charge configuration to AdminSettings
ALTER TABLE "AdminSettings" 
ADD COLUMN IF NOT EXISTS "transferChargeType" TEXT DEFAULT 'PERCENTAGE',
ADD COLUMN IF NOT EXISTS "transferChargeRate" DOUBLE PRECISION DEFAULT 1.0;

ALTER TABLE "AdminSettings" 
ALTER COLUMN "transferChargeType" SET NOT NULL,
ALTER COLUMN "transferChargeRate" SET NOT NULL;

-- Add withdrawal tracking to Order
ALTER TABLE "Order" 
ADD COLUMN IF NOT EXISTS "vendorEarningDisbursed" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "disbursedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "withdrawalId" TEXT;

ALTER TABLE "Order" 
ALTER COLUMN "vendorEarningDisbursed" SET NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS "Order_vendorEarningDisbursed_idx" ON "Order"("vendorEarningDisbursed");
CREATE INDEX IF NOT EXISTS "Order_withdrawalId_idx" ON "Order"("withdrawalId");