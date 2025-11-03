-- DropForeignKey
ALTER TABLE "WithdrawalLaundry" DROP CONSTRAINT "WithdrawalLaundry_invoiceMediaId_fkey";

-- DropForeignKey
ALTER TABLE "WithdrawalLaundry" DROP CONSTRAINT "WithdrawalLaundry_laundryId_fkey";

-- DropForeignKey
ALTER TABLE "WithdrawalLaundry" DROP CONSTRAINT "WithdrawalLaundry_mainVendorId_fkey";

-- DropForeignKey
ALTER TABLE "WithdrawalLaundry" DROP CONSTRAINT "WithdrawalLaundry_reportMediaId_fkey";

-- DropForeignKey
ALTER TABLE "WithdrawalLaundry" DROP CONSTRAINT "WithdrawalLaundry_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "WithdrawalLaundry" DROP CONSTRAINT "WithdrawalLaundry_withdrawalId_fkey";

-- DropIndex
DROP INDEX "WithdrawalLaundry_invoiceMediaId_idx";

-- AddForeignKey
ALTER TABLE "WithdrawalLaundry" ADD CONSTRAINT "WithdrawalLaundry_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "Withdrawal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalLaundry" ADD CONSTRAINT "WithdrawalLaundry_laundryId_fkey" FOREIGN KEY ("laundryId") REFERENCES "Laundry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalLaundry" ADD CONSTRAINT "WithdrawalLaundry_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalLaundry" ADD CONSTRAINT "WithdrawalLaundry_mainVendorId_fkey" FOREIGN KEY ("mainVendorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalLaundry" ADD CONSTRAINT "WithdrawalLaundry_invoiceMediaId_fkey" FOREIGN KEY ("invoiceMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalLaundry" ADD CONSTRAINT "WithdrawalLaundry_reportMediaId_fkey" FOREIGN KEY ("reportMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
