-- Drop the old expressPrice column from LaundryServiceItem (new columns already exist)
ALTER TABLE "LaundryServiceItem" DROP COLUMN IF EXISTS "expressPrice";

-- Drop the old expressPriceSnapshot column from OrderLaundryServiceItem (new columns already exist)
ALTER TABLE "OrderLaundryServiceItem" DROP COLUMN IF EXISTS "expressPriceSnapshot";
