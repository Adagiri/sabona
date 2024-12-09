-- AlterEnum
ALTER TYPE "DeliveryStatus" ADD VALUE 'ACCEPTED';

-- AlterEnum
ALTER TYPE "PickupStatus" ADD VALUE 'ACCEPTED';

-- CreateIndex
CREATE INDEX "RiderOrder_riderId_orderId_idx" ON "RiderOrder"("riderId", "orderId");
