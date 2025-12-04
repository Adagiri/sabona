-- DropForeignKey
ALTER TABLE "EmailChangeLog" DROP CONSTRAINT "EmailChangeLog_changedBy_fkey";

-- DropForeignKey
ALTER TABLE "PhoneChangeLog" DROP CONSTRAINT "PhoneChangeLog_changedBy_fkey";

-- AddForeignKey
ALTER TABLE "PhoneChangeLog" ADD CONSTRAINT "PhoneChangeLog_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailChangeLog" ADD CONSTRAINT "EmailChangeLog_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
