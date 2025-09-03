-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_PAID';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryFee" DOUBLE PRECISION,
ADD COLUMN     "distanceKm" DOUBLE PRECISION,
ADD COLUMN     "serviceCharge" DOUBLE PRECISION,
ADD COLUMN     "vatAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "VendorOrder" ALTER COLUMN "acceptedAt" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AdminSettings" (
    "id" TEXT NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "vatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "serviceChargeType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "serviceChargeRate" DOUBLE PRECISION NOT NULL DEFAULT 7.0,
    "customOrderServiceChargeRate" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "deliveryBaseRate" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "deliveryPerKmRate" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "freeDeliveryThreshold" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "expressMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "maxDeliveryDistance" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "AdminSettings_pkey" PRIMARY KEY ("id")
);
