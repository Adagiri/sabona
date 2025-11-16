# Backend Updates V2 - Instructions

## 🎯 Changes Overview

1. **Add database indexes** for sortOrder fields (performance)
2. **Add single-item order change endpoints** (move item up/down)
3. **Update existing fetch methods** to order by sortOrder

---

## 📝 Step-by-Step Instructions

### 1. Add Database Indexes Migration

**Create directory:**
```bash
mkdir -p prisma/migrations/20251117000000_add_sortorder_indexes
```

**File:** `prisma/migrations/20251117000000_add_sortorder_indexes/migration.sql`
**Content:** Copy from `files/indexes-migration.sql`

This adds:
- Index on `LaundryService(laundryId, sortOrder)` where deletedAt is null
- Index on `LaundryServiceItem(laundryServiceId, categoryId, sortOrder)` where deletedAt is null

### 2. Add Single-Item Order Change Endpoints

**File:** `src/modules/app/admin/admin.controller.ts`

**Location 1:** After `reorderLaundryServices` method (around line 427)
**Action:** Add method from `files/controller-change-service-order.ts`

**Location 2:** After `reorderLaundryServiceItems` method (around line 501)
**Action:** Add method from `files/controller-change-item-order.ts`

### 3. Add Service Layer Methods

**File:** `src/modules/app/vendor/vendor.service.ts`

**Location:** After the existing reorder methods (end of class)
**Action:** Add both methods from `files/vendor-service-change-order.ts`

### 4. Update Existing Fetch Methods

**File:** `src/modules/app/vendor/vendor.service.ts`

**Method 1:** Find `getLaundryServices` method
**Add:** Order by sortOrder:
```typescript
orderBy: {
    sortOrder: 'asc',
},
```

**Method 2:** Find `getAllLaundryServiceItems` method
**Add:** Order by sortOrder:
```typescript
orderBy: {
    sortOrder: 'asc',
},
```

---

## ✅ Verification

- [ ] Migration file created
- [ ] 2 controller methods added
- [ ] 2 service methods added
- [ ] Existing fetch methods updated with orderBy
- [ ] Run `npx prisma migrate dev` to apply indexes
- [ ] Code compiles without errors

---

## 🚀 Test Endpoints

**Change service order:**
```bash
PATCH /admin/laundry/:laundryId/service/:serviceId/change-order
Body: { newPosition: 2 }
```

**Change item order:**
```bash
PATCH /admin/laundry/:laundryId/service/:serviceId/category/:categoryId/item/:itemId/change-order
Body: { newPosition: 3 }
```

---

## 📌 Notes

- Positions are 1-indexed (1, 2, 3...)
- Moving item automatically adjusts other items' positions
- Validation ensures position is within valid range
- All operations maintain category-scoping for items
