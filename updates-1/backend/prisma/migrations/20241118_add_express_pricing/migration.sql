-- Add new express pricing fields to LaundryServiceItem
ALTER TABLE "LaundryServiceItem" ADD COLUMN "expressVendorPrice" DOUBLE PRECISION;
ALTER TABLE "LaundryServiceItem" ADD COLUMN "expressPlatformPrice" DOUBLE PRECISION;

-- Migrate existing data: expressVendorPrice = expressPrice, expressPlatformPrice = (expressPrice * platformPrice) / vendorPrice
UPDATE "LaundryServiceItem"
SET
  "expressVendorPrice" = "expressPrice",
  "expressPlatformPrice" = CASE
    WHEN "vendorPrice" > 0 THEN ("expressPrice" * "platformPrice") / "vendorPrice"
    ELSE "expressPrice"
  END;

-- Make the new fields required after migration
ALTER TABLE "LaundryServiceItem" ALTER COLUMN "expressVendorPrice" SET NOT NULL;
ALTER TABLE "LaundryServiceItem" ALTER COLUMN "expressPlatformPrice" SET NOT NULL;

-- Add new snapshot fields to OrderLaundryServiceItem
ALTER TABLE "OrderLaundryServiceItem" ADD COLUMN "expressVendorPriceSnapshot" DOUBLE PRECISION;
ALTER TABLE "OrderLaundryServiceItem" ADD COLUMN "expressPlatformPriceSnapshot" DOUBLE PRECISION;

-- Migrate existing order snapshots: set based on the original expressPriceSnapshot
UPDATE "OrderLaundryServiceItem"
SET
  "expressVendorPriceSnapshot" = "expressPriceSnapshot",
  "expressPlatformPriceSnapshot" = CASE
    WHEN "vendorPriceSnapshot" > 0 THEN ("expressPriceSnapshot" * "platformPriceSnapshot") / "vendorPriceSnapshot"
    ELSE "expressPriceSnapshot"
  END;
