-- Drop old expressPrice columns (idempotent)
ALTER TABLE "LaundryServiceItem" DROP COLUMN IF EXISTS "expressPrice";
ALTER TABLE "OrderLaundryServiceItem" DROP COLUMN IF EXISTS "expressPriceSnapshot";