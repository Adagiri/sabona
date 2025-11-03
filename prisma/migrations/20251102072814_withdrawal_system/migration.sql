-- ============================================================================
-- WITHDRAWAL SYSTEM MIGRATION
-- ============================================================================
-- This migration:
-- 1. Adds price snapshots to OrderLaundryServiceItem (CRITICAL FIX)
-- 2. Creates Withdrawal and WithdrawalLaundry models
-- 3. Adds global last withdrawal tracking to AdminSettings
-- ============================================================================

-- ============================================================================
-- STEP 1: Add Price Snapshots to OrderLaundryServiceItem (CRITICAL)
-- ============================================================================
-- These fields store the prices AT THE TIME OF ORDER
-- This prevents historical data corruption when vendors change prices

ALTER TABLE "OrderLaundryServiceItem" 
ADD COLUMN "vendorPriceSnapshot" DOUBLE PRECISION,
ADD COLUMN "platformPriceSnapshot" DOUBLE PRECISION,
ADD COLUMN "expressPriceSnapshot" DOUBLE PRECISION,
ADD COLUMN "itemName" TEXT,
ADD COLUMN "serviceName" TEXT;

-- Backfill existing orders with current prices (best effort)
UPDATE "OrderLaundryServiceItem" osi
SET 
    "vendorPriceSnapshot" = lsi."vendorPrice",
    "platformPriceSnapshot" = lsi."platformPrice",
    "expressPriceSnapshot" = lsi."expressPrice",
    "itemName" = lsi."name",
    "serviceName" = (
        SELECT ls."name" 
        FROM "LaundryService" ls 
        WHERE ls."id" = lsi."laundryServiceId"
    )
FROM "LaundryServiceItem" lsi
WHERE osi."laundryServiceItemId" = lsi."id"
AND osi."vendorPriceSnapshot" IS NULL;

-- Make snapshots required after backfill
ALTER TABLE "OrderLaundryServiceItem" 
ALTER COLUMN "vendorPriceSnapshot" SET NOT NULL,
ALTER COLUMN "platformPriceSnapshot" SET NOT NULL,
ALTER COLUMN "expressPriceSnapshot" SET NOT NULL;

-- ============================================================================
-- STEP 2: Add Withdrawal Tracking to AdminSettings
-- ============================================================================
ALTER TABLE "AdminSettings" 
ADD COLUMN "lastWithdrawalTimestamp" TIMESTAMPTZ;

-- ============================================================================
-- STEP 3: Create Withdrawal Enum
-- ============================================================================
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'COMPLETED');

-- ============================================================================
-- STEP 4: Create Withdrawal Table
-- ============================================================================
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "withdrawalNumber" SERIAL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMPTZ NOT NULL, -- Last withdrawal timestamp
    "endDate" TIMESTAMPTZ NOT NULL, -- Current report generation time
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- STEP 5: Create WithdrawalLaundry Table
-- ============================================================================
CREATE TABLE "WithdrawalLaundry" (
    "id" TEXT NOT NULL,
    "withdrawalId" TEXT NOT NULL,
    "laundryId" TEXT NOT NULL,
    "laundryName" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL, -- Owner of the laundry
    "isBranch" BOOLEAN NOT NULL DEFAULT false,
    "mainVendorId" TEXT, -- If branch, link to main vendor
    
    -- Earning summary
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    
    -- Invoice upload
    "invoiceUrl" TEXT,
    "invoiceUploadedAt" TIMESTAMPTZ,
    
    -- Excel report storage on S3
    "reportUrl" TEXT,
    "reportMediaId" INTEGER,
    
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "WithdrawalLaundry_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- STEP 6: Add Foreign Keys
-- ============================================================================
ALTER TABLE "WithdrawalLaundry" 
ADD CONSTRAINT "WithdrawalLaundry_withdrawalId_fkey" 
FOREIGN KEY ("withdrawalId") REFERENCES "Withdrawal"("id") ON DELETE CASCADE;

ALTER TABLE "WithdrawalLaundry" 
ADD CONSTRAINT "WithdrawalLaundry_laundryId_fkey" 
FOREIGN KEY ("laundryId") REFERENCES "Laundry"("id") ON DELETE RESTRICT;

ALTER TABLE "WithdrawalLaundry" 
ADD CONSTRAINT "WithdrawalLaundry_vendorId_fkey" 
FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT;

ALTER TABLE "WithdrawalLaundry" 
ADD CONSTRAINT "WithdrawalLaundry_mainVendorId_fkey" 
FOREIGN KEY ("mainVendorId") REFERENCES "User"("id") ON DELETE SET NULL;

ALTER TABLE "WithdrawalLaundry" 
ADD CONSTRAINT "WithdrawalLaundry_reportMediaId_fkey" 
FOREIGN KEY ("reportMediaId") REFERENCES "Media"("id") ON DELETE SET NULL;

-- ============================================================================
-- STEP 7: Create Indexes
-- ============================================================================
CREATE INDEX "Withdrawal_status_idx" ON "Withdrawal"("status");
CREATE INDEX "Withdrawal_createdAt_idx" ON "Withdrawal"("createdAt");
CREATE INDEX "WithdrawalLaundry_withdrawalId_idx" ON "WithdrawalLaundry"("withdrawalId");
CREATE INDEX "WithdrawalLaundry_laundryId_idx" ON "WithdrawalLaundry"("laundryId");
CREATE INDEX "WithdrawalLaundry_vendorId_idx" ON "WithdrawalLaundry"("vendorId");
CREATE UNIQUE INDEX "WithdrawalLaundry_withdrawalId_laundryId_key" ON "WithdrawalLaundry"("withdrawalId", "laundryId");

-- ============================================================================
-- COMPLETED
-- ============================================================================