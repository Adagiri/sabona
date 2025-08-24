-- Migration: Add Custom Order Support, Dual Pricing, and PayTabs Integration
-- File: prisma/migrations/[timestamp]_add_custom_orders_paytabs/migration.sql

-- ============================================================================
-- STEP 1: Create New Enums
-- ============================================================================

-- Create OrderType enum
CREATE TYPE "OrderType" AS ENUM ('REGISTERED_LAUNDRY', 'CUSTOM_LAUNDRY');

-- Note: Keep existing RiderOrderType as is (RIDER_PICKUP, RIDER_DELIVERY)
-- No changes needed since Order.orderType handles custom vs regular distinction

-- ============================================================================
-- STEP 2: Add New Columns to Order Table (Safe Additions)
-- ============================================================================

-- Order type and custom laundry fields
ALTER TABLE "Order" ADD COLUMN "orderType" "OrderType" NOT NULL DEFAULT 'REGISTERED_LAUNDRY';
ALTER TABLE "Order" ADD COLUMN "customLaundryName" TEXT;
ALTER TABLE "Order" ADD COLUMN "customLaundryDescription" TEXT;
ALTER TABLE "Order" ADD COLUMN "customLaundryLat" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN "customLaundryLong" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN "customLaundryAddress" TEXT;

-- Custom vendor payment tracking (driver pays vendor)
ALTER TABLE "Order" ADD COLUMN "customVendorReceipt" TEXT;
ALTER TABLE "Order" ADD COLUMN "customVendorPaid" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN "customVendorName" TEXT;
ALTER TABLE "Order" ADD COLUMN "customPaymentMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN "adminServiceCharge" DOUBLE PRECISION;

-- PayTabs integration (customer pays admin)
ALTER TABLE "Order" ADD COLUMN "payTabsInvoiceId" TEXT;
ALTER TABLE "Order" ADD COLUMN "payTabsInvoiceUrl" TEXT;
ALTER TABLE "Order" ADD COLUMN "customerPaid" BOOLEAN DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "customerPaymentDate" TIMESTAMPTZ;
ALTER TABLE "Order" ADD COLUMN "payTabsTransactionRef" TEXT;

-- ============================================================================
-- STEP 3: Update Order Table Constraints (Make laundryId Optional)
-- ============================================================================

-- Make laundryId optional for custom orders
ALTER TABLE "Order" ALTER COLUMN "laundryId" DROP NOT NULL;

-- ============================================================================
-- STEP 4: Add Dual Pricing to LaundryServiceItem (SAFE Migration)
-- ============================================================================

-- Add new pricing columns (nullable first)
ALTER TABLE "LaundryServiceItem" ADD COLUMN "vendorPrice" DOUBLE PRECISION;
ALTER TABLE "LaundryServiceItem" ADD COLUMN "platformPrice" DOUBLE PRECISION;

-- Migrate existing data: assume existing price is platform price, 
-- vendor gets 80% (20% platform markup)
UPDATE "LaundryServiceItem" 
SET 
    "vendorPrice" = "price" * 0.8, 
    "platformPrice" = "price"
WHERE "vendorPrice" IS NULL;

-- Make new columns required after data migration
ALTER TABLE "LaundryServiceItem" ALTER COLUMN "vendorPrice" SET NOT NULL;
ALTER TABLE "LaundryServiceItem" ALTER COLUMN "platformPrice" SET NOT NULL;

-- NOTE: Keep old 'price' column for now - remove later after testing
-- Uncomment the line below ONLY after verifying everything works:
-- ALTER TABLE "LaundryServiceItem" DROP COLUMN "price";

-- ============================================================================
-- STEP 5: Create UserLocation Table for Driver Distance Calculation
-- ============================================================================

CREATE TABLE "UserLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "long" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLocation_pkey" PRIMARY KEY ("id")
);

-- Create unique index on userId
CREATE UNIQUE INDEX "UserLocation_userId_key" ON "UserLocation"("userId");

-- Create index for efficient distance queries
CREATE INDEX "UserLocation_lat_long_idx" ON "UserLocation"("lat", "long");

-- Add foreign key constraint
ALTER TABLE "UserLocation" ADD CONSTRAINT "UserLocation_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- STEP 6: Add RiderOrder Indexes for Efficient Queries and Driver Reassignment
-- ============================================================================

-- Create index for efficient active assignment queries
CREATE INDEX "RiderOrder_orderId_type_deletedAt_idx" ON "RiderOrder"("orderId", "type", "deletedAt");

-- Create partial unique index: only one ACTIVE rider per order per type
-- This allows driver reassignment by soft-deleting old assignments
CREATE UNIQUE INDEX "RiderOrder_active_assignment_unique" 
ON "RiderOrder"("orderId", "type") 
WHERE "deletedAt" IS NULL;

-- This prevents duplicate active assignments but allows:
-- 1. Driver reassignment (old assignment soft-deleted, new one created)
-- 2. Multiple historical assignments per order
-- 3. Efficient queries for active assignments

-- ============================================================================
-- STEP 7: Data Validation (Optional Safety Checks)
-- ============================================================================

-- Verify no data corruption occurred
DO $$
BEGIN
    -- Check that all existing orders have valid laundryId or are custom orders
    IF EXISTS (
        SELECT 1 FROM "Order" 
        WHERE "laundryId" IS NULL AND "orderType" = 'REGISTERED_LAUNDRY'
    ) THEN
        RAISE EXCEPTION 'Data integrity error: REGISTERED_LAUNDRY orders must have laundryId';
    END IF;
    
    -- Check dual pricing migration worked
    IF EXISTS (
        SELECT 1 FROM "LaundryServiceItem" 
        WHERE "vendorPrice" IS NULL OR "platformPrice" IS NULL
    ) THEN
        RAISE EXCEPTION 'Data integrity error: Dual pricing migration failed';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully - all data integrity checks passed';
END $$;