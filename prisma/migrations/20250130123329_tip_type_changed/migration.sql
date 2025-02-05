/*
  Warnings:

  - The values [PICKUP_RIDER,DROPOFF_RIDER] on the enum `TipType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipType_new" AS ENUM ('RIDER_PICKUP', 'RIDER_DELIVERY');
ALTER TABLE "Tip" ALTER COLUMN "type" TYPE "TipType_new" USING ("type"::text::"TipType_new");
ALTER TYPE "TipType" RENAME TO "TipType_old";
ALTER TYPE "TipType_new" RENAME TO "TipType";
DROP TYPE "TipType_old";
COMMIT;
