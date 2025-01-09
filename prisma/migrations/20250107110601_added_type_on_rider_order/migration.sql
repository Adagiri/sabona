-- CreateEnum
CREATE TYPE "RiderOrderType" AS ENUM ('RIDER_PICKUP', 'RIDER_DELIVERY');

-- AlterTable
ALTER TABLE "RiderOrder" ADD COLUMN     "type" "RiderOrderType";
