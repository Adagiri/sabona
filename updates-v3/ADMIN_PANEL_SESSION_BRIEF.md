# Admin Panel Session - Quick Start Brief

## 🎯 Task
Use backend-filtered items endpoint instead of frontend filtering

## 📝 Changes to Make

1. **Add new hook** in `hooks/Admin/query/index.ts`:
   - `useFetchLaundryServiceItemsByCategory()`
   - Calls new backend endpoint with categoryId

2. **Update** `pages/LaundryServiceItems.tsx`:
   - Import new hook
   - Use new hook instead of old one
   - Remove frontend filtering logic

## 📂 Files to Modify

- `src/hooks/Admin/query/index.ts`
- `src/pages/LaundryServiceItems.tsx`

## 📖 Full Instructions

See `INSTRUCTIONS.md` in this folder for step-by-step guide.

## ⏱️ Estimated Time

5-10 minutes

## ⚠️ Important

Backend changes must be deployed FIRST before deploying frontend changes.
