-- AlterTable
ALTER TABLE "UserLocation" ADD COLUMN     "deletedAt" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "VendorOrder" ALTER COLUMN "acceptedAt" DROP DEFAULT;
