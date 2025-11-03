-- ============================================================================
-- Change WithdrawalLaundry invoice storage from URL to Media ID
-- ============================================================================

-- Step 1: Add new invoiceMediaId column
ALTER TABLE "WithdrawalLaundry" 
ADD COLUMN "invoiceMediaId" INTEGER;

-- Step 2: Add foreign key constraint
ALTER TABLE "WithdrawalLaundry" 
ADD CONSTRAINT "WithdrawalLaundry_invoiceMediaId_fkey" 
FOREIGN KEY ("invoiceMediaId") REFERENCES "Media"("id") ON DELETE SET NULL;

-- Step 3: Drop old invoiceUrl column (after data migration if needed)
-- WARNING: This will delete existing invoice URLs
-- If you have existing data, migrate it first before running this step
ALTER TABLE "WithdrawalLaundry" 
DROP COLUMN "invoiceUrl";

-- Step 4: Create index for better query performance
CREATE INDEX "WithdrawalLaundry_invoiceMediaId_idx" ON "WithdrawalLaundry"("invoiceMediaId");