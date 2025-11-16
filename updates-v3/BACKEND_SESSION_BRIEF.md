# Backend Session - Quick Start Brief

## 🎯 Task
Implement backend filtering for items by category + auto sortOrder assignment

## 📝 Changes to Make

1. **Add new endpoint** in `admin.controller.ts`:
   - `GET /admin/laundry/:id/service/:id/category/:id/items`

2. **Add service method** in `vendor.service.ts`:
   - `getLaundryServiceItemsByCategory()`

3. **Update** `addLaundryServiceItem()` in `vendor.service.ts`:
   - Auto-calculate sortOrder if not provided
   - Category-scoped (service + category combination)

4. **Fix laundry template** in `laundry-template.ts`:
   - Add `sortOrder: number` to interface
   - Add sortOrder to all items (1-N per category)

## 📂 Files to Modify

- `src/modules/app/admin/admin.controller.ts`
- `src/modules/app/vendor/vendor.service.ts`
- `src/constants/laundry-template.ts`

## 📖 Full Instructions

See `INSTRUCTIONS.md` in this folder for step-by-step guide.

## ⏱️ Estimated Time

15-20 minutes
