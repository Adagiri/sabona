# Backend Updates - Sidebar Sections & Category Navigation

## 📋 Overview
This update adds sortOrder field to LaundryService and creates reordering endpoints for services and items.

## 🎯 Changes Summary
- Add `sortOrder` field to LaundryService model
- Create migration for the new field
- Add 3 new DTO files for reordering
- Add 2 new controller endpoints
- Add 2 new service methods for reordering

## 📝 Step-by-Step Instructions

### 1. Database Schema Update
**File:** `prisma/schema.prisma`
**Action:** Add line 514 (after `icon` field in LaundryService model)
```typescript
  sortOrder           Int? // For custom sorting of services within a laundry
```

**Full context (lines 504-520):**
```typescript
model LaundryService {
  id                  String                @id @default(uuid())
  laundryId           String
  laundry             Laundry               @relation(fields: [laundryId], references: [id])
  name                String
  nameLocale          Json?                 @db.JsonB
  description         String?
  descriptionLocale   Json?                 @db.JsonB
  iconId              Int?
  icon                Icon?                 @relation("ServiceIcon", fields: [iconId], references: [id])
  sortOrder           Int? // For custom sorting of services within a laundry  <-- ADD THIS
  laundryServiceItems LaundryServiceItem[] // Relation to LaundryServiceItem model
  createdAt           DateTime              @default(now()) @db.Timestamptz()
  updatedAt           DateTime              @default(now()) @updatedAt @db.Timestamptz()
  deletedAt           DateTime?             @db.Timestamptz()
  OrderLaundryService OrderLaundryService[]
}
```

### 2. Create Migration
**Action:** Create directory and file
```bash
mkdir -p prisma/migrations/20251116000000_add_sortorder_to_laundry_service
```

**File:** `prisma/migrations/20251116000000_add_sortorder_to_laundry_service/migration.sql`
**Content:** Copy from `files/migration.sql`

### 3. Add New DTO Files
**Files to create:**
1. `src/modules/app/vendor/dto/request/reorderServices.request.ts`
2. `src/modules/app/vendor/dto/request/reorderItems.request.ts`
3. `src/modules/app/vendor/dto/response/reorder.response.ts`

**Action:** Copy these 3 files from the `files/` directory to their respective locations.

### 4. Update Admin Controller
**File:** `src/modules/app/admin/admin.controller.ts`

**Location 1:** After `deleteLaundryService` method (around line 413)
**Action:** Add the `reorderLaundryServices` method from `files/controller-method-1.ts`

**Location 2:** After `deleteLaundryServiceItem` method (around line 485)
**Action:** Add the `reorderLaundryServiceItems` method from `files/controller-method-2.ts`

### 5. Update Vendor Service
**File:** `src/modules/app/vendor/vendor.service.ts`

**Location:** At the end of the class (before the closing `}`)
**Action:** Add both methods from `files/vendor-service-methods.ts`

## ✅ Verification Checklist
- [ ] Schema updated with sortOrder field
- [ ] Migration file created
- [ ] 3 DTO files created
- [ ] 2 controller methods added
- [ ] 2 service methods added
- [ ] Code compiles without errors
- [ ] Run `npx prisma generate` to update Prisma client

## 🚀 Deployment
After applying changes:
```bash
git add -A
git commit -m "feat: Add sortOrder field and reordering endpoints for services and items"
git push -u origin claude/sortorder-and-reordering-0145k7K8cqxXHiKhaxSNNE1u
```

## 📌 Notes
- Items are ordered within service+category scope (not globally)
- Services are ordered within laundry scope
- All validations ensure data integrity before reordering
