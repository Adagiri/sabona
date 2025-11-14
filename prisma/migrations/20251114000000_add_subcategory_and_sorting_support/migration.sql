-- Add sortOrder to LaundryItemCategory
ALTER TABLE "LaundryItemCategory" ADD COLUMN "sortOrder" INTEGER;

-- Add sortOrder to LaundryService
ALTER TABLE "LaundryService" ADD COLUMN "sortOrder" INTEGER;

-- Create LaundryItemSubCategory table
CREATE TABLE "LaundryItemSubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLocale" JSONB,
    "description" TEXT,
    "descriptionLocale" JSONB,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "LaundryItemSubCategory_pkey" PRIMARY KEY ("id")
);

-- Add subCategoryId and sortOrder to LaundryServiceItem
ALTER TABLE "LaundryServiceItem" ADD COLUMN "subCategoryId" TEXT;
ALTER TABLE "LaundryServiceItem" ADD COLUMN "sortOrder" INTEGER;

-- Add foreign key constraints
ALTER TABLE "LaundryItemSubCategory" ADD CONSTRAINT "LaundryItemSubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LaundryItemCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LaundryServiceItem" ADD CONSTRAINT "LaundryServiceItem_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "LaundryItemSubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update existing categories with sort orders
UPDATE "LaundryItemCategory" SET "sortOrder" = 1 WHERE "name" = 'Saudi Wear';
UPDATE "LaundryItemCategory" SET "sortOrder" = 2 WHERE "name" = 'Tops';
UPDATE "LaundryItemCategory" SET "sortOrder" = 3 WHERE "name" = 'Bottoms';
UPDATE "LaundryItemCategory" SET "sortOrder" = 4 WHERE "name" = 'Suits / Uniforms';
UPDATE "LaundryItemCategory" SET "sortOrder" = 5 WHERE "name" = 'Under Wear';
UPDATE "LaundryItemCategory" SET "sortOrder" = 6 WHERE "name" = 'Bed & Bath';
