/*
  Warnings:

  - The values [EXPRESS_PRO,EXPRESS_PLUS] on the enum `DeliveryType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeliveryType_new" AS ENUM ('NORMAL', 'EXPRESS');
ALTER TABLE "Order" ALTER COLUMN "deliveryType" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "deliveryType" TYPE "DeliveryType_new" USING ("deliveryType"::text::"DeliveryType_new");
ALTER TYPE "DeliveryType" RENAME TO "DeliveryType_old";
ALTER TYPE "DeliveryType_new" RENAME TO "DeliveryType";
DROP TYPE "DeliveryType_old";
ALTER TABLE "Order" ALTER COLUMN "deliveryType" SET DEFAULT 'NORMAL';
COMMIT;
