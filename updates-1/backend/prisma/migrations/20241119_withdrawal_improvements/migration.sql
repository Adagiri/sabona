-- Add transfer charge configuration to AdminSettings
ALTER TABLE "AdminSettings" ADD COLUMN "transferChargeType" TEXT NOT NULL DEFAULT 'PERCENTAGE';
ALTER TABLE "AdminSettings" ADD COLUMN "transferChargeRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- Add vendorEarningDisbursed field to Order
ALTER TABLE "Order" ADD COLUMN "vendorEarningDisbursed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "disbursedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "withdrawalId" TEXT;

-- Create index for faster withdrawal queries
CREATE INDEX "Order_vendorEarningDisbursed_idx" ON "Order"("vendorEarningDisbursed");
CREATE INDEX "Order_withdrawalId_idx" ON "Order"("withdrawalId");

-- Update existing completed orders that were part of completed withdrawals as disbursed
-- This is a data migration hint - actual logic depends on withdrawal completion dates
