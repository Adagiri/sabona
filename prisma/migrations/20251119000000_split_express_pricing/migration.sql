-- AlterTable: Add new express pricing columns to LaundryServiceItem
ALTER TABLE "LaundryServiceItem" ADD COLUMN "expressVendorPrice" DOUBLE PRECISION;
ALTER TABLE "LaundryServiceItem" ADD COLUMN "expressPlatformPrice" DOUBLE PRECISION;

-- Migrate data from expressPrice to both new columns
UPDATE "LaundryServiceItem" SET "expressVendorPrice" = "expressPrice", "expressPlatformPrice" = "expressPrice";

-- Make new columns NOT NULL after migration
ALTER TABLE "LaundryServiceItem" ALTER COLUMN "expressVendorPrice" SET NOT NULL;
ALTER TABLE "LaundryServiceItem" ALTER COLUMN "expressPlatformPrice" SET NOT NULL;

-- Drop the old expressPrice column
ALTER TABLE "LaundryServiceItem" DROP COLUMN "expressPrice";

-- AlterTable: Add new express pricing snapshot columns to OrderLaundryServiceItem
ALTER TABLE "OrderLaundryServiceItem" ADD COLUMN "expressVendorPriceSnapshot" DOUBLE PRECISION;
ALTER TABLE "OrderLaundryServiceItem" ADD COLUMN "expressPlatformPriceSnapshot" DOUBLE PRECISION;

-- Migrate data from expressPriceSnapshot to both new columns
UPDATE "OrderLaundryServiceItem" SET "expressVendorPriceSnapshot" = "expressPriceSnapshot", "expressPlatformPriceSnapshot" = "expressPriceSnapshot";

-- Make new columns NOT NULL after migration
ALTER TABLE "OrderLaundryServiceItem" ALTER COLUMN "expressVendorPriceSnapshot" SET NOT NULL;
ALTER TABLE "OrderLaundryServiceItem" ALTER COLUMN "expressPlatformPriceSnapshot" SET NOT NULL;

-- Drop the old expressPriceSnapshot column
ALTER TABLE "OrderLaundryServiceItem" DROP COLUMN "expressPriceSnapshot";
