# Backend Session - Quick Start Brief

## 🎯 Task
Add category name validation to prevent invalid category names

## 📝 Changes to Make

1. **Update** `editLaundryItemCategory()` in `vendor.service.ts`:
   - Add validation before updating category name
   - Check against allowed category names from `CATEGORY_SORT_ORDER`
   - Throw error if name doesn't match

## ✅ Allowed Names Only

- Saudi Wear
- Tops
- Bottoms
- Suits / Uniforms
- Under Wear
- Bed & Bath

## 📂 Files to Modify

- `src/modules/app/vendor/vendor.service.ts`

## 📖 Full Instructions

See `INSTRUCTIONS.md` in this folder for step-by-step guide.

## ⏱️ Estimated Time

5 minutes
