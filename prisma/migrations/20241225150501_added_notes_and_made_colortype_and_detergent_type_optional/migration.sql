-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "notes" TEXT,
ALTER COLUMN "detergentType" DROP NOT NULL,
ALTER COLUMN "colorType" DROP NOT NULL;
