-- CreateIndex
-- Index for efficient service ordering queries within a laundry
CREATE INDEX "LaundryService_laundryId_sortOrder_idx" ON "LaundryService"("laundryId", "sortOrder")
WHERE "deletedAt" IS NULL;

-- CreateIndex
-- Index for efficient item ordering queries within service + category
CREATE INDEX "LaundryServiceItem_laundryServiceId_categoryId_sortOrder_idx" ON "LaundryServiceItem"("laundryServiceId", "categoryId", "sortOrder")
WHERE "deletedAt" IS NULL;

-- CreateIndex
-- Index for category-based queries
CREATE INDEX "LaundryServiceItem_categoryId_idx" ON "LaundryServiceItem"("categoryId")
WHERE "deletedAt" IS NULL;
