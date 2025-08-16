-- AlterTable
ALTER TABLE "LaundryService" ADD COLUMN     "iconId" INTEGER;

-- AddForeignKey
ALTER TABLE "LaundryService" ADD CONSTRAINT "LaundryService_iconId_fkey" FOREIGN KEY ("iconId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
