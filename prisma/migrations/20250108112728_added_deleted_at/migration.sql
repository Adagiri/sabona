-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "deletedAt" TIMESTAMPTZ,
ADD COLUMN     "riderOrderId" TEXT,
ADD COLUMN     "vendorOrderId" TEXT;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_vendorOrderId_fkey" FOREIGN KEY ("vendorOrderId") REFERENCES "VendorOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_riderOrderId_fkey" FOREIGN KEY ("riderOrderId") REFERENCES "RiderOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
