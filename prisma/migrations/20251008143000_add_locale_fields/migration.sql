-- Add *Locale columns
ALTER TABLE "Laundry" 
  ADD COLUMN "nameLocale" JSONB,
  ADD COLUMN "addressLocale" JSONB;

ALTER TABLE "LaundryService" 
  ADD COLUMN "nameLocale" JSONB,
  ADD COLUMN "descriptionLocale" JSONB;

ALTER TABLE "LaundryItemCategory" 
  ADD COLUMN "nameLocale" JSONB,
  ADD COLUMN "descriptionLocale" JSONB;

ALTER TABLE "LaundryServiceItem" 
  ADD COLUMN "nameLocale" JSONB;

ALTER TABLE "Coupon" 
  ADD COLUMN "nameLocale" JSONB;

-- Populate *Locale fields with existing values (both en and ar get same value initially)
UPDATE "Laundry" 
SET "nameLocale" = jsonb_build_object('en', "name", 'ar', "name"),
    "addressLocale" = jsonb_build_object('en', COALESCE("address", ''), 'ar', COALESCE("address", ''))
WHERE "nameLocale" IS NULL;

UPDATE "LaundryService" 
SET "nameLocale" = jsonb_build_object('en', "name", 'ar', "name"),
    "descriptionLocale" = jsonb_build_object('en', COALESCE("description", ''), 'ar', COALESCE("description", ''))
WHERE "nameLocale" IS NULL;

UPDATE "LaundryItemCategory" 
SET "nameLocale" = jsonb_build_object('en', "name", 'ar', "name"),
    "descriptionLocale" = jsonb_build_object('en', COALESCE("description", ''), 'ar', COALESCE("description", ''))
WHERE "nameLocale" IS NULL;

UPDATE "LaundryServiceItem" 
SET "nameLocale" = jsonb_build_object('en', "name", 'ar', "name")
WHERE "nameLocale" IS NULL;

UPDATE "Coupon" 
SET "nameLocale" = jsonb_build_object('en', "name", 'ar', "name")
WHERE "nameLocale" IS NULL;