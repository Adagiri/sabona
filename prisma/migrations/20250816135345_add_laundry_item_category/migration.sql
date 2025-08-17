-- AlterTable
ALTER TABLE "LaundryServiceItem" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "LaundryItemCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconId" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "LaundryItemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LaundryItemCategory_name_key" ON "LaundryItemCategory"("name");

-- AddForeignKey
ALTER TABLE "LaundryItemCategory" ADD CONSTRAINT "LaundryItemCategory_iconId_fkey" FOREIGN KEY ("iconId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaundryServiceItem" ADD CONSTRAINT "LaundryServiceItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LaundryItemCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
