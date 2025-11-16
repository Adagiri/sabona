# Backend Updates V3 - Implementation Instructions

## 📝 Changes Summary

1. Add new category-filtered items endpoint
2. Add auto sortOrder calculation for new items
3. Fix laundry template with category-scoped sortOrders

---

## Step 1: Add New Endpoint to Admin Controller

**File:** `src/modules/app/admin/admin.controller.ts`

**Location:** After the existing `getAllLaundryServiceItems` method (around line 470)

**Add this code:**

```typescript
@Authorized(UserType.ADMIN)
@IgnoreTranslation()
@Get({
    path: '/laundry/:laundryId/service/:serviceId/category/:categoryId/items',
    description: 'Get laundry service items filtered by category',
    response: {},
})
async getLaundryServiceItemsByCategory(
    @Param('laundryId') laundryId: string,
    @Param('serviceId') serviceId: string,
    @Param('categoryId') categoryId: string,
): Promise<any> {
    return await this._vendorService.getLaundryServiceItemsByCategory(laundryId, serviceId, categoryId);
}
```

---

## Step 2: Add Service Method for Category Filtering

**File:** `src/modules/app/vendor/vendor.service.ts`

**Location:** After the existing `getAllLaundryServiceItems` method (around line 1230)

**Add this complete method:**

```typescript
async getLaundryServiceItemsByCategory(laundryId: string, serviceId: string, categoryId: string): Promise<any> {
    const laundry = await this._dbService.laundry.findFirst({
        where: {
            id: laundryId,
        },
    });

    if (!laundry) {
        throw new BadRequestException('Laundry does not exist');
    }

    const service = await this._dbService.laundryService.findFirst({
        where: {
            id: serviceId,
            laundryId: laundryId,
        },
    });

    if (!service) {
        throw new BadRequestException('Service does not exist');
    }

    const category = await this._dbService.laundryItemCategory.findFirst({
        where: {
            id: categoryId,
            deletedAt: null,
        },
    });

    if (!category) {
        throw new BadRequestException('Category does not exist');
    }

    const items = await this._dbService.laundryServiceItem.findMany({
        where: {
            laundryServiceId: serviceId,
            categoryId: categoryId,
            deletedAt: null,
        },
        select: {
            id: true,
            name: true,
            nameLocale: true,
            createdAt: true,
            vendorPrice: true,
            platformPrice: true,
            expressPrice: true,
            sortOrder: true,
            categoryId: true,
            category: {
                select: {
                    id: true,
                    name: true,
                    nameLocale: true,
                    icon: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            media: {
                                select: {
                                    id: true,
                                    path: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            sortOrder: 'asc',
        },
    });

    return { data: items };
}
```

---

## Step 3: Update addLaundryServiceItem for Auto sortOrder

**File:** `src/modules/app/vendor/vendor.service.ts`

**Location:** In the `addLaundryServiceItem` method (around line 980)

**Replace this section:**

```typescript
const items = data.items.map((item) => ({
    nameLocale: item.nameLocale,
    name: item.nameLocale.en,
    vendorPrice: item.vendorPrice,
    platformPrice: item.platformPrice,
    expressPrice: item.expressPrice,
    categoryId: item.categoryId,
    subCategoryId: item.subCategoryId,
    sortOrder: item.sortOrder,
    laundryServiceId: serviceId,
}));

const createdItems = await this._dbService.laundryServiceItem.createMany({
    data: items,
});
```

**With this:**

```typescript
// Auto-calculate sortOrder for items that don't have it (category-scoped)
const itemsWithSortOrder = await Promise.all(
    data.items.map(async (item) => {
        let sortOrder = item.sortOrder;

        // If sortOrder not provided, auto-calculate based on service + category
        if (sortOrder === undefined || sortOrder === null) {
            const maxSortOrderResult = await this._dbService.laundryServiceItem.findFirst({
                where: {
                    laundryServiceId: serviceId,
                    categoryId: item.categoryId,
                    deletedAt: null,
                },
                orderBy: {
                    sortOrder: 'desc',
                },
                select: {
                    sortOrder: true,
                },
            });

            // Set sortOrder to max + 1, or 1 if no items exist in this service+category
            sortOrder = (maxSortOrderResult?.sortOrder ?? 0) + 1;
        }

        return {
            nameLocale: item.nameLocale,
            name: item.nameLocale.en, // Auto-populate from English
            vendorPrice: item.vendorPrice,
            platformPrice: item.platformPrice,
            expressPrice: item.expressPrice,
            categoryId: item.categoryId,
            subCategoryId: item.subCategoryId,
            sortOrder: sortOrder,
            laundryServiceId: serviceId,
        };
    }),
);

const createdItems = await this._dbService.laundryServiceItem.createMany({
    data: itemsWithSortOrder,
});
```

---

## Step 4: Update Laundry Template

**File:** `src/constants/laundry-template.ts`

**Option 1:** Replace entire file with `files/laundry-template.ts`

**Option 2:** Manually add `sortOrder` to each item:

1. Update the interface (line 6):
```typescript
export interface LaundryItemTemplate {
  nameLocale: { en: string; ar: string; };
  vendorPrice: number;
  platformPrice: number;
  expressPrice: number;
  sortOrder: number; // ADD THIS
}
```

2. Add `sortOrder: N` to each item in each category:
   - Saudi Wear: 12 items → sortOrder 1-12
   - Tops: 8 items → sortOrder 1-8
   - Bottoms: 8 items → sortOrder 1-8
   - Suits/Uniforms: 12 items → sortOrder 1-12
   - Under Wear: 4 items → sortOrder 1-4
   - Bed & Bath: 12 items → sortOrder 1-12

**Example:**
```typescript
{
  nameLocale: { en: 'White Thobe', ar: 'الثوب الابيض' },
  vendorPrice: 5,
  platformPrice: 6,
  expressPrice: 6,
  sortOrder: 1, // ADD THIS
},
```

---

## ✅ Testing

1. Start backend server
2. Test new endpoint:
   ```bash
   GET /admin/laundry/{id}/service/{id}/category/{id}/items
   ```
3. Create a new item without sortOrder - verify it auto-assigns
4. Create a new laundry - verify items have proper sortOrders

---

## 🚀 Deployment

```bash
git add -A
git commit -m "feat: Add category-filtered items endpoint and auto sortOrder"
git push origin dev
```
