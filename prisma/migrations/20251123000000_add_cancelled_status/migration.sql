-- AlterEnum: Add CANCELLED to PickupStatus
ALTER TYPE "PickupStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- AlterEnum: Add CANCELLED to DeliveryStatus
ALTER TYPE "DeliveryStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';